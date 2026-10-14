import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from "three";

export const HEART_MODEL_THICKNESS = 234;
export const HEART_MODEL_BEVEL_WIDTH = 14;
export const HEART_MODEL_BEVEL_SEGMENTS = 12;

type Outline = ReadonlyArray<readonly [number, number]>;
type GeometryOptions = { thickness?: number; bevelWidth?: number; bevelSegments?: number };

/** One closed solid: two textured caps joined by one continuous rounded sidewall. */
export function createHeartGeometry(outline: Outline, options: GeometryOptions = {}) {
  const thickness = options.thickness ?? HEART_MODEL_THICKNESS;
  const bevelWidth = options.bevelWidth ?? HEART_MODEL_BEVEL_WIDTH;
  const bevelSegments = options.bevelSegments ?? HEART_MODEL_BEVEL_SEGMENTS;
  if (outline.length < 3 || !Number.isFinite(thickness) || thickness <= 0
    || !Number.isFinite(bevelWidth) || bevelWidth <= 0 || bevelWidth * 2 >= thickness
    || !Number.isInteger(bevelSegments) || bevelSegments < 2
    || outline.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
    throw new Error("Invalid heart solid dimensions or outline.");
  }

  const minX = Math.min(...outline.map(([x]) => x));
  const maxX = Math.max(...outline.map(([x]) => x));
  const minY = Math.min(...outline.map(([, y]) => y));
  const maxY = Math.max(...outline.map(([, y]) => y));
  const width = maxX - minX;
  const height = maxY - minY;
  if (bevelWidth * 2 >= Math.min(width, height)) throw new Error("Heart bevel is too wide.");
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const points = outline.map(([x, y]) => new Vector2(x - centerX, centerY - y));
  if (ShapeUtils.isClockWise(points)) points.reverse();

  // The outermost ring is the measured PNG silhouette. The cap rings contract
  // slightly toward its centre, so the rounded bevel never expands that outline
  // or self-intersects at the heart's narrow tip and concave upper cleft.
  const profile: { inset: number; z: number }[] = [];
  for (let step = 0; step <= bevelSegments; step++) {
    const angle = step / bevelSegments * Math.PI / 2;
    profile.push({
      inset: bevelWidth * (1 - Math.sin(angle)),
      z: thickness / 2 - bevelWidth * (1 - Math.cos(angle)),
    });
  }
  profile.push({ inset: 0, z: -thickness / 2 + bevelWidth });
  for (let step = 1; step <= bevelSegments; step++) {
    const angle = step / bevelSegments * Math.PI / 2;
    profile.push({
      inset: bevelWidth * (1 - Math.cos(angle)),
      z: -thickness / 2 + bevelWidth * (1 - Math.sin(angle)),
    });
  }

  const count = points.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  for (const ring of profile) {
    const scaleX = 1 - 2 * ring.inset / width;
    const scaleY = 1 - 2 * ring.inset / height;
    for (const point of points) {
      const x = point.x * scaleX;
      const y = point.y * scaleY;
      positions.push(x, y, ring.z);
      uvs.push((x + centerX) / 700, 1 - (centerY - y) / 933);
    }
  }

  const indices: number[] = [];
  for (let ring = 0; ring < profile.length - 1; ring++) {
    for (let point = 0; point < count; point++) {
      const next = (point + 1) % count;
      const a = ring * count + point;
      const b = (ring + 1) * count + point;
      const c = (ring + 1) * count + next;
      const d = ring * count + next;
      indices.push(a, b, c, a, c, d);
    }
  }
  const sideIndexCount = indices.length;
  const innerPoints = points.map((point) => new Vector2(
    point.x * (1 - 2 * bevelWidth / width),
    point.y * (1 - 2 * bevelWidth / height),
  ));
  const capTriangles = ShapeUtils.triangulateShape(innerPoints, []);
  const frontOffset = positions.length / 3;
  const backOffset = frontOffset + count;
  for (const side of [1, -1]) {
    for (const point of innerPoints) {
      positions.push(point.x, point.y, side * thickness / 2);
      const u = (point.x + centerX) / 700;
      uvs.push(side === 1 ? u : 1 - u, 1 - (centerY - point.y) / 933);
    }
  }
  for (const [a, b, c] of capTriangles) {
    const ab = innerPoints[b].clone().sub(innerPoints[a]);
    const ac = innerPoints[c].clone().sub(innerPoints[a]);
    const forward = ab.x * ac.y - ab.y * ac.x > 0;
    indices.push(frontOffset + a, frontOffset + (forward ? b : c), frontOffset + (forward ? c : b));
  }
  const frontIndexCount = indices.length - sideIndexCount;
  for (const [a, b, c] of capTriangles) {
    const ab = innerPoints[b].clone().sub(innerPoints[a]);
    const ac = innerPoints[c].clone().sub(innerPoints[a]);
    const forward = ab.x * ac.y - ab.y * ac.x > 0;
    indices.push(backOffset + a, backOffset + (forward ? c : b), backOffset + (forward ? b : c));
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.addGroup(0, sideIndexCount, 0);
  geometry.addGroup(sideIndexCount, frontIndexCount, 1);
  geometry.addGroup(sideIndexCount + frontIndexCount, frontIndexCount, 2);
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute("normal");
  for (let point = 0; point < count; point++) {
    normals.setXYZ(point, 0, 0, 1);
    normals.setXYZ((profile.length - 1) * count + point, 0, 0, -1);
    normals.setXYZ(frontOffset + point, 0, 0, 1);
    normals.setXYZ(backOffset + point, 0, 0, -1);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData = {
    sourceCenter: { x: centerX, y: centerY },
    sourceBounds: { minX, minY, maxX, maxY, width, height },
    thickness,
    bevelWidth,
    bevelSegments,
    profileRingCount: profile.length,
    outlineVertexCount: count,
  };
  return geometry;
}
