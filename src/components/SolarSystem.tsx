"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { PLANETS } from "@/lib/planets";
import { TEXTURE_GENERATORS, generateSunTexture } from "@/lib/textures";
import { buildStars, drawScene } from "@/lib/renderer";
import { useGesture } from "@/hooks/useGesture";
import type { GestureType, PlanetData, StarData, NebulaCloud } from "@/lib/types";
import HUD from "./HUD";
import StartOverlay from "./StartOverlay";

export default function SolarSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkCanvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const [started, setStarted] = useState(false);
  const [gesture, setGesture] = useState<GestureType>("none");
  const [focusPlanet, setFocusPlanet] = useState<PlanetData | null>(null);
  const [orbitSpeed, setOrbitSpeed] = useState(1);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [texturesReady, setTexturesReady] = useState(false);

  // Animation state refs
  const stateRef = useRef({
    time: 0,
    zoom: 1,
    targetZoom: 1,
    camX: 0,
    targetCamX: 0,
    camY: 0,
    targetCamY: 0,
    orbitSpeedMul: 1,
    targetOrbitSpeed: 1,
    focusPlanet: null as PlanetData | null,
    focusIdx: 0,
    stars: [] as StarData[],
    nebulae: [] as NebulaCloud[],
    sunTexture: null as HTMLCanvasElement | null,
    planetTextures: new Map<string, { texture: HTMLCanvasElement; texSize: number }>(),
    planetRotations: PLANETS.map(() => Math.random() * Math.PI * 2),
    mouseX: 0,
    mouseY: 0,
    width: 0,
    height: 0,
  });

  const handleGesture = useCallback(
    (g: GestureType) => {
      setGesture(g);
      const s = stateRef.current;

      if (g === "open") {
        s.targetZoom = 0.45;
        s.targetCamX = 0;
        s.targetCamY = 0;
        s.targetOrbitSpeed = 8;
        s.focusPlanet = null;
        setFocusPlanet(null);
      } else if (g === "fist") {
        s.focusIdx = (s.focusIdx + 1) % PLANETS.length;
        const best = PLANETS[s.focusIdx];
        s.focusPlanet = best;
        s.targetZoom = 6;
        s.targetOrbitSpeed = 0.3;
        setFocusPlanet(best);

        const a = best.phase + s.time * best.speed * s.orbitSpeedMul;
        s.targetCamX = -Math.cos(a) * best.orbit * s.targetZoom;
        s.targetCamY = -Math.sin(a) * best.orbit * 0.35 * s.targetZoom;
      } else {
        s.targetOrbitSpeed = 1;
      }
    },
    []
  );

  const { cameraFailed } = useGesture(
    videoRef,
    landmarkCanvasRef,
    handleGesture,
    started
  );

  // Generate textures on start
  useEffect(() => {
    if (!started) return;

    const TEX_SIZE = 256;
    const s = stateRef.current;
    s.sunTexture = generateSunTexture(TEX_SIZE);

    for (const planet of PLANETS) {
      const gen = TEXTURE_GENERATORS[planet.en];
      if (gen) {
        s.planetTextures.set(planet.en, {
          texture: gen(TEX_SIZE),
          texSize: TEX_SIZE,
        });
      }
    }

    setTexturesReady(true);
  }, [started]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const s = stateRef.current;

    function resize() {
      s.width = canvas!.width = window.innerWidth;
      s.height = canvas!.height = window.innerHeight;
      const { stars, nebulae } = buildStars(s.width, s.height);
      s.stars = stars;
      s.nebulae = nebulae;
    }

    resize();
    window.addEventListener("resize", resize);

    function tick() {
      animId = requestAnimationFrame(tick);
      s.time += 0.016;

      const spd = 0.06;
      s.zoom += (s.targetZoom - s.zoom) * spd;
      s.camX += (s.targetCamX - s.camX) * spd;
      s.camY += (s.targetCamY - s.camY) * spd;
      s.orbitSpeedMul += (s.targetOrbitSpeed - s.orbitSpeedMul) * 0.04;

      // Track focused planet
      if (s.focusPlanet) {
        const a =
          s.focusPlanet.phase +
          s.time * s.focusPlanet.speed * s.orbitSpeedMul;
        const tx = -Math.cos(a) * s.focusPlanet.orbit * s.zoom;
        const ty = -Math.sin(a) * s.focusPlanet.orbit * 0.35 * s.zoom;
        s.targetCamX += (tx - s.targetCamX) * 0.08;
        s.targetCamY += (ty - s.targetCamY) * 0.08;
      }

      drawScene(ctx!, s.width, s.height, s, PLANETS);

      // Update React state periodically (not every frame)
      if (Math.floor(s.time * 10) % 3 === 0) {
        setOrbitSpeed(s.orbitSpeedMul);
        setCurrentZoom(s.zoom);
      }

      // Cursor
      if (cursorRef.current) {
        cursorRef.current.style.left = `${s.mouseX}px`;
        cursorRef.current.style.top = `${s.mouseY}px`;
      }
    }

    tick();

    function onMouseMove(e: MouseEvent) {
      s.mouseX = e.clientX;
      s.mouseY = e.clientY;
    }
    document.addEventListener("mousemove", onMouseMove);

    // Keyboard fallback
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "o" || e.key === " ") handleGesture("open");
      if (e.key === "f" || e.key === "Enter") handleGesture("fist");
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [handleGesture, texturesReady]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#000008]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <HUD
        gesture={gesture}
        focusPlanet={focusPlanet}
        orbitSpeed={orbitSpeed}
        zoom={currentZoom}
        cameraFailed={cameraFailed}
        videoRef={videoRef}
        landmarkCanvasRef={landmarkCanvasRef}
        onMouseGesture={handleGesture}
      />

      {/* Custom cursor */}
      <div
        ref={cursorRef}
        className="absolute w-4 h-4 pointer-events-none z-[200] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--accent)] -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--accent)] -translate-x-1/2" />
      </div>

      <StartOverlay visible={!started} onStart={() => setStarted(true)} />

      {started && !texturesReady && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--font-orbitron)] text-[10px] tracking-[0.4em] text-[var(--accent)] z-50">
          GENERATING TEXTURES...
        </div>
      )}
    </div>
  );
}
