export interface PlanetData {
  readonly ko: string;
  readonly en: string;
  readonly radius: number;
  readonly orbit: number;
  readonly speed: number;
  readonly dist: string;
  readonly period: string;
  readonly size: string;
  readonly moons: string;
  readonly temp: string;
  readonly phase: number;
  readonly atmColor: string | null;
  readonly rings?: boolean;
}

export interface StarData {
  x: number;
  y: number;
  r: number;
  a: number;
  twinkle: number;
  color: string;
}

export interface NebulaCloud {
  x: number;
  y: number;
  rx: number;
  ry: number;
  hue: number;
  a: number;
}

export type GestureType = "none" | "open" | "fist";

export interface SphereCache {
  canvas: HTMLCanvasElement;
  radius: number;
  rotation: number;
}
