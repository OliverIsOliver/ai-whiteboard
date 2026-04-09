import { redraw } from "./render";
import { state } from "./state";
import type { DrawStroke, HistorySnapshot } from "./types";
import { syncHistoryControls } from "./ui";

function cloneStroke(stroke: DrawStroke): DrawStroke {
  return {
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
    pressures: [...stroke.pressures],
  };
}

function cloneStrokes(strokes: DrawStroke[]): DrawStroke[] {
  return strokes.map(cloneStroke);
}

function createSnapshot(): HistorySnapshot {
  return {
    strokes: cloneStrokes(state.strokes),
    selectedStrokeIds: Array.from(state.selectedStrokeIds),
    nextStrokeId: state.nextStrokeId,
    nextGroupId: state.nextGroupId,
  };
}

function snapshotsEqual(a: HistorySnapshot, b: HistorySnapshot): boolean {
  if (
    a.nextStrokeId !== b.nextStrokeId ||
    a.nextGroupId !== b.nextGroupId ||
    a.selectedStrokeIds.length !== b.selectedStrokeIds.length ||
    a.strokes.length !== b.strokes.length
  ) {
    return false;
  }

  for (let index = 0; index < a.selectedStrokeIds.length; index += 1) {
    if (a.selectedStrokeIds[index] !== b.selectedStrokeIds[index]) {
      return false;
    }
  }

  for (let index = 0; index < a.strokes.length; index += 1) {
    const left = a.strokes[index];
    const right = b.strokes[index];

    if (
      left.id !== right.id ||
      left.color !== right.color ||
      left.width !== right.width ||
      left.opacity !== right.opacity ||
      left.groupId !== right.groupId ||
      left.rotation !== right.rotation ||
      left.simulatePressure !== right.simulatePressure ||
      left.pressures.length !== right.pressures.length ||
      left.points.length !== right.points.length
    ) {
      return false;
    }

    for (let pressureIndex = 0; pressureIndex < left.pressures.length; pressureIndex += 1) {
      if (left.pressures[pressureIndex] !== right.pressures[pressureIndex]) {
        return false;
      }
    }

    for (let pointIndex = 0; pointIndex < left.points.length; pointIndex += 1) {
      const leftPoint = left.points[pointIndex];
      const rightPoint = right.points[pointIndex];

      if (leftPoint.x !== rightPoint.x || leftPoint.y !== rightPoint.y) {
        return false;
      }
    }
  }

  return true;
}

function restoreSnapshot(snapshot: HistorySnapshot): void {
  state.strokes = cloneStrokes(snapshot.strokes);
  state.selectedStrokeIds = new Set(snapshot.selectedStrokeIds);
  state.nextStrokeId = snapshot.nextStrokeId;
  state.nextGroupId = snapshot.nextGroupId;
  state.currentStroke = null;
  state.pointerGesture = null;
  state.panGesture = null;
  state.pendingEraseIds.clear();
  state.eraseTrail = [];
  state.pointerDown = false;
}

export function beginHistoryTransaction(): void {
  if (state.pendingHistorySnapshot) {
    return;
  }

  state.pendingHistorySnapshot = createSnapshot();
}

export function commitHistoryTransaction(): void {
  if (!state.pendingHistorySnapshot) {
    syncHistoryControls();
    return;
  }

  const previous = state.pendingHistorySnapshot;
  state.pendingHistorySnapshot = null;
  const next = createSnapshot();

  if (snapshotsEqual(previous, next)) {
    syncHistoryControls();
    return;
  }

  state.historyPast.push(previous);
  state.historyFuture = [];
  syncHistoryControls();
}

export function cancelHistoryTransaction(): void {
  state.pendingHistorySnapshot = null;
  syncHistoryControls();
}

export function canUndo(): boolean {
  return state.historyPast.length > 0;
}

export function canRedo(): boolean {
  return state.historyFuture.length > 0;
}

export function undoHistory(): void {
  if (!canUndo()) {
    return;
  }

  const current = createSnapshot();
  const previous = state.historyPast.pop();

  if (!previous) {
    return;
  }

  state.historyFuture.push(current);
  restoreSnapshot(previous);
  syncHistoryControls();
  redraw();
}

export function redoHistory(): void {
  if (!canRedo()) {
    return;
  }

  const current = createSnapshot();
  const next = state.historyFuture.pop();

  if (!next) {
    return;
  }

  state.historyPast.push(current);
  restoreSnapshot(next);
  syncHistoryControls();
  redraw();
}
