import assert from "node:assert/strict";
import test from "node:test";
import { FrontSide, ShaderLib } from "three";
import { createHeartTurnController } from "../app/components/heart-motion.ts";
import { HEART_IMAGE_SIZE, HEART_OUTLINE, HEART_OUTLINE_BOUNDS } from "../app/components/heart-outline.ts";
import { createHeartGeometry } from "../app/components/heart-geometry.ts";
import { createHeartSideMaterial } from "../app/components/heart-material.ts";

function almostEqual(actual, expected, message, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, received ${actual}`);
}

test("each accepted heart turn is one slow half-turn with a 3.6-second ease-in-out", () => {
  const controller = createHeartTurnController();
  almostEqual(controller.angle, 0, "Initial angle");
  assert.equal(controller.busy, false);
  assert.equal(controller.request(1000), true);
  almostEqual(controller.target, Math.PI, "A single request targets only half a turn");

  for (const [elapsed, fraction] of [[0, 0], [900, 1 / 16], [1800, 1 / 2], [2700, 15 / 16], [3599, null]]) {
    const state = controller.sample(1000 + elapsed);
    assert.equal(state.busy, true, `Turn must still be active after ${elapsed} ms`);
    if (fraction !== null) almostEqual(state.angle, Math.PI * fraction, `Eased angle after ${elapsed} ms`);
    assert.ok(state.angle >= 0 && state.angle < Math.PI);
  }

  const complete = controller.sample(4600);
  assert.equal(complete.busy, false);
  almostEqual(complete.angle, Math.PI, "Completion stops at half a turn");
  almostEqual(controller.sample(10_000).angle, Math.PI, "A finished turn does not keep spinning");
});

test("clicks and scroll re-entry while rotating are ignored, never queued", () => {
  const controller = createHeartTurnController();
  assert.equal(controller.request(0), true);
  const midway = controller.sample(1000).angle;
  for (let request = 0; request < 20; request++) assert.equal(controller.request(1000 + request), false);
  almostEqual(controller.target, Math.PI, "Rejected triggers must not add turns");
  almostEqual(controller.sample(1000).angle, midway, "Rejected triggers must not restart or jump the animation");
  assert.equal(controller.sample(3600).busy, false);
  const still = controller.sample(7200);
  assert.equal(still.busy, false);
  almostEqual(still.angle, Math.PI, "No queued rotation starts after completion");
});

test("the next trigger after completion rotates another half-turn from the current angle", () => {
  const controller = createHeartTurnController();
  controller.request(0);
  controller.sample(3600);
  assert.equal(controller.request(4000), true);
  almostEqual(controller.sample(4000).angle, Math.PI, "Second turn starts without jumping");
  almostEqual(controller.target, 2 * Math.PI, "Second request adds exactly half a turn");
  almostEqual(controller.sample(5800).angle, 1.5 * Math.PI, "Second turn halfway point");
  assert.equal(controller.sample(7600).busy, false);
  almostEqual(controller.angle, 2 * Math.PI, "Two distinct accepted triggers total one full turn");
});

test("reduced-motion turns resolve immediately and remain idle", () => {
  const controller = createHeartTurnController();
  assert.equal(controller.request(1000, true), true);
  assert.equal(controller.busy, false);
  almostEqual(controller.angle, Math.PI, "Reduced motion immediately reaches the half-turn pose");
  for (const time of [1000, 1200, 5000]) {
    const state = controller.sample(time);
    assert.equal(state.busy, false);
    almostEqual(state.angle, Math.PI, "No motion continues when reduced motion is requested");
  }
});

test("changing to reduced motion during a turn finishes once and releases its busy state", () => {
  const controller = createHeartTurnController();
  controller.request(0);
  const moving = controller.sample(900);
  assert.equal(moving.busy, true);
  assert.ok(moving.angle > 0 && moving.angle < Math.PI);
  const stopped = controller.finish();
  assert.equal(stopped.busy, false);
  almostEqual(stopped.angle, Math.PI, "Preference change finishes the accepted half-turn");
  almostEqual(controller.sample(10_000).angle, Math.PI, "Stopped turn cannot resume");
  assert.equal(controller.sample(10_000).busy, false);
  assert.equal(controller.request(10_001, true), true);
  almostEqual(controller.angle, 2 * Math.PI, "The next reduced-motion trigger is one additional half-turn");
  assert.equal(controller.busy, false);
});

test("the heart silhouette retains the source artwork proportions, notch, and pointed tip", () => {
  assert.deepEqual(HEART_IMAGE_SIZE, { width: 700, height: 933 });
  assert.ok(HEART_OUTLINE.length > 100, "The outline must be sampled finely rather than a generic heart polygon");
  for (const [x, y] of HEART_OUTLINE) {
    assert.ok(Number.isFinite(x) && Number.isFinite(y));
    assert.ok(x >= 0 && x <= HEART_IMAGE_SIZE.width);
    assert.ok(y >= 0 && y <= HEART_IMAGE_SIZE.height);
  }
  const xs = HEART_OUTLINE.map(([x]) => x);
  const ys = HEART_OUTLINE.map(([, y]) => y);
  const bounds = {
    minX: Math.min(...xs), minY: Math.min(...ys),
    maxX: Math.max(...xs), maxY: Math.max(...ys),
  };
  bounds.width = bounds.maxX - bounds.minX;
  bounds.height = bounds.maxY - bounds.minY;
  assert.deepEqual(bounds, HEART_OUTLINE_BOUNDS);
  almostEqual(bounds.width / bounds.height, 646 / 620, "Original outer silhouette aspect ratio", 0.01);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const [notchX, notchY] = HEART_OUTLINE[0];
  assert.ok(Math.abs(notchX - centerX) < bounds.width * 0.02, "The upper notch should stay near the horizontal center");
  assert.ok(notchY > bounds.minY + bounds.height * 0.1 && notchY < bounds.minY + bounds.height * 0.2);
  const tip = HEART_OUTLINE.reduce((lowest, point) => point[1] > lowest[1] ? point : lowest);
  assert.ok(Math.abs(tip[0] - centerX) < bounds.width * 0.02, "The lower tip should remain centered");
  assert.notDeepEqual(HEART_OUTLINE[0], HEART_OUTLINE.at(-1), "Closing the shape must not duplicate a vertex");
});

test("the heart mesh is one closed solid with a continuous sidewall joining both faces", () => {
  const geometry = createHeartGeometry(HEART_OUTLINE);
  try {
    const positions = geometry.getAttribute("position");
    const indices = geometry.getIndex();
    assert.ok(indices, "A solid mesh must have triangle indices");
    assert.equal(indices.count % 3, 0);
    assert.deepEqual(geometry.groups.map((group) => group.materialIndex), [0, 1, 2]);
    assert.ok(geometry.groups.every((group) => group.count > 0));
    assert.equal(geometry.groups.reduce((sum, group) => sum + group.count, 0), indices.count);

    // Texture seams duplicate cap vertices. Weld by actual spatial location,
    // then measure manifold connectivity independently of the mesh generator.
    const vertexIds = new Map();
    const ids = Array.from({ length: positions.count }, (_, index) => {
      const xyz = [positions.getX(index), positions.getY(index), positions.getZ(index)];
      assert.ok(xyz.every(Number.isFinite));
      const key = xyz.map((coordinate) => Math.round(coordinate * 10_000)).join(",");
      if (!vertexIds.has(key)) vertexIds.set(key, vertexIds.size);
      return vertexIds.get(key);
    });
    const edges = new Map();
    let signedVolume = 0;
    for (let offset = 0; offset < indices.count; offset += 3) {
      const group = geometry.groups.find((candidate) => offset >= candidate.start && offset < candidate.start + candidate.count);
      assert.ok(group);
      const vertices = [0, 1, 2].map((step) => indices.getX(offset + step));
      const triangle = vertices.map((index) => ids[index]);
      assert.equal(new Set(triangle).size, 3, "Every triangle must have three distinct spatial vertices");
      const [a, b, c] = vertices.map((index) => [positions.getX(index), positions.getY(index), positions.getZ(index)]);
      const ab = b.map((value, axis) => value - a[axis]);
      const ac = c.map((value, axis) => value - a[axis]);
      const cross = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
      assert.ok(Math.hypot(...cross) > 1e-6, "No side or cap triangle may have zero area");
      signedVolume += (a[0] * (b[1] * c[2] - b[2] * c[1])
        + a[1] * (b[2] * c[0] - b[0] * c[2])
        + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
      for (const [from, to] of [[triangle[0], triangle[1]], [triangle[1], triangle[2]], [triangle[2], triangle[0]]]) {
        const key = from < to ? `${from}:${to}` : `${to}:${from}`;
        const uses = edges.get(key) ?? [];
        uses.push(group.materialIndex);
        edges.set(key, uses);
      }
    }
    assert.ok(signedVolume > 0, "Triangle winding must describe an outward-facing nonzero volume");
    for (const [edge, uses] of edges) assert.equal(uses.length, 2, `Open or overlapping edge ${edge}`);
    for (const face of [1, 2]) {
      const joins = [...edges.values()].filter((uses) => uses.includes(0) && uses.includes(face));
      assert.equal(joins.length, HEART_OUTLINE.length, `The entire ${face === 1 ? "front" : "back"} perimeter must join the sidewall`);
    }
    assert.equal(vertexIds.size - edges.size + indices.count / 3, 2, "The mesh must be one genus-zero closed solid, not separate stacked surfaces");
  } finally {
    geometry.dispose();
  }
});

test("the solid is exactly three times thicker with a smooth inward bevel and unchanged silhouette", () => {
  const geometry = createHeartGeometry(HEART_OUTLINE);
  try {
    geometry.computeBoundingBox();
    const { min, max } = geometry.boundingBox;
    const width = max.x - min.x;
    const height = max.y - min.y;
    const thickness = max.z - min.z;
    almostEqual(width, HEART_OUTLINE_BOUNDS.width, "Outer mesh width", 0.001);
    almostEqual(height, HEART_OUTLINE_BOUNDS.height, "Outer mesh height", 0.001);
    almostEqual(width / height, 646 / 620, "Unstretched source silhouette", 0.001);
    almostEqual(thickness, 78 * 3, "Side depth must be exactly three times the previously published 78-unit thickness");
    almostEqual(min.z, -max.z, "Thickness should be centred on the rotation plane", 0.001);

    const positions = geometry.getAttribute("position");
    const rings = new Map();
    for (let index = 0; index < positions.count; index++) {
      const z = Math.round(positions.getZ(index) * 1000) / 1000;
      const ring = rings.get(z) ?? [];
      ring.push([positions.getX(index), positions.getY(index)]);
      rings.set(z, ring);
    }
    const frontBevelRings = [...rings.keys()].filter((z) => z > 0);
    const backBevelRings = [...rings.keys()].filter((z) => z < 0);
    assert.ok(frontBevelRings.length >= 10 && backBevelRings.length >= 10, "Each bevel needs enough distinct depth rings for a rounded edge");
    const ringWidth = (ring) => Math.max(...ring.map(([x]) => x)) - Math.min(...ring.map(([x]) => x));
    const frontWidth = ringWidth(rings.get(max.z));
    const backWidth = ringWidth(rings.get(min.z));
    assert.ok(frontWidth < width - 10 && backWidth < width - 10, "Both face caps must contract inward to expose rounded side edges");
    almostEqual(frontWidth, backWidth, "Matching front/back bevel profiles", 0.001);
    for (const ring of rings.values()) assert.ok(ringWidth(ring) <= width + 0.001, "No bevel ring may expand beyond the source artwork");

    const uvs = geometry.getAttribute("uv");
    assert.equal(uvs.count, positions.count);
    for (let index = 0; index < uvs.count; index++) {
      for (const coordinate of [uvs.getX(index), uvs.getY(index)]) {
        assert.ok(Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 1, "Texture UVs must stay in the source artwork");
      }
    }
  } finally {
    geometry.dispose();
  }
});

test("the sidewall material is fully rough and nonreflective while retaining its matte pink color", () => {
  const material = createHeartSideMaterial();
  try {
    assert.equal(material.isMeshPhysicalMaterial, true);
    assert.equal(material.roughness, 1);
    assert.equal(material.metalness, 0);
    assert.equal(material.clearcoat, 0);
    assert.equal(material.specularIntensity, 0);
    assert.equal(material.sheen, 0);
    assert.equal(material.color.getHexString(), "deadb9");
    assert.equal(material.side, FrontSide);
    assert.equal(material.map, null, "Sidewall grain must not replace or consume the photographic face texture");
  } finally {
    material.dispose();
  }
});

test("matte grain shader injection is stable, object-attached, and leaves Three shader sources untouched", () => {
  const material = createHeartSideMaterial();
  const source = Object.freeze({
    vertexShader: ShaderLib.physical.vertexShader,
    fragmentShader: ShaderLib.physical.fragmentShader,
  });
  // Execute the actual material hook on an isolated shader value, returning a
  // fresh result without compiling on a GPU or mutating Three's shared library.
  const compileFixture = () => {
    const shader = { ...source, uniforms: {} };
    material.onBeforeCompile(shader);
    return shader;
  };
  try {
    const first = compileFixture();
    const second = compileFixture();
    assert.notEqual(first.vertexShader, source.vertexShader);
    assert.notEqual(first.fragmentShader, source.fragmentShader);
    assert.deepEqual(first, second, "Identical shader inputs must produce identical grain, not animated random noise");
    assert.ok(first.vertexShader.includes("vHeartMattePosition = position;"), "Grain coordinates must stay attached to the original model position");
    assert.ok(first.fragmentShader.includes("vHeartMattePosition"));
    assert.match(first.fragmentShader, /diffuseColor\.rgb\s*\*=\s*mix\(0\.975,\s*1\.015,\s*matteGrain\)/, "Grain should subtly modulate only diffuse color, not add reflective highlights");
    assert.doesNotMatch(first.fragmentShader, /uniform\s+(?:float|vec\d)\s+(?:u?time|frame)\b/i, "Matte grain must not rely on a changing time or frame uniform");
    assert.ok(first.vertexShader.includes("#include <begin_vertex>"));
    assert.ok(first.fragmentShader.includes("#include <color_fragment>"));
    assert.deepEqual(source, {
      vertexShader: ShaderLib.physical.vertexShader,
      fragmentShader: ShaderLib.physical.fragmentShader,
    }, "Neither the fixture nor the global Three physical shader may be modified");
  } finally {
    material.dispose();
  }
});
