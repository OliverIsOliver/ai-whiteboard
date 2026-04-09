import { getStrokeOutlineAsPoints, getStrokeOutlineBounds } from "./freeDraw";
import type { DrawStroke, Point } from "./types";

export function square(value: number): number {
  return value * value;
}

export function pointToPointDistanceSquared(a: Point, b: Point): number {
  return square(a.x - b.x) + square(a.y - b.y);
}

export function pointToSegmentDistanceSquared(point: Point, start: Point, end: Point): number {
  const segmentLengthSquared = pointToPointDistanceSquared(start, end);

  if (segmentLengthSquared === 0) {
    return pointToPointDistanceSquared(point, start);
  }

  const projection =
    ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) /
    segmentLengthSquared;
  const t = Math.max(0, Math.min(1, projection));
  const projectedPoint = {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };

  return pointToPointDistanceSquared(point, projectedPoint);
}

function crossProduct(origin: Point, a: Point, b: Point): number {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
}

function isPointOnSegment(point: Point, start: Point, end: Point): boolean {
  const epsilon = 0.001;
  return (
    Math.min(start.x, end.x) - epsilon <= point.x &&
    point.x <= Math.max(start.x, end.x) + epsilon &&
    Math.min(start.y, end.y) - epsilon <= point.y &&
    point.y <= Math.max(start.y, end.y) + epsilon
  );
}

function segmentsIntersect(aStart: Point, aEnd: Point, bStart: Point, bEnd: Point): boolean {
  const a1 = crossProduct(aStart, aEnd, bStart);
  const a2 = crossProduct(aStart, aEnd, bEnd);
  const b1 = crossProduct(bStart, bEnd, aStart);
  const b2 = crossProduct(bStart, bEnd, aEnd);
  const epsilon = 0.001;

  if (Math.abs(a1) <= epsilon && isPointOnSegment(bStart, aStart, aEnd)) {
    return true;
  }

  if (Math.abs(a2) <= epsilon && isPointOnSegment(bEnd, aStart, aEnd)) {
    return true;
  }

  if (Math.abs(b1) <= epsilon && isPointOnSegment(aStart, bStart, bEnd)) {
    return true;
  }

  if (Math.abs(b2) <= epsilon && isPointOnSegment(aEnd, bStart, bEnd)) {
    return true;
  }

  return (a1 > 0) !== (a2 > 0) && (b1 > 0) !== (b2 > 0);
}

function segmentToSegmentDistanceSquared(aStart: Point, aEnd: Point, bStart: Point, bEnd: Point): number {
  if (segmentsIntersect(aStart, aEnd, bStart, bEnd)) {
    return 0;
  }

  return Math.min(
    pointToSegmentDistanceSquared(aStart, bStart, bEnd),
    pointToSegmentDistanceSquared(aEnd, bStart, bEnd),
    pointToSegmentDistanceSquared(bStart, aStart, aEnd),
    pointToSegmentDistanceSquared(bEnd, aStart, aEnd),
  );
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x < ((previous.x - current.x) * (point.y - current.y)) / ((previous.y - current.y) || 1e-7) + current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function strokeIntersectsCircle(stroke: DrawStroke, center: Point, radius: number): boolean {
  const outline = getStrokeOutlineAsPoints(stroke);

  if (outline.length < 2) {
    const thresholdSquared = square(radius + stroke.width / 2);
    return pointToPointDistanceSquared(stroke.points[0], center) <= thresholdSquared;
  }

  const bounds = getStrokeOutlineBounds(stroke, radius);

  if (
    center.x < bounds.x ||
    center.x > bounds.x + bounds.width ||
    center.y < bounds.y ||
    center.y > bounds.y + bounds.height
  ) {
    return false;
  }

  if (pointInPolygon(center, outline)) {
    return true;
  }

  const thresholdSquared = square(radius);

  for (let index = 0; index < outline.length; index += 1) {
    const current = outline[index];
    const next = outline[(index + 1) % outline.length];

    if (pointToSegmentDistanceSquared(center, current, next) <= thresholdSquared) {
      return true;
    }
  }

  return false;
}

export function strokeIntersectsSegment(stroke: DrawStroke, start: Point, end: Point, radius: number): boolean {
  const outline = getStrokeOutlineAsPoints(stroke);

  if (outline.length < 2) {
    const thresholdSquared = square(radius + stroke.width / 2);
    return pointToSegmentDistanceSquared(stroke.points[0], start, end) <= thresholdSquared;
  }

  const bounds = getStrokeOutlineBounds(stroke, radius);
  const segmentBounds = {
    x: Math.min(start.x, end.x) - radius,
    y: Math.min(start.y, end.y) - radius,
    width: Math.abs(end.x - start.x) + radius * 2,
    height: Math.abs(end.y - start.y) + radius * 2,
  };

  if (
    segmentBounds.x > bounds.x + bounds.width ||
    segmentBounds.x + segmentBounds.width < bounds.x ||
    segmentBounds.y > bounds.y + bounds.height ||
    segmentBounds.y + segmentBounds.height < bounds.y
  ) {
    return false;
  }

  if (pointInPolygon(start, outline) || pointInPolygon(end, outline)) {
    return true;
  }

  const thresholdSquared = square(radius);

  for (let index = 0; index < outline.length; index += 1) {
    const current = outline[index];
    const next = outline[(index + 1) % outline.length];

    if (segmentToSegmentDistanceSquared(start, end, current, next) <= thresholdSquared) {
      return true;
    }
  }

  return false;
}
