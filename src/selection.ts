import { state, POINTER_HIT_PADDING, ROTATION_HANDLE_OFFSET } from "./state";
import { beginHistoryTransaction, commitHistoryTransaction } from "./history";
import { pointToPointDistanceSquared, square, strokeIntersectsCircle } from "./strokeGeometry";
import type { DrawStroke, Point, Rectangle, ResizeHandle, SelectionBounds, StrokeSnapshot } from "./types";

export function getStrokeBounds(stroke: DrawStroke): Rectangle {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const padding = stroke.width / 2 + POINTER_HIT_PADDING;

  stroke.points.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

export function rectanglesIntersect(a: Rectangle, b: Rectangle): boolean {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

export function getSelectedStrokes(): DrawStroke[] {
  return state.strokes.filter((stroke) => state.selectedStrokeIds.has(stroke.id));
}

export function cloneStrokePoints(strokeIds: Set<number>): Map<number, StrokeSnapshot> {
  const snapshot = new Map<number, StrokeSnapshot>();

  state.strokes.forEach((stroke) => {
    if (strokeIds.has(stroke.id)) {
      snapshot.set(stroke.id, {
        points: stroke.points.map((point) => ({ ...point })),
        rotation: stroke.rotation,
      });
    }
  });

  return snapshot;
}

export function expandStrokeIdsByGroup(strokeIds: Set<number>): Set<number> {
  const expanded = new Set<number>(strokeIds);
  const groupedIds = new Set<number>();

  state.strokes.forEach((stroke) => {
    if (expanded.has(stroke.id) && stroke.groupId !== null) {
      groupedIds.add(stroke.groupId);
    }
  });

  if (groupedIds.size === 0) {
    return expanded;
  }

  state.strokes.forEach((stroke) => {
    if (stroke.groupId !== null && groupedIds.has(stroke.groupId)) {
      expanded.add(stroke.id);
    }
  });

  return expanded;
}

export function setSelectedStrokeIds(strokeIds: Set<number>): void {
  state.selectedStrokeIds = expandStrokeIdsByGroup(strokeIds);
}

export function clearSelection(): void {
  state.selectedStrokeIds.clear();
}

export function getSelectionBounds(): SelectionBounds | null {
  const selected = getSelectedStrokes();

  if (selected.length === 0) {
    return null;
  }

  const rawBounds = selected.map(getStrokeBounds);
  const rawMinX = Math.min(...rawBounds.map((bound) => bound.x));
  const rawMinY = Math.min(...rawBounds.map((bound) => bound.y));
  const rawMaxX = Math.max(...rawBounds.map((bound) => bound.x + bound.width));
  const rawMaxY = Math.max(...rawBounds.map((bound) => bound.y + bound.height));
  const centerX = (rawMinX + rawMaxX) / 2;
  const centerY = (rawMinY + rawMaxY) / 2;
  const angle = getCommonSelectionAngle(selected);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selected.forEach((stroke) => {
    const padding = stroke.width / 2 + POINTER_HIT_PADDING;

    stroke.points.forEach((point) => {
      const local = rotatePoint(point, { x: centerX, y: centerY }, -angle);
      minX = Math.min(minX, local.x - padding);
      minY = Math.min(minY, local.y - padding);
      maxX = Math.max(maxX, local.x + padding);
      maxY = Math.max(maxY, local.y + padding);
    });
  });

  const nw = rotatePoint({ x: minX, y: minY }, { x: centerX, y: centerY }, angle);
  const ne = rotatePoint({ x: maxX, y: minY }, { x: centerX, y: centerY }, angle);
  const se = rotatePoint({ x: maxX, y: maxY }, { x: centerX, y: centerY }, angle);
  const sw = rotatePoint({ x: minX, y: maxY }, { x: centerX, y: centerY }, angle);
  const rotationHandle = rotatePoint(
    { x: (minX + maxX) / 2, y: minY - ROTATION_HANDLE_OFFSET },
    { x: centerX, y: centerY },
    angle,
  );

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    centerX,
    centerY,
    angle,
    corners: { nw, ne, se, sw },
    rotationHandle,
  };
}

export function pointInRectangle(point: Point, rect: Rectangle): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function getCommonSelectionAngle(strokes: DrawStroke[]): number {
  if (strokes.length === 0) {
    return 0;
  }

  const baseline = strokes[0].rotation;
  const epsilon = 0.0001;

  if (strokes.every((stroke) => Math.abs(stroke.rotation - baseline) <= epsilon)) {
    return baseline;
  }

  return 0;
}

export function pointHitsRotationHandle(point: Point, handle: Point): boolean {
  return pointToPointDistanceSquared(point, handle) <= square(8);
}

export function getAngleFromCenter(point: Point, center: Point): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

function toLocalPoint(point: Point, bounds: SelectionBounds): Point {
  return rotatePoint(point, { x: bounds.centerX, y: bounds.centerY }, -bounds.angle);
}

export function pointInSelectionBounds(point: Point, bounds: SelectionBounds): boolean {
  const local = toLocalPoint(point, bounds);
  return pointInRectangle(local, { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
}

export function getResizeHandleAtPoint(point: Point, bounds: SelectionBounds): ResizeHandle | null {
  const handles: ResizeHandle[] = ["nw", "ne", "se", "sw"];

  for (const handle of handles) {
    if (pointToPointDistanceSquared(point, bounds.corners[handle]) <= square(10)) {
      return handle;
    }
  }

  return null;
}

export function getStrokeSelectionIds(stroke: DrawStroke): Set<number> {
  const ids = new Set<number>([stroke.id]);

  if (stroke.groupId === null) {
    return ids;
  }

  state.strokes.forEach((candidate) => {
    if (candidate.groupId === stroke.groupId) {
      ids.add(candidate.id);
    }
  });

  return ids;
}

export function getStrokeAtPoint(point: Point): DrawStroke | null {
  for (let index = state.strokes.length - 1; index >= 0; index -= 1) {
    const stroke = state.strokes[index];

    if (strokeIntersectsCircle(stroke, point, POINTER_HIT_PADDING)) {
      return stroke;
    }
  }

  return null;
}

export function normalizeRectangle(start: Point, end: Point): Rectangle {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);

  return {
    x,
    y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function updateSelectionFromMarquee(rect: Rectangle): void {
  const matchingIds = new Set<number>();

  state.strokes.forEach((stroke) => {
    if (rectanglesIntersect(getStrokeBounds(stroke), rect)) {
      matchingIds.add(stroke.id);
    }
  });

  setSelectedStrokeIds(matchingIds);
}

export function applyMoveSelection(snapshot: Map<number, StrokeSnapshot>, dx: number, dy: number): void {
  state.strokes.forEach((stroke) => {
    const original = snapshot.get(stroke.id);

    if (!original) {
      return;
    }

    stroke.points = original.points.map((point) => ({
      x: point.x + dx,
      y: point.y + dy,
    }));
    stroke.rotation = original.rotation;
  });
}

export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;

  return {
    x: center.x + translatedX * cosine - translatedY * sine,
    y: center.y + translatedX * sine + translatedY * cosine,
  };
}

export function applyRotateSelection(snapshot: Map<number, StrokeSnapshot>, center: Point, angle: number): void {
  state.strokes.forEach((stroke) => {
    const original = snapshot.get(stroke.id);

    if (!original) {
      return;
    }

    stroke.points = original.points.map((point) => rotatePoint(point, center, angle));
    stroke.rotation = original.rotation + angle;
  });
}

function getResizeAnchor(bounds: SelectionBounds, handle: ResizeHandle): Point {
  switch (handle) {
    case "nw":
      return { x: bounds.x + bounds.width, y: bounds.y + bounds.height };
    case "ne":
      return { x: bounds.x, y: bounds.y + bounds.height };
    case "se":
      return { x: bounds.x, y: bounds.y };
    case "sw":
      return { x: bounds.x + bounds.width, y: bounds.y };
  }
}

function getResizeDirection(bounds: SelectionBounds, handle: ResizeHandle): Point {
  switch (handle) {
    case "nw":
      return { x: -1, y: -1 };
    case "ne":
      return { x: 1, y: -1 };
    case "se":
      return { x: 1, y: 1 };
    case "sw":
      return { x: -1, y: 1 };
  }
}

export function applyResizeSelection(
  snapshot: Map<number, StrokeSnapshot>,
  bounds: SelectionBounds,
  handle: ResizeHandle,
  point: Point,
  lockAspectRatio = false,
): void {
  const anchor = getResizeAnchor(bounds, handle);
  const direction = getResizeDirection(bounds, handle);
  const localPoint = toLocalPoint(point, bounds);
  const minWidth = 8;
  const minHeight = 8;
  let nextWidth = Math.max(Math.abs(localPoint.x - anchor.x), minWidth);
  let nextHeight = Math.max(Math.abs(localPoint.y - anchor.y), minHeight);

  if (lockAspectRatio) {
    const aspectRatio = bounds.width / Math.max(bounds.height, 1);

    if (nextWidth / Math.max(nextHeight, 1) > aspectRatio) {
      nextHeight = nextWidth / aspectRatio;
    } else {
      nextWidth = nextHeight * aspectRatio;
    }
  }

  const scaleX = nextWidth / Math.max(bounds.width, 1);
  const scaleY = nextHeight / Math.max(bounds.height, 1);

  state.strokes.forEach((stroke) => {
    const original = snapshot.get(stroke.id);

    if (!original) {
      return;
    }

    stroke.points = original.points.map((originalPoint) => {
      const local = rotatePoint(originalPoint, { x: bounds.centerX, y: bounds.centerY }, -bounds.angle);

      return rotatePoint(
        {
          x: anchor.x + (local.x - anchor.x) * scaleX,
          y: anchor.y + (local.y - anchor.y) * scaleY,
        },
        { x: bounds.centerX, y: bounds.centerY },
        bounds.angle,
      );
    });
    stroke.rotation = original.rotation;
  });
}

export function deleteSelectedStrokes(): void {
  if (state.selectedStrokeIds.size === 0) {
    return;
  }

  beginHistoryTransaction();
  state.strokes = state.strokes.filter((stroke) => !state.selectedStrokeIds.has(stroke.id));
  clearSelection();
  commitHistoryTransaction();
}

export function copySelectedStrokes(): void {
  const selected = getSelectedStrokes();

  if (selected.length === 0) {
    return;
  }

  state.clipboardStrokes = selected.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }));
  state.clipboardPasteCount = 0;
}

export function pasteClipboard(): void {
  if (state.clipboardStrokes.length === 0) {
    return;
  }

  beginHistoryTransaction();
  state.clipboardPasteCount += 1;
  const offset = 24 * state.clipboardPasteCount;
  const groupIdMap = new Map<number, number>();
  const newSelectedIds = new Set<number>();

  const clones = state.clipboardStrokes.map((stroke) => {
    let nextGroupId: number | null = null;

    if (stroke.groupId !== null) {
      nextGroupId = groupIdMap.get(stroke.groupId) ?? null;

      if (nextGroupId === null) {
        nextGroupId = state.nextGroupId;
        state.nextGroupId += 1;
        groupIdMap.set(stroke.groupId, nextGroupId);
      }
    }

    const clone: DrawStroke = {
      ...stroke,
      id: state.nextStrokeId,
      groupId: nextGroupId,
      points: stroke.points.map((point) => ({
        x: point.x + offset,
        y: point.y + offset,
      })),
    };

    state.nextStrokeId += 1;
    newSelectedIds.add(clone.id);
    return clone;
  });

  state.strokes.push(...clones);
  setSelectedStrokeIds(newSelectedIds);
  commitHistoryTransaction();
}

export function groupSelectedStrokes(): void {
  if (state.selectedStrokeIds.size < 2) {
    return;
  }

  beginHistoryTransaction();
  const groupId = state.nextGroupId;
  state.nextGroupId += 1;

  state.strokes.forEach((stroke) => {
    if (state.selectedStrokeIds.has(stroke.id)) {
      stroke.groupId = groupId;
    }
  });
  commitHistoryTransaction();
}
