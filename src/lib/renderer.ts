import type { PlanetData, StarData, NebulaCloud, SphereCache } from "./types";

const sphereCache = new Map<string, SphereCache>();

export function getCachedSphere(
  key: string,
  texture: HTMLCanvasElement,
  texSize: number,
  screenRadius: number,
  rotation: number,
  tiltAngle: number
): HTMLCanvasElement | null {
  const roundedRadius = Math.round(screenRadius);
  const roundedRot = Math.round(rotation * 20) / 20;

  const cached = sphereCache.get(key);
  if (
    cached &&
    cached.radius === roundedRadius &&
    cached.rotation === roundedRot
  ) {
    return cached.canvas;
  }

  const diam = roundedRadius * 2;
  if (diam < 2) return null;

  const offCanvas = document.createElement("canvas");
  offCanvas.width = offCanvas.height = diam;
  const oCtx = offCanvas.getContext("2d")!;

  const texCtx = texture.getContext("2d")!;
  const texData = texCtx.getImageData(0, 0, texSize, texSize).data;

  const outData = oCtx.createImageData(diam, diam);
  const out = outData.data;

  const r = roundedRadius;
  const r2 = r * r;
  const tilt = tiltAngle || 0.15;

  for (let py = 0; py < diam; py++) {
    for (let px = 0; px < diam; px++) {
      const dx = px - r;
      const dy = py - r;
      const d2 = dx * dx + dy * dy;

      if (d2 < r2) {
        const dz = Math.sqrt(r2 - d2);
        const nx = dx / r,
          ny = dy / r,
          nz = dz / r;

        const cosR = Math.cos(roundedRot),
          sinR = Math.sin(roundedRot);
        const rx = nx * cosR + nz * sinR;
        const rz = -nx * sinR + nz * cosR;

        const cosT = Math.cos(tilt),
          sinT = Math.sin(tilt);
        const ty = ny * cosT - rz * sinT;
        const tz = ny * sinT + rz * cosT;

        const u = (Math.atan2(rx, tz) / (Math.PI * 2) + 0.5) % 1;
        const v =
          Math.asin(Math.max(-1, Math.min(1, ty))) / Math.PI + 0.5;

        const tx = Math.floor(u * (texSize - 1));
        const tvy = Math.floor((1 - v) * (texSize - 1));
        const ti = (tvy * texSize + tx) * 4;

        const lightX = -0.4,
          lightY = -0.5,
          lightZ = 0.75;
        const lightLen = Math.sqrt(
          lightX * lightX + lightY * lightY + lightZ * lightZ
        );
        const dot =
          (nx * lightX + ny * lightY + nz * lightZ) / lightLen;
        const lighting = Math.max(0.06, dot * 0.7 + 0.3);
        const limbDark = 0.3 + 0.7 * Math.pow(nz, 0.4);
        const shade = lighting * limbDark;

        const idx = (py * diam + px) * 4;
        out[idx] = Math.min(255, texData[ti] * shade);
        out[idx + 1] = Math.min(255, texData[ti + 1] * shade);
        out[idx + 2] = Math.min(255, texData[ti + 2] * shade);
        out[idx + 3] = 255;
      }
    }
  }

  oCtx.putImageData(outData, 0, 0);
  sphereCache.set(key, {
    canvas: offCanvas,
    radius: roundedRadius,
    rotation: roundedRot,
  });
  return offCanvas;
}

export function buildStars(
  w: number,
  h: number
): { stars: StarData[]; nebulae: NebulaCloud[] } {
  const stars: StarData[] = [];
  const colors = [
    "255,255,255",
    "255,240,220",
    "220,230,255",
    "255,220,200",
  ];
  for (let i = 0; i < 500; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.7 + 0.15,
      twinkle: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * 4)],
    });
  }

  const hues = [200, 220, 260, 180, 240, 300];
  const nebulae: NebulaCloud[] = [];
  for (let i = 0; i < 6; i++) {
    nebulae.push({
      x: Math.random() * w,
      y: Math.random() * h,
      rx: 120 + Math.random() * 250,
      ry: 60 + Math.random() * 140,
      hue: hues[i],
      a: 0.02 + Math.random() * 0.03,
    });
  }

  return { stars, nebulae };
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: {
    time: number;
    zoom: number;
    camX: number;
    camY: number;
    orbitSpeedMul: number;
    focusPlanet: PlanetData | null;
    stars: StarData[];
    nebulae: NebulaCloud[];
    sunTexture: HTMLCanvasElement | null;
    planetTextures: Map<string, { texture: HTMLCanvasElement; texSize: number }>;
    planetRotations: number[];
  },
  planets: readonly PlanetData[]
): { x: number; y: number }[] {
  const {
    time,
    zoom,
    camX,
    camY,
    orbitSpeedMul,
    focusPlanet,
    stars,
    nebulae,
    sunTexture,
    planetTextures,
    planetRotations,
  } = state;

  const cx = width / 2,
    cy = height / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000008";
  ctx.fillRect(0, 0, width, height);

  // Nebula
  for (const n of nebulae) {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.rx);
    g.addColorStop(0, `hsla(${n.hue},70%,50%,${n.a})`);
    g.addColorStop(1, "transparent");
    ctx.save();
    ctx.scale(1, n.ry / n.rx);
    ctx.beginPath();
    ctx.arc(n.x, n.y * (n.rx / n.ry), n.rx, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  // Stars
  for (const s of stars) {
    const ta = s.a + Math.sin(time * 1.5 + s.twinkle) * 0.15;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${s.color},${ta})`;
    ctx.fill();
  }

  if (!sunTexture) return planets.map(() => ({ x: 0, y: 0 }));

  ctx.save();
  ctx.translate(cx + camX, cy + camY);
  ctx.scale(zoom, zoom);

  // Sun glow
  const sunScreenR = 32;
  const glowLayers = [
    { r: 100, a: 0.03 },
    { r: 70, a: 0.06 },
    { r: 50, a: 0.12 },
    { r: 38, a: 0.25 },
  ];
  for (const layer of glowLayers) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, layer.r);
    g.addColorStop(0, `rgba(255,180,50,${layer.a})`);
    g.addColorStop(0.5, `rgba(255,120,20,${layer.a * 0.5})`);
    g.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(0, 0, layer.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // Sun body
  const sunRot = time * 0.02;
  const sunCached = getCachedSphere(
    "Sun",
    sunTexture,
    256,
    Math.max(2, sunScreenR),
    Math.round(sunRot * 10) / 10,
    0.15
  );
  if (sunCached) ctx.drawImage(sunCached, -sunScreenR, -sunScreenR);

  // Corona rays
  ctx.save();
  ctx.rotate(time * 0.01);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const len = 45 + Math.sin(time * 2 + i) * 8;
    const g = ctx.createLinearGradient(
      Math.cos(angle) * sunScreenR,
      Math.sin(angle) * sunScreenR,
      Math.cos(angle) * len,
      Math.sin(angle) * len
    );
    g.addColorStop(0, "rgba(255,200,80,0.3)");
    g.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.moveTo(
      Math.cos(angle - 0.05) * sunScreenR,
      Math.sin(angle - 0.05) * sunScreenR
    );
    ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
    ctx.lineTo(
      Math.cos(angle + 0.05) * sunScreenR,
      Math.sin(angle + 0.05) * sunScreenR
    );
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();

  // Planets
  const positions: { x: number; y: number }[] = [];

  for (let idx = 0; idx < planets.length; idx++) {
    const p = planets[idx];
    const a = p.phase + time * p.speed * orbitSpeedMul;
    const px = Math.cos(a) * p.orbit;
    const py = Math.sin(a) * p.orbit * 0.35;
    positions.push({ x: px, y: py });

    // Orbit ring
    ctx.beginPath();
    ctx.ellipse(0, 0, p.orbit, p.orbit * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${focusPlanet === p ? 0.2 : 0.05})`;
    ctx.lineWidth = focusPlanet === p ? 1 / zoom : 0.4 / zoom;
    ctx.stroke();

    planetRotations[idx] += 0.008 * orbitSpeedMul;
    const screenRadius = Math.max(2, p.radius);

    // Saturn rings behind
    if (p.rings && Math.sin(a) > 0) {
      drawSaturnRings(ctx, px, py, p.radius, 0.35);
    }

    // Atmosphere
    if (p.atmColor) {
      const glowR = screenRadius * 1.5;
      const g = ctx.createRadialGradient(
        px,
        py,
        screenRadius * 0.8,
        px,
        py,
        glowR
      );
      g.addColorStop(0, p.atmColor);
      g.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // Planet body
    const texData = planetTextures.get(p.en);
    if (texData) {
      const tilt = p.en === "Uranus" ? Math.PI * 0.45 : 0.15;
      const cached = getCachedSphere(
        p.en,
        texData.texture,
        texData.texSize,
        screenRadius,
        planetRotations[idx],
        tilt
      );
      if (cached) ctx.drawImage(cached, px - screenRadius, py - screenRadius);
    }

    // Saturn rings front
    if (p.rings && Math.sin(a) <= 0) {
      drawSaturnRings(ctx, px, py, p.radius, 0.35);
    }

    // Label
    if (zoom < 2) {
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 0.5 - zoom * 0.2)})`;
      ctx.font = `${9 / zoom}px 'Space Mono', monospace`;
      ctx.textAlign = "center";
      ctx.fillText(p.ko, px, py - p.radius - 8 / zoom);
    }

    // Focus highlight
    if (focusPlanet === p) {
      drawFocusHighlight(ctx, px, py, p.radius, zoom, time);
    }
  }

  ctx.restore();
  return positions;
}

function drawSaturnRings(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  planetRadius: number,
  orbitTilt: number
) {
  const innerR = planetRadius * 1.4;
  const outerR = planetRadius * 2.6;

  for (let ring = 0; ring < 6; ring++) {
    const t = ring / 6;
    const ringR = innerR + (outerR - innerR) * t;
    if (Math.abs(t - 0.4) < 0.04) continue;

    const brightness = 0.7 - Math.abs(t - 0.3) * 0.8;
    ctx.beginPath();
    ctx.ellipse(px, py, ringR, ringR * orbitTilt, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(210,190,150,${brightness * 0.6})`;
    ctx.lineWidth = (outerR - innerR) / 7;
    ctx.stroke();
  }
}

function drawFocusHighlight(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  radius: number,
  zoom: number,
  time: number
) {
  // Scanning line
  ctx.beginPath();
  ctx.arc(px, py, radius + 5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(125,232,232,0.5)";
  ctx.lineWidth = 0.8 / zoom;
  ctx.setLineDash([3 / zoom, 5 / zoom]);
  ctx.lineDashOffset = -time * 20;
  ctx.stroke();
  ctx.setLineDash([]);

  // Corner brackets
  const bs = radius + 8;
  const bl = 5;
  ctx.strokeStyle = "rgba(125,232,232,0.8)";
  ctx.lineWidth = 1.2 / zoom;
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (const [sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(px + sx * bs, py + sy * (bs - bl));
    ctx.lineTo(px + sx * bs, py + sy * bs);
    ctx.lineTo(px + sx * (bs - bl), py + sy * bs);
    ctx.stroke();
  }

  // Pulse ring
  const pulse = (Math.sin(time * 3) + 1) / 2;
  ctx.beginPath();
  ctx.arc(px, py, radius + 6 + pulse * 10, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(125,232,232,${0.2 * (1 - pulse)})`;
  ctx.lineWidth = 0.6 / zoom;
  ctx.stroke();
}
