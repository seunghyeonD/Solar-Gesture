"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { GestureType } from "@/lib/types";

interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface HandsInstance {
  setOptions: (opts: Record<string, unknown>) => void;
  onResults: (cb: (results: HandResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
}

interface HandResults {
  multiHandLandmarks?: Landmark[][];
}

interface CameraInstance {
  start: () => void;
}

declare const Hands: new (opts: {
  locateFile: (f: string) => string;
}) => HandsInstance;
declare const Camera: new (
  el: HTMLVideoElement,
  opts: {
    onFrame: () => Promise<void>;
    width: number;
    height: number;
  }
) => CameraInstance;
declare const HAND_CONNECTIONS: unknown;
declare function drawConnectors(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: unknown,
  opts: Record<string, unknown>
): void;
declare function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  opts: Record<string, unknown>
): void;

function classifyGesture(lm: Landmark[]): GestureType {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];
  let extended = 0;
  for (let i = 0; i < 4; i++) {
    if (lm[tips[i]].y < lm[pips[i]].y) extended++;
  }
  const thumbOut = Math.abs(lm[4].x - lm[2].x) > 0.08;
  if (thumbOut) extended++;
  return extended >= 3 ? "open" : "fist";
}

export function useGesture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  landmarkCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  onGesture: (gesture: GestureType) => void,
  enabled: boolean
) {
  const [cameraFailed, setCameraFailed] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const gestureRef = useRef<GestureType>("none");

  const handleGesture = useCallback(
    (g: GestureType) => {
      if (g !== gestureRef.current) {
        gestureRef.current = g;
        onGesture(g);
      }
    },
    [onGesture]
  );

  // Load MediaPipe scripts
  useEffect(() => {
    if (!enabled || scriptsLoaded) return;

    const scripts = [
      {
        src: "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js",
        integrity:
          "sha384-oHwoZ9HyKv5ark5VOH+XWdbNfmhYtptAOBuV8plz6mAfXvTA6d8fULuYllWouEK2",
      },
      {
        src: "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js",
        integrity:
          "sha384-q1KhAZhJcJXr3zfC3Tz07pBqQSabwFIZhXlmlUAB8s0zk4ETWERkIKGBCFQ5Jc3e",
      },
      {
        src: "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js",
        integrity:
          "sha384-W/7NVG2tfN12ld8faSFVOZ/W4UHFHze98GqEUPTl8EjY9QDwCKQIzoCHp8/IlIIr",
      },
    ];

    let loaded = 0;
    for (const { src, integrity } of scripts) {
      const el = document.createElement("script");
      el.src = src;
      el.integrity = integrity;
      el.crossOrigin = "anonymous";
      el.onload = () => {
        loaded++;
        if (loaded === scripts.length) setScriptsLoaded(true);
      };
      el.onerror = () => setCameraFailed(true);
      document.head.appendChild(el);
    }
  }, [enabled, scriptsLoaded]);

  // Initialize camera + hands
  useEffect(() => {
    if (!enabled || !scriptsLoaded) return;
    if (!videoRef.current || !landmarkCanvasRef.current) return;

    const videoEl = videoRef.current;
    const lCanvas = landmarkCanvasRef.current;
    const lCtx = lCanvas.getContext("2d")!;

    lCanvas.width = 160;
    lCanvas.height = 120;

    let cancelled = false;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        videoEl.srcObject = stream;
        await videoEl.play();

        // Allowlist of known MediaPipe model files to prevent arbitrary file loading
        const ALLOWED_FILES = new Set([
          "hands.binarypb",
          "hands_solution_packed_assets.data",
          "hands_solution_packed_assets_loader.js",
          "hands_solution_simd_wasm_bin.js",
          "hands_solution_simd_wasm_bin.wasm",
          "hands_solution_wasm_bin.js",
          "hands_solution_wasm_bin.wasm",
        ]);

        const hands = new Hands({
          locateFile: (f: string) => {
            const safeName = f.replace(/[^a-zA-Z0-9._-]/g, "");
            if (!ALLOWED_FILES.has(safeName)) {
              throw new Error(`Blocked unexpected MediaPipe file request: ${safeName}`);
            }
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${safeName}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.72,
          minTrackingConfidence: 0.55,
        });

        hands.onResults((results: HandResults) => {
          if (cancelled) return;
          lCtx.clearRect(0, 0, 160, 120);
          if (
            results.multiHandLandmarks &&
            results.multiHandLandmarks.length
          ) {
            const lm = results.multiHandLandmarks[0];
            drawConnectors(lCtx, lm, HAND_CONNECTIONS, {
              color: "rgba(125,232,232,0.5)",
              lineWidth: 1,
            });
            drawLandmarks(lCtx, lm, {
              color: "rgba(255,255,255,0.8)",
              fillColor: "rgba(125,232,232,0.3)",
              lineWidth: 0.5,
              radius: 2,
            });
            handleGesture(classifyGesture(lm));
          }
        });

        const camera = new Camera(videoEl, {
          onFrame: async () => {
            await hands.send({ image: videoEl });
          },
          width: 320,
          height: 240,
        });
        camera.start();
      } catch {
        if (!cancelled) setCameraFailed(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [enabled, scriptsLoaded, videoRef, landmarkCanvasRef, handleGesture]);

  return { cameraFailed };
}
