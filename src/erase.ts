import { context } from "./dom";
import { beginHistoryTransaction, commitHistoryTransaction } from "./history";
import { ERASE_TOOL, state } from "./state";
import { expandStrokeIdsByGroup, setSelectedStrokeIds } from "./selection";
import { strokeIntersectsCircle, strokeIntersectsSegment } from "./strokeGeometry";
import type { Point, TrailPoint, TrailVector } from "./types";

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

function trailAdd([ax, ay, ar]: TrailVector, [bx, by, br]: TrailVector): TrailVector {
  return [ax + bx, ay + by, ar + br];
}

function trailSub([ax, ay, ar]: TrailVector, [bx, by, br]: TrailVector): TrailVector {
  return [ax - bx, ay - by, ar - br];
}

function trailScale([x, y, r]: TrailVector, scale: number): TrailVector {
  return [x * scale, y * scale, r * scale];
}

function trailMagnitude([x, y]: TrailVector): number {
  return Math.hypot(x, y);
}

function trailNormalize([x, y, r]: TrailVector): TrailVector {
  const magnitude = Math.hypot(x, y) || 1;
  return [x / magnitude, y / magnitude, r];
}

function trailRotate([x, y, r]: TrailVector, radians: number): TrailVector {
  return [
    Math.cos(radians) * x - Math.sin(radians) * y,
    Math.sin(radians) * x + Math.cos(radians) * y,
    r,
  ];
}

function trailLerp(a: TrailVector, b: TrailVector, t: number): TrailVector {
  return trailAdd(a, trailScale(trailSub(b, a), t));
}

function trailDistance([ax, ay]: TrailVector, [bx, by]: TrailVector): number {
  return Math.hypot(bx - ax, by - ay);
}

function trailAngle(point: TrailVector, a: TrailVector, b: TrailVector): number {
  return Math.atan2(b[1] - point[1], b[0] - point[0]) - Math.atan2(a[1] - point[1], a[0] - point[0]);
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function trailRunLength(points: TrailVector[]): number {
  if (points.length < 2) {
    return 0;
  }

  let length = 0;

  for (let index = 1; index <= points.length - 1; index += 1) {
    length += trailDistance(points[index - 1], points[index]);
  }

  length += trailDistance(points[points.length - 2], points[points.length - 1]);
  return length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distancePointToSegment(point: TrailVector, start: TrailVector, end: TrailVector): number {
  const segmentMagnitude = trailDistance(start, end);

  if (segmentMagnitude === 0) {
    return trailDistance(point, start);
  }

  const projection = clamp(
    ((point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])) /
      segmentMagnitude ** 2,
    0,
    1,
  );

  const projectedPoint: TrailVector = [
    start[0] + projection * (end[0] - start[0]),
    start[1] + projection * (end[1] - start[1]),
    point[2],
  ];

  return trailDistance(projectedPoint, point);
}

function douglasPeucker(points: TrailVector[], epsilon: number): TrailVector[] {
  if (epsilon === 0 || points.length <= 2) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];

  const [maxDistance, maxIndex] = points.reduce<[number, number]>(
    ([currentMaxDistance, currentMaxIndex], point, index) => {
      const distance = distancePointToSegment(point, first, last);
      return distance > currentMaxDistance ? [distance, index] : [currentMaxDistance, currentMaxIndex];
    },
    [0, -1],
  );

  if (maxDistance >= epsilon) {
    const maxPoint = points[maxIndex];

    return [
      ...douglasPeucker([first, ...points.slice(1, maxIndex), maxPoint], epsilon).slice(0, -1),
      maxPoint,
      ...douglasPeucker([maxPoint, ...points.slice(maxIndex, -1), last], epsilon).slice(1),
    ];
  }

  return [first, last];
}

function trailEaseOut(value: number): number {
  return 1 - Math.pow(1 - value, 4);
}

function getEraserSizeMapping(timestamp: number, totalLength: number, currentIndex: number): number {
  const timeFactor = Math.max(0, 1 - (performance.now() - timestamp) / ERASE_TOOL.trailDecayMs);
  const lengthFactor =
    (ERASE_TOOL.trailDecayLength - Math.min(ERASE_TOOL.trailDecayLength, totalLength - currentIndex)) /
    ERASE_TOOL.trailDecayLength;

  return Math.min(trailEaseOut(lengthFactor), trailEaseOut(timeFactor));
}

function getEraserStrokeOutline(points: TrailPoint[]): TrailVector[] {
  const originalPoints: TrailVector[] = points.map((point) => [point.x, point.y, point.timestamp]);

  if (originalPoints.length === 0) {
    return [];
  }

  const stablePoints: TrailVector[] = [originalPoints[0]];
  const tailPoints: TrailVector[] = [];

  const getLastPoint = (): TrailVector => tailPoints[tailPoints.length - 1] ?? stablePoints[stablePoints.length - 1];

  for (let index = 1; index < originalPoints.length; index += 1) {
    let point = originalPoints[index];
    point = trailLerp(getLastPoint(), point, 1 - ERASE_TOOL.trailStreamline);
    tailPoints.push(point);

    if (trailRunLength(tailPoints) > ERASE_TOOL.trailMaxLength) {
      stablePoints.push(...tailPoints);
      tailPoints.length = 0;
    }
  }

  const allPoints =
    ERASE_TOOL.trailSimplify > 0
      ? douglasPeucker([...stablePoints, ...tailPoints], ERASE_TOOL.trailSimplify)
      : [...stablePoints, ...tailPoints];

  const length = allPoints.length;

  const getSize = (timestamp: number, index: number, totalLength: number): number =>
    (ERASE_TOOL.width / 2) * getEraserSizeMapping(timestamp, totalLength, index);

  if (length === 1) {
    const point = allPoints[0];
    const size = getSize(point[2], 0, length);

    if (size < 0.5) {
      return [];
    }

    const outline: TrailVector[] = [];

    for (let theta = 0; theta <= Math.PI * 2; theta += Math.PI / 16) {
      outline.push(trailAdd(point, trailScale(trailRotate([1, 0, 0], theta), size)));
    }

    outline.push(trailAdd(point, trailScale([1, 0, 0], size)));
    return outline;
  }

  if (length === 2) {
    const current = allPoints[0];
    const next = allPoints[1];
    const currentSize = getSize(current[2], 0, length);
    const nextSize = getSize(next[2], 1, length);

    if (currentSize < 0.5 || nextSize < 0.5) {
      return [];
    }

    const outline: TrailVector[] = [];
    const startAngle = trailAngle(current, [current[0], current[1] - 100, current[2]], next);

    for (let theta = startAngle; theta <= Math.PI + startAngle; theta += Math.PI / 16) {
      outline.push(trailAdd(current, trailScale(trailRotate([1, 0, 0], theta), currentSize)));
    }

    for (let theta = Math.PI + startAngle; theta <= Math.PI * 2 + startAngle; theta += Math.PI / 16) {
      outline.push(trailAdd(next, trailScale(trailRotate([1, 0, 0], theta), nextSize)));
    }

    outline.push(outline[0]);
    return outline;
  }

  const forwardPoints: TrailVector[] = [];
  const backwardPoints: TrailVector[] = [];

  let speed = 0;
  let previousSpeed = 0;
  let visibleStartIndex = 0;

  for (let index = 1; index < length - 1; index += 1) {
    const previous = allPoints[index - 1];
    const current = allPoints[index];
    const next = allPoints[index + 1];
    const distance = trailDistance(previous, current);
    speed = previousSpeed + (distance - previousSpeed) * 0.2;

    const currentSize = getSize(current[2], index, length);

    if (currentSize === 0) {
      visibleStartIndex = index + 1;
      continue;
    }

    const directionPreviousCurrent = trailNormalize(trailSub(previous, current));
    const directionNextCurrent = trailNormalize(trailSub(next, current));
    const perpendicularPrevious1 = trailRotate(directionPreviousCurrent, Math.PI / 2);
    const perpendicularPrevious2 = trailRotate(directionPreviousCurrent, -Math.PI / 2);
    const perpendicularNext1 = trailRotate(directionNextCurrent, Math.PI / 2);
    const perpendicularNext2 = trailRotate(directionNextCurrent, -Math.PI / 2);
    const forwardTangentDirection = trailAdd(perpendicularPrevious1, perpendicularNext2);
    const backwardTangentDirection = trailAdd(perpendicularPrevious2, perpendicularNext1);
    const tangentPreviousCurrent = trailAdd(
      current,
      trailScale(trailMagnitude(forwardTangentDirection) === 0 ? directionPreviousCurrent : trailNormalize(forwardTangentDirection), currentSize),
    );
    const tangentNextCurrent = trailAdd(
      current,
      trailScale(trailMagnitude(backwardTangentDirection) === 0 ? directionNextCurrent : trailNormalize(backwardTangentDirection), currentSize),
    );

    const currentAngle = normalizeAngle(trailAngle(current, previous, next));
    const angleThreshold = ((75 / 180) * Math.PI) * (speed > 35 ? 0.5 : 1);

    if (Math.abs(currentAngle) < angleThreshold) {
      const turnAngle = Math.abs(normalizeAngle(Math.PI - currentAngle));

      if (turnAngle === 0) {
        continue;
      }

      if (currentAngle < 0) {
        backwardPoints.push(trailAdd(current, trailScale(perpendicularPrevious2, currentSize)), tangentNextCurrent);

        for (let theta = 0; theta <= turnAngle; theta += turnAngle / 4) {
          forwardPoints.push(trailAdd(current, trailRotate(trailScale(perpendicularPrevious1, currentSize), theta)));
        }

        for (let theta = turnAngle; theta >= 0; theta -= turnAngle / 4) {
          backwardPoints.push(trailAdd(current, trailRotate(trailScale(perpendicularPrevious1, currentSize), theta)));
        }

        backwardPoints.push(tangentNextCurrent, trailAdd(current, trailScale(perpendicularNext1, currentSize)));
      } else {
        forwardPoints.push(trailAdd(current, trailScale(perpendicularPrevious1, currentSize)), tangentPreviousCurrent);

        for (let theta = 0; theta <= turnAngle; theta += turnAngle / 4) {
          backwardPoints.push(trailAdd(current, trailRotate(trailScale(perpendicularPrevious1, -currentSize), -theta)));
        }

        for (let theta = turnAngle; theta >= 0; theta -= turnAngle / 4) {
          forwardPoints.push(trailAdd(current, trailRotate(trailScale(perpendicularPrevious1, -currentSize), -theta)));
        }

        forwardPoints.push(tangentPreviousCurrent, trailAdd(current, trailScale(perpendicularNext2, currentSize)));
      }
    } else {
      forwardPoints.push(tangentPreviousCurrent);
      backwardPoints.push(tangentNextCurrent);
    }

    previousSpeed = speed;
  }

  if (visibleStartIndex >= length - 2) {
    if (!ERASE_TOOL.trailKeepHead) {
      return [];
    }

    const current = allPoints[length - 1];
    const outline: TrailVector[] = [];

    for (let theta = 0; theta <= Math.PI * 2; theta += Math.PI / 16) {
      outline.push(trailAdd(current, trailScale(trailRotate([1, 0, 0], theta), ERASE_TOOL.width / 2)));
    }

    outline.push(trailAdd(current, trailScale([1, 0, 0], ERASE_TOOL.width / 2)));
    return outline;
  }

  const first = allPoints[visibleStartIndex];
  const second = allPoints[visibleStartIndex + 1];
  const penultimate = allPoints[length - 2];
  const ultimate = allPoints[length - 1];
  const directionFirstSecond = trailNormalize(trailSub(second, first));
  const directionPenultimateUltimate = trailNormalize(trailSub(penultimate, ultimate));
  const perpendicularFirst = trailRotate(directionFirstSecond, -Math.PI / 2);
  const perpendicularLast = trailRotate(directionPenultimateUltimate, Math.PI / 2);
  const startCapSize = getSize(first[2], 0, length);
  const startCap: TrailVector[] = [];
  const endCapSize = ERASE_TOOL.trailKeepHead ? ERASE_TOOL.width / 2 : getSize(penultimate[2], length - 2, length);
  const endCap: TrailVector[] = [];

  if (startCapSize > 1) {
    for (let theta = 0; theta <= Math.PI; theta += Math.PI / 16) {
      startCap.unshift(trailAdd(first, trailRotate(trailScale(perpendicularFirst, startCapSize), -theta)));
    }

    startCap.unshift(trailAdd(first, trailScale(perpendicularFirst, -startCapSize)));
  } else {
    startCap.push(first);
  }

  for (let theta = 0; theta <= Math.PI * 3; theta += Math.PI / 16) {
    endCap.push(trailAdd(ultimate, trailRotate(trailScale(perpendicularLast, -endCapSize), -theta)));
  }

  const outline = [...startCap, ...forwardPoints, ...endCap.reverse(), ...backwardPoints.reverse()];

  if (startCap.length > 0) {
    outline.push(startCap[0]);
  }

  return ERASE_TOOL.trailSimplify > 0 ? douglasPeucker(outline, ERASE_TOOL.trailSimplify) : outline;
}

export function drawEraserTrail(points: TrailPoint[]): void {
  if (points.length === 0) {
    return;
  }

  const trailPoints = points.slice(-ERASE_TOOL.trailMaxPoints);
  const outline = getEraserStrokeOutline(trailPoints);

  if (outline.length < 4) {
    return;
  }

  const pathData = getSvgPathFromStroke(outline.map(([x, y]) => [x, y]), true);

  if (!pathData) {
    return;
  }

  context.save();
  context.fillStyle = `rgba(163, 168, 176, ${ERASE_TOOL.trailOpacity})`;
  context.fill(new Path2D(pathData));
  context.restore();
}

export function drawEraserCursor(point: Point): void {
  context.save();
  context.beginPath();
  context.arc(point.x, point.y, ERASE_TOOL.width / 2, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#111111";
  context.lineWidth = 1.5;
  context.fill();
  context.stroke();
  context.restore();
}

function addPendingEraseStroke(strokeId: number): void {
  const expandedIds = expandStrokeIdsByGroup(new Set([strokeId]));

  expandedIds.forEach((id) => {
    state.pendingEraseIds.add(id);
  });
}

export function markPendingEraseAtPoint(center: Point): void {
  state.strokes.forEach((stroke) => {
    if (strokeIntersectsCircle(stroke, center, ERASE_TOOL.width / 2)) {
      addPendingEraseStroke(stroke.id);
    }
  });
}

export function markPendingEraseAlongSegment(start: Point, end: Point): void {
  state.strokes.forEach((stroke) => {
    if (strokeIntersectsSegment(stroke, start, end, ERASE_TOOL.width / 2)) {
      addPendingEraseStroke(stroke.id);
    }
  });
}

export function startErase(point: Point): void {
  beginHistoryTransaction();
  state.eraseTrail = [{ ...point, timestamp: performance.now() }];
  state.pendingEraseIds.clear();
  markPendingEraseAtPoint(point);
}

export function extendErase(point: Point): void {
  const previousPoint = state.eraseTrail[state.eraseTrail.length - 1];
  state.eraseTrail.push({ ...point, timestamp: performance.now() });
  state.eraseTrail = state.eraseTrail.slice(-ERASE_TOOL.trailMaxPoints);

  if (previousPoint) {
    markPendingEraseAlongSegment(previousPoint, point);
  } else {
    markPendingEraseAtPoint(point);
  }
}

export function finishErase(): void {
  if (state.pendingEraseIds.size > 0) {
    state.strokes = state.strokes.filter((stroke) => !state.pendingEraseIds.has(stroke.id));
    const remainingSelectedIds = new Set(
      Array.from(state.selectedStrokeIds).filter((id) => state.strokes.some((stroke) => stroke.id === id)),
    );
    setSelectedStrokeIds(remainingSelectedIds);
  }

  state.pendingEraseIds.clear();
  state.eraseTrail = [];
  commitHistoryTransaction();
}
