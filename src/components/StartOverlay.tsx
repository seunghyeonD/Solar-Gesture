"use client";

interface StartOverlayProps {
  visible: boolean;
  onStart: () => void;
}

export default function StartOverlay({ visible, onStart }: StartOverlayProps) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center z-50 transition-opacity duration-800 ${
        visible ? "" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,0,40,0.85) 0%, rgba(0,0,15,0.97) 100%)",
      }}
    >
      <div className="font-[family-name:var(--font-orbitron)] text-[13px] tracking-[0.5em] text-[var(--accent)] mb-4 uppercase">
        Gesture Experience
      </div>
      <div className="font-[family-name:var(--font-orbitron)] text-[clamp(28px,6vw,60px)] font-bold text-white leading-tight text-center mb-2 tracking-[0.04em]">
        손으로 탐험하는
        <br />
        <em className="text-[var(--accent)] not-italic">태양계</em>
      </div>
      <div className="text-[12px] text-[var(--text-dim)] tracking-[0.2em] mb-12">
        웹캠으로 손 제스처를 인식해 태양계를 탐험합니다
      </div>

      <div className="flex gap-10 mb-12">
        <div className="text-center">
          <span
            className="text-[44px] block mb-2.5"
            style={{ filter: "drop-shadow(0 0 12px rgba(125,232,232,0.4))" }}
            aria-label="open hand"
          >
            &#9995;
          </span>
          <div className="font-[family-name:var(--font-orbitron)] text-[9px] tracking-[0.3em] text-[var(--accent)] mb-1">
            손 펼치기
          </div>
          <div className="text-[10px] text-[var(--text-dim)] tracking-[0.1em]">
            줌아웃 &rarr; 태양계 회전 가속
          </div>
        </div>
        <div className="text-center">
          <span
            className="text-[44px] block mb-2.5"
            style={{ filter: "drop-shadow(0 0 12px rgba(125,232,232,0.4))" }}
            aria-label="fist"
          >
            &#9994;
          </span>
          <div className="font-[family-name:var(--font-orbitron)] text-[9px] tracking-[0.3em] text-[var(--accent)] mb-1">
            주먹 쥐기
          </div>
          <div className="text-[10px] text-[var(--text-dim)] tracking-[0.1em]">
            줌인 &rarr; 행성 클로즈업
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="group relative bg-transparent border border-[var(--accent)] text-[var(--accent)]
          font-[family-name:var(--font-orbitron)] text-[11px] tracking-[0.4em]
          py-3.5 px-10 cursor-pointer uppercase rounded-sm overflow-hidden
          hover:text-black transition-colors duration-200"
      >
        <span className="relative z-10">카메라 시작</span>
        <span className="absolute inset-0 bg-[var(--accent)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </button>
    </div>
  );
}
