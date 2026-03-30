function createTextureCanvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return { canvas: c, ctx: c.getContext("2d")! };
}

function fbm(x: number, y: number, octaves: number, seed: number): number {
  let val = 0,
    amp = 1,
    freq = 1,
    max = 0;
  for (let i = 0; i < octaves; i++) {
    val +=
      amp *
      (Math.sin(x * freq + seed * 13.37 + i * 7.13) *
        Math.cos(y * freq + seed * 9.81 + i * 5.91) *
        Math.sin((x + y) * freq * 0.7 + seed * 4.23 + i * 3.14) +
        1) *
      0.5;
    max += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return val / max;
}

function noise2D(x: number, y: number, seed: number): number {
  const s = seed || 0;
  const n = Math.sin(x * 127.1 + y * 311.7 + s) * 43758.5453;
  return n - Math.floor(n);
}

export function generateSunTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 6,
        ny = (y / size) * 6;
      const n1 = fbm(nx, ny, 6, 1.0);
      const n2 = fbm(nx * 2.5, ny * 2.5, 4, 2.0);
      const n3 = fbm(nx * 0.8 + n1 * 1.5, ny * 0.8 + n2 * 1.5, 5, 3.0);
      const v = n3 * 0.6 + n1 * 0.3 + n2 * 0.1;
      d[i] = Math.min(255, 200 + v * 55);
      d[i + 1] = Math.min(255, 120 + v * 80 + n2 * 40);
      d[i + 2] = Math.min(255, 10 + n1 * 60);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function generateMercuryTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 8,
        ny = (y / size) * 8;
      const base = fbm(nx, ny, 6, 10);
      let crater = 0;
      for (let c = 0; c < 18; c++) {
        const cx = noise2D(c, 0, 10) * 8;
        const cy = noise2D(0, c, 10) * 8;
        const cr = noise2D(c, c, 10) * 0.6 + 0.15;
        const dist = Math.hypot(nx - cx, ny - cy);
        if (dist < cr) crater += (1 - dist / cr) * 0.35;
      }
      const v = base * 0.7 - crater * 0.4;
      const gray = 100 + v * 90;
      d[i] = gray + 10;
      d[i + 1] = gray + 5;
      d[i + 2] = gray - 5;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function generateVenusTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 5,
        ny = (y / size) * 5;
      const n1 = fbm(nx, ny, 5, 20);
      const n2 = fbm(nx * 1.5 + n1 * 2, ny * 1.5, 4, 21);
      const swirl = fbm(nx + n2 * 1.8, ny + n1 * 1.5, 5, 22);
      const v = swirl * 0.6 + n1 * 0.3 + n2 * 0.1;
      d[i] = 190 + v * 50;
      d[i + 1] = 160 + v * 45;
      d[i + 2] = 90 + v * 40;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function generateEarthTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 6,
        ny = (y / size) * 6;
      const continent = fbm(nx, ny, 6, 30);
      const detail = fbm(nx * 3, ny * 3, 4, 31);
      const cloud = fbm(nx * 1.2 + 0.5, ny * 1.2, 4, 32);
      const isLand = continent > 0.48;
      const lat = Math.abs(y / size - 0.5) * 2;
      const isPolar = lat > 0.82;

      if (isPolar) {
        d[i] = 230 + detail * 25;
        d[i + 1] = 235 + detail * 20;
        d[i + 2] = 240;
      } else if (isLand) {
        const elev = (continent - 0.48) * 4;
        d[i] = 30 + elev * 80 + detail * 30;
        d[i + 1] = 90 + elev * 50 + detail * 25;
        d[i + 2] = 20 + detail * 15;
      } else {
        const depth = (0.48 - continent) * 3;
        d[i] = 15 + detail * 15;
        d[i + 1] = 40 + depth * 20 + detail * 20;
        d[i + 2] = 130 + depth * 50 + detail * 30;
      }
      if (cloud > 0.55) {
        const ca = (cloud - 0.55) * 4;
        d[i] = d[i] * (1 - ca) + 240 * ca;
        d[i + 1] = d[i + 1] * (1 - ca) + 245 * ca;
        d[i + 2] = d[i + 2] * (1 - ca) + 250 * ca;
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function generateMarsTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 7,
        ny = (y / size) * 7;
      const terrain = fbm(nx, ny, 6, 40);
      const detail = fbm(nx * 3, ny * 3, 4, 41);
      const canyon = fbm(nx * 0.8, ny * 5, 3, 42);
      const lat = Math.abs(y / size - 0.5) * 2;
      const polar = lat > 0.85 ? (lat - 0.85) * 6.67 : 0;

      let r: number, g: number, b: number;
      if (polar > 0) {
        r = 180 + polar * 60;
        g = 175 + polar * 65;
        b = 170 + polar * 70;
      } else {
        const v = terrain * 0.5 + detail * 0.3 + canyon * 0.2;
        r = 160 + v * 60 + detail * 20;
        g = 70 + v * 40 + detail * 10;
        b = 40 + v * 20;
        if (terrain < 0.42) {
          r -= 30;
          g -= 15;
          b -= 5;
        }
      }
      d[i] = Math.min(255, r);
      d[i + 1] = Math.min(255, g);
      d[i + 2] = Math.min(255, b);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function generateJupiterTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 8,
        ny = y / size;
      const band = Math.sin(ny * 28) * 0.5 + 0.5;
      const turbulence = fbm(nx + band * 0.8, ny * 12, 5, 50);
      const storm = fbm(nx * 2, ny * 2, 4, 51);
      const detail = fbm(nx * 4, ny * 20, 3, 52);
      const v = band * 0.5 + turbulence * 0.3 + detail * 0.2;

      const spotX = 0.35,
        spotY = 0.58;
      const spotDist = Math.hypot(
        (x / size - spotX) * 2.5,
        (y / size - spotY) * 4
      );
      const inSpot = spotDist < 0.15;

      if (inSpot) {
        const sv = 1 - spotDist / 0.15;
        const swirl = fbm(nx * 3 + sv * 2, ny * 3, 3, 53);
        d[i] = 180 + sv * 50 + swirl * 20;
        d[i + 1] = 80 + sv * 20 + swirl * 10;
        d[i + 2] = 50 + swirl * 15;
      } else {
        const bandIdx = Math.floor(ny * 14);
        if (bandIdx % 2 === 0) {
          d[i] = 180 + v * 40 + storm * 15;
          d[i + 1] = 140 + v * 35;
          d[i + 2] = 80 + v * 30;
        } else {
          d[i] = 150 + v * 50;
          d[i + 1] = 110 + v * 40 + storm * 10;
          d[i + 2] = 70 + v * 25;
        }
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function generateSaturnTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 6,
        ny = y / size;
      const band = Math.sin(ny * 22) * 0.5 + 0.5;
      const turbulence = fbm(nx + band * 0.5, ny * 10, 4, 60);
      const detail = fbm(nx * 3, ny * 15, 3, 61);
      const v = band * 0.4 + turbulence * 0.35 + detail * 0.25;
      const bandIdx = Math.floor(ny * 11);
      if (bandIdx % 2 === 0) {
        d[i] = 210 + v * 30;
        d[i + 1] = 185 + v * 30;
        d[i + 2] = 120 + v * 35;
      } else {
        d[i] = 195 + v * 35;
        d[i + 1] = 165 + v * 30;
        d[i + 2] = 100 + v * 30;
      }
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function generateUranusTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 5,
        ny = y / size;
      const subtle = fbm(nx, ny * 8, 4, 70);
      const haze = fbm(nx * 1.5, ny * 3, 3, 71);
      const v = subtle * 0.5 + haze * 0.5;
      const lat = Math.abs(ny - 0.5) * 2;
      d[i] = 140 + v * 30 + lat * 20;
      d[i + 1] = 200 + v * 25 - lat * 10;
      d[i + 2] = 210 + v * 20;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export function generateNeptuneTexture(size: number): HTMLCanvasElement {
  const { canvas, ctx } = createTextureCanvas(size);
  const id = ctx.createImageData(size, size);
  const d = id.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = (x / size) * 5,
        ny = y / size;
      const band = fbm(nx + Math.sin(ny * 12) * 0.3, ny * 8, 5, 80);
      const storm = fbm(nx * 2, ny * 2, 4, 81);
      const v = band * 0.6 + storm * 0.4;
      const lat = Math.abs(ny - 0.5) * 2;
      const spotDist = Math.hypot(x / size - 0.4, (ny - 0.42) * 2.5);
      const spotV = spotDist < 0.08 ? (1 - spotDist / 0.08) * 0.4 : 0;
      d[i] = 30 + v * 25 + lat * 15 - spotV * 30;
      d[i + 1] = 50 + v * 30 + lat * 10;
      d[i + 2] = 160 + v * 50 + lat * 20 - spotV * 20;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return canvas;
}

export const TEXTURE_GENERATORS: Record<
  string,
  (size: number) => HTMLCanvasElement
> = {
  Mercury: generateMercuryTexture,
  Venus: generateVenusTexture,
  Earth: generateEarthTexture,
  Mars: generateMarsTexture,
  Jupiter: generateJupiterTexture,
  Saturn: generateSaturnTexture,
  Uranus: generateUranusTexture,
  Neptune: generateNeptuneTexture,
};
