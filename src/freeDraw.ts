import { getStroke } from "perfect-freehand";

import type { DrawStroke, Point, Rectangle } from "./types";

const PRESSURE_SIZE_MULTIPLIER = 1.35;

type CachedStrokeGeometry = {
  signature: number;
  outline: [number, number][];
  outlinePoints: Point[];
  baseBounds: Rectangle;
  pathData: string | null;
};

const strokeGeometryCache = new WeakMap<DrawStroke, CachedStrokeGeometry>();

function average(a: number, b: number): number {
  return (a + b) / 2;
}

function getSvgPathFromStroke(points: number[][], closed = true): string {
  const length = points.length;

  if (length < 4) {
    return "";
  }

  let current = points[0];
  let next = points[1];
  const third = points[2];

  let result = `M${current[0].toFixed(2)},${current[1].toFixed(2)} Q${next[0].toFixed(2)},${next[1].toFixed(2)} ${average(
    next[0],
    third[0],
  ).toFixed(2)},${average(next[1], third[1]).toFixed(2)} T`;

  for (let index = 2, max = length - 1; index < max; index += 1) {
    current = points[index];
    next = points[index + 1];
    result += `${average(current[0], next[0]).toFixed(2)},${average(current[1], next[1]).toFixed(2)} `;
  }

  if (closed) {
    result += "Z";
  }

  return result;
}

function hashNumber(value: number): number {
  const scaled = Math.round(value * 1000);
  return Number.isFinite(scaled) ? scaled | 0 : 0;
}

function getStrokeSignature(stroke: DrawStroke): number {
  let hash = 2166136261;
  const update = (value: number) => {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  };

  update(hashNumber(stroke.width));
  update(stroke.simulatePressure ? 1 : 0);
  update(stroke.points.length);
  update(stroke.pressures.length);

  stroke.points.forEach((point) => {
    update(hashNumber(point.x));
    update(hashNumber(point.y));
  });

  stroke.pressures.forEach((pressure) => {
    update(hashNumber(pressure));
  });

  return hash >>> 0;
}

function getBaseBounds(points: Point[]): Rectangle {
  const source = points.length > 0 ? points : [{ x: 0, y: 0 }];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  source.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function buildStrokeGeometry(stroke: DrawStroke, signature: number): CachedStrokeGeometry {
  const inputPoints = stroke.simulatePressure
    ? stroke.points.map(({ x, y }) => [x, y])
    : stroke.points.length
      ? stroke.points.map(({ x, y }, index) => [x, y, stroke.pressures[index] ?? 0.5])
      : [[0, 0, 0.5]];

  const outline = getStroke(inputPoints as number[][], {
    simulatePressure: stroke.simulatePressure,
    size: stroke.width * PRESSURE_SIZE_MULTIPLIER,
    thinning: 0.45,
    smoothing: 0.45,
    streamline: 0.1,
    easing: (value) => Math.sin((value * Math.PI) / 2),
    last: true,
  }) as [number, number][];

  const outlinePoints = outline.map(([x, y]) => ({ x, y }));
  const pathData = outline.length < 4 ? null : getSvgPathFromStroke(outline, true) || null;
  const baseBounds = getBaseBounds(outlinePoints.length > 0 ? outlinePoints : stroke.points);

  return {
    signature,
    outline,
    outlinePoints,
    baseBounds,
    pathData,
  };
}

function getStrokeGeometry(stroke: DrawStroke): CachedStrokeGeometry {
  const signature = getStrokeSignature(stroke);
  const cached = strokeGeometryCache.get(stroke);

  if (cached && cached.signature === signature) {
    return cached;
  }

  const next = buildStrokeGeometry(stroke, signature);
  strokeGeometryCache.set(stroke, next);
  return next;
}

export function getStrokeOutlinePoints(stroke: DrawStroke): [number, number][] {
  return getStrokeGeometry(stroke).outline;
}

export function getStrokeOutlineAsPoints(stroke: DrawStroke): Point[] {
  return getStrokeGeometry(stroke).outlinePoints;
}

export function getStrokeOutlineBounds(stroke: DrawStroke, padding = 0): Rectangle {
  const { baseBounds } = getStrokeGeometry(stroke);

  return {
    x: baseBounds.x - padding,
    y: baseBounds.y - padding,
    width: baseBounds.width + padding * 2,
    height: baseBounds.height + padding * 2,
  };
}

export function getStrokePathData(stroke: DrawStroke): string | null {
  return getStrokeGeometry(stroke).pathData;
}
