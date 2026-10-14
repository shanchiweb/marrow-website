"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  AmbientLight, DirectionalLight, FrontSide, Group, HemisphereLight, Mesh,
  MeshBasicMaterial, NoToneMapping, OrthographicCamera,
  Scene, SRGBColorSpace, Texture, TextureLoader, WebGLRenderer,
} from "three";
import { createHeartGeometry } from "./heart-geometry";
import { createHeartTurnController } from "./heart-motion";
import { createHeartSideMaterial } from "./heart-material";
import { HEART_IMAGE_SIZE, HEART_OUTLINE } from "./heart-outline";

export type HeartModelHandle = { turnHalf(): void };

/** Photographic front/back caps on a real, closed bevelled ceramic-heart solid. */
export const HeartModel = forwardRef<HeartModelHandle>(function HeartModel(_props, ref) {
  const host = useRef<HTMLSpanElement>(null);
  const trigger = useRef<(() => void) | null>(null);
  const pending = useRef(false);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    turnHalf() {
      if (trigger.current) trigger.current();
      else pending.current = true;
    },
  }), []);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    // A fresh canvas per effect keeps React Strict Mode remounts independent
    // of a disposed/lost WebGL context from the preceding effect instance.
    const element = document.createElement("canvas");
    element.className = "editorial-heart__canvas";
    element.setAttribute("aria-hidden", "true");
    container.insertBefore(element, container.firstChild);
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas: element, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      // A static original PNG remains visible on browsers without WebGL.
      element.remove();
      trigger.current = () => {};
      return () => { trigger.current = null; };
    }

    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new Scene();
    const camera = new OrthographicCamera(-350, 350, 466.5, -466.5, 1, 3000);
    camera.position.z = 1500;
    const geometry = createHeartGeometry(HEART_OUTLINE);
    const side = createHeartSideMaterial();
    // The original photograph preserves the embossed bow and its exact colours.
    // Reusing it on the back is an artistic approximation, not a scanned reverse.
    const front = new MeshBasicMaterial({ side: FrontSide, alphaTest: 0.02, toneMapped: false });
    const back = new MeshBasicMaterial({ side: FrontSide, alphaTest: 0.02, toneMapped: false });
    const solid = new Group();
    const sourceCenter = geometry.userData.sourceCenter as { x: number; y: number };
    solid.position.set(sourceCenter.x - HEART_IMAGE_SIZE.width / 2, HEART_IMAGE_SIZE.height / 2 - sourceCenter.y, 0);
    solid.add(new Mesh(geometry, [side, front, back]));
    scene.add(solid);
    scene.add(new AmbientLight(0xffeef3, 0.75));
    scene.add(new HemisphereLight(0xfff8f9, 0xa36278, 1.15));
    const key = new DirectionalLight(0xffffff, 1.8);
    key.position.set(-450, 650, 950);
    scene.add(key);
    const rim = new DirectionalLight(0xffdae4, 0.7);
    rim.position.set(550, 150, -650);
    scene.add(rim);

    const motion = createHeartTurnController();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const initialRect = container.getBoundingClientRect();
    let visible = initialRect.bottom > 0 && initialRect.top < window.innerHeight;
    let disposed = false;
    let imageReady = false;
    let contextAvailable = true;
    let frame: number | null = null;
    let texture: Texture | null = null;

    function cancelFrame() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    }

    function render() {
      if (!disposed && imageReady && contextAvailable) renderer.render(scene, camera);
    }

    function tick(timeMs: number) {
      frame = null;
      if (disposed || !visible || document.hidden || !contextAvailable || !imageReady) return;
      const sample = motion.sample(timeMs);
      solid.rotation.y = sample.angle;
      render();
      if (sample.busy) scheduleFrame();
    }

    function scheduleFrame() {
      if (!disposed && visible && !document.hidden && contextAvailable && imageReady && frame === null) {
        frame = requestAnimationFrame(tick);
      }
    }

    function turnHalf() {
      if (disposed) return;
      if (!imageReady || !contextAvailable) {
        pending.current = true;
        return;
      }
      if (!motion.request(performance.now(), reducedMotion.matches)) return;
      solid.rotation.y = motion.angle;
      if (reducedMotion.matches) {
        cancelFrame();
        render();
      } else scheduleFrame();
    }
    trigger.current = turnHalf;

    function resize() {
      if (disposed) return;
      const bounds = container!.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      renderer.setSize(bounds.width, bounds.height, false);
      // Contain the complete 700×933 source canvas without distorting or clipping.
      const sourceAspect = HEART_IMAGE_SIZE.width / HEART_IMAGE_SIZE.height;
      const aspect = bounds.width / bounds.height;
      const viewWidth = aspect >= sourceAspect ? HEART_IMAGE_SIZE.height * aspect : HEART_IMAGE_SIZE.width;
      const viewHeight = aspect >= sourceAspect ? HEART_IMAGE_SIZE.height : HEART_IMAGE_SIZE.width / aspect;
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      solid.rotation.y = motion.sample(performance.now()).angle;
      render();
    }

    function onMotionPreference() {
      if (reducedMotion.matches) {
        solid.rotation.y = motion.finish().angle;
        cancelFrame();
        render();
      } else if (motion.busy) scheduleFrame();
    }

    function onVisibilityChange() {
      if (document.hidden) cancelFrame();
      else {
        solid.rotation.y = motion.sample(performance.now()).angle;
        if (visible) {
          render();
          if (motion.busy) scheduleFrame();
        }
      }
    }

    function onContextLost(event: Event) {
      if (disposed) return;
      event.preventDefault();
      contextAvailable = false;
      cancelFrame();
      setReady(false);
    }

    function onContextRestored() {
      if (disposed) return;
      contextAvailable = true;
      if (!imageReady) return;
      resize();
      setReady(true);
      if (pending.current) {
        pending.current = false;
        turnHalf();
      } else if (motion.busy) scheduleFrame();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      if (disposed) return;
      visible = entry.isIntersecting;
      if (!visible) cancelFrame();
      else {
        solid.rotation.y = motion.sample(performance.now()).angle;
        render();
        if (motion.busy) scheduleFrame();
      }
    });
    intersectionObserver.observe(container);
    reducedMotion.addEventListener("change", onMotionPreference);
    document.addEventListener("visibilitychange", onVisibilityChange);
    element.addEventListener("webglcontextlost", onContextLost);
    element.addEventListener("webglcontextrestored", onContextRestored);
    resize();

    texture = new TextureLoader().load("/design/heart.png", (loadedTexture) => {
      if (disposed) {
        loadedTexture.dispose();
        return;
      }
      loadedTexture.colorSpace = SRGBColorSpace;
      loadedTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      front.map = loadedTexture;
      back.map = loadedTexture;
      front.needsUpdate = true;
      back.needsUpdate = true;
      imageReady = true;
      resize();
      if (contextAvailable) setReady(true);
      if (pending.current) {
        pending.current = false;
        turnHalf();
      }
    }, undefined, () => {
      if (!disposed) {
        imageReady = false;
        setReady(false);
        cancelFrame();
      }
    });

    return () => {
      disposed = true;
      trigger.current = null;
      cancelFrame();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reducedMotion.removeEventListener("change", onMotionPreference);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      element.removeEventListener("webglcontextlost", onContextLost);
      element.removeEventListener("webglcontextrestored", onContextRestored);
      geometry.dispose();
      side.dispose();
      front.dispose();
      back.dispose();
      texture?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      element.remove();
    };
  }, []);

  return <span ref={host} className="editorial-heart__model" data-ready={ready ? "true" : "false"} aria-hidden="true">
    <img className="editorial-heart__fallback" src="/design/heart.png" alt="" draggable={false} />
  </span>;
});
