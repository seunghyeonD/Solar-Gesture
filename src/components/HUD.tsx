"use client";

import type { PlanetData, GestureType } from "@/lib/types";
import { useEffect, useState, useRef } from "react";

interface HUDProps {
  gesture: GestureType;
  focusPlanet: PlanetData | null;
  orbitSpeed: number;
  zoom: number;
  cameraFailed: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarkCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMouseGesture: (g: GestureType) => void;
}

function sanitizeText(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")       // control chars
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")       // zero-width & bidi override
    .replace(/[\u061C\u2066-\u2069]/g, "");                     // bidi isolates
}

export default function HUD({
  gesture,
  focusPlanet,
  orbitSpeed,
  zoom,
  cameraFailed,
  videoRef,
  landmarkCanvasRef,
  onMouseGesture,
}: HUDProps) {
  const [gestureActive, setGestureActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (gesture === "none") return;
    setGestureActive(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setGestureActive(false), 2500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gesture]);

  const zoomPct = Math.max(5, Math.min(100, ((zoom - 0.3) / 7.7) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Title */}
      <div className="absolute top-7 left-8">
        <h1 className="font-[family-name:var(--font-orbitron)] text-[11px] font-normal tracking-[0.35em] text-[var(--accent)] uppercase mb-1">
          Solar Gesture
        </h1>
        <div className="text-[10px] text-[var(--text-dim)] tracking-[0.2em]">
          손으로 탐험하는 태양계
        </div>
      </div>

      {/* Gesture indicator */}
      <div className="absolute top-7 right-8 text-right">
        <div
          className={`font-[family-name:var(--font-orbitron)] text-[28px] text-white leading-none transition-all duration-400 ${
            gestureActive
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1.5"
          }`}
        >
          {gesture === "open" ? "\u270B" : gesture === "fist" ? "\u270A" : ""}
        </div>
        <div
          className={`text-[10px] tracking-[0.3em] text-[var(--accent)] mt-1.5 transition-opacity duration-400 ${
            gestureActive ? "opacity-100" : "opacity-0"
          }`}
        >
          {gesture === "open"
            ? "OPEN PALM \u2192 ZOOM OUT"
            : gesture === "fist"
              ? "FIST \u2192 ZOOM IN"
              : ""}
        </div>
      </div>

      {/* Speed */}
      <div
        className={`absolute top-20 right-8 text-right transition-opacity duration-400 ${
          gesture === "open" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="text-[8px] tracking-[0.3em] text-[var(--text-dim)]">
          ORBIT SPEED
        </div>
        <div className="font-[family-name:var(--font-orbitron)] text-[16px] text-[var(--accent)]">
          {orbitSpeed.toFixed(1)}&times;
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-8 items-center">
        <div className="flex items-center gap-2.5 text-[10px] tracking-[0.2em] text-[var(--text-dim)]">
          <span className="text-[20px] opacity-70">&#9995;</span>
          <span>손 펼치기 &rarr; 줌아웃 + 회전</span>
        </div>
        <div className="w-px h-5 bg-[var(--hud-border)]" />
        <div className="flex items-center gap-2.5 text-[10px] tracking-[0.2em] text-[var(--text-dim)]">
          <span className="text-[20px] opacity-70">&#9994;</span>
          <span>주먹 쥐기 &rarr; 행성 줌인</span>
        </div>
      </div>

      {/* Planet panel */}
      <div
        className={`absolute bottom-7 left-8 w-[260px] border border-[var(--hud-border)] rounded-sm
          p-4 px-5 transition-all duration-500 backdrop-blur-[12px] ${
            focusPlanet
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-3"
          }`}
        style={{ background: "var(--hud-bg)" }}
      >
        <div className="text-[9px] tracking-[0.4em] text-[var(--text-dim)] mb-1.5 uppercase">
          현재 탐험 중
        </div>
        <div className="font-[family-name:var(--font-orbitron)] text-[22px] font-bold text-white leading-none mb-2.5">
          {focusPlanet ? sanitizeText(focusPlanet.ko) : "\u2014"}
        </div>
        <div className="text-[10px] tracking-[0.25em] text-[var(--accent)] mb-3.5">
          {focusPlanet ? sanitizeText(focusPlanet.en.toUpperCase()) : "\u2014"}
        </div>
        {focusPlanet && (
          <div className="space-y-1.5">
            {[
              ["거리 (AU)", `${focusPlanet.dist} AU`],
              ["공전 주기", focusPlanet.period],
              ["지름", focusPlanet.size],
              ["위성 수", `${focusPlanet.moons}개`],
              ["표면 온도", focusPlanet.temp],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between text-[10px] text-[var(--text-dim)]"
              >
                <span>{label}</span>
                <span className="text-white/90">{sanitizeText(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera feed */}
      <div className="absolute bottom-7 right-8 w-[160px] h-[120px] rounded-sm overflow-hidden border border-[var(--hud-border)] bg-black">
        {cameraFailed ? (
          <div
            className="flex items-center justify-center h-full text-[9px] tracking-[0.2em] text-white/40 text-center p-2.5 pointer-events-auto cursor-pointer"
            onClick={() => onMouseGesture("open")}
            onContextMenu={(e) => {
              e.preventDefault();
              onMouseGesture("fist");
            }}
          >
            카메라 없음
            <br />
            클릭: 줌아웃
            <br />
            우클릭: 줌인
          </div>
        ) : (
          <>
            <div className="absolute top-1.5 left-2 text-[8px] tracking-[0.25em] text-[var(--accent)] z-10">
              GESTURE CAM
            </div>
            <div className="absolute top-2 right-2 w-[5px] h-[5px] rounded-full bg-[#ff4040] z-10 animate-[blink_1.2s_infinite]" />
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100 opacity-55"
            />
            <canvas
              ref={landmarkCanvasRef}
              className="absolute inset-0 w-full h-full -scale-x-100"
            />
          </>
        )}
      </div>

      {/* Zoom bar */}
      <div className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col items-center gap-1">
        <div
          className="text-[8px] tracking-[0.3em] text-[var(--text-dim)]"
          style={{ writingMode: "vertical-rl" }}
        >
          ZOOM
        </div>
        <div className="w-0.5 h-20 bg-[var(--hud-border)] rounded-sm relative my-1.5">
          <div
            className="absolute bottom-0 -left-0.5 w-1.5 bg-[var(--accent)] rounded-sm transition-[height] duration-400"
            style={{ height: `${zoomPct}%` }}
          />
        </div>
        <div
          className="text-[8px] tracking-[0.3em] text-[var(--text-dim)]"
          style={{ writingMode: "vertical-rl" }}
        >
          &times;
        </div>
      </div>
    </div>
  );
}
