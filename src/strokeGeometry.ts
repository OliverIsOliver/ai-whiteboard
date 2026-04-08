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

export function strokeIntersectsCircle(stroke: DrawStroke, center: Point, radius: number): boolean {
  const thresholdSquared = square(radius + stroke.width / 2);

  if (stroke.points.length === 1) {
    return pointToPointDistanceSquared(stroke.points[0], center) <= thresholdSquared;
  }

  for (let index = 1; index < stroke.points.length; index += 1) {
    if (pointToSegmentDistanceSquared(center, stroke.points[index - 1], stroke.points[index]) <= thresholdSquared) {
      return true;
    }
  }

  return false;
}

export function strokeIntersectsSegment(stroke: DrawStroke, start: Point, end: Point, radius: number): boolean {
  const thresholdSquared = square(radius + stroke.width / 2);

  if (stroke.points.length === 1) {
    return pointToSegmentDistanceSquared(stroke.points[0], start, end) <= thresholdSquared;
  }

  for (let index = 1; index < stroke.points.length; index += 1) {
    if (segmentToSegmentDistanceSquared(start, end, stroke.points[index - 1], stroke.points[index]) <= thresholdSquared) {
      return true;
    }
  }

  return false;
}
