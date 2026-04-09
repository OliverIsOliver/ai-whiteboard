import { canvas } from "./dom";
import { extendDraw, finishDraw, startDraw } from "./draw";
import { extendErase, finishErase, startErase } from "./erase";
import { beginHistoryTransaction, commitHistoryTransaction } from "./history";
import {
  applyMoveSelection,
  applyRotateSelection,
  applyResizeSelection,
  clearSelection,
  cloneStrokePoints,
  getAngleFromCenter,
  getResizeHandleAtPoint,
  getSelectionBounds,
  getStrokeAtPoint,
  getStrokeSelectionIds,
  normalizeRectangle,
  pointHitsRotationHandle,
  pointInSelectionBounds,
  setSelectedStrokeIds,
  updateSelectionFromMarquee,
} from "./selection";
import { state } from "./state";
import { cancelAnimatedRedraw, redraw, requestAnimatedRedraw, screenToScene } from "./render";
import type { Point } from "./types";
import { syncCanvasCursor } from "./ui";

export function getCanvasPoint(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();

  return screenToScene({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
}

function getScreenPoint(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function shouldStartPan(event: PointerEvent): boolean {
  return state.spacePressed || event.button === 1;
}

export function startInteraction(event: PointerEvent): void {
  event.preventDefault();

  const point = getCanvasPoint(event);
  const screenPoint = getScreenPoint(event);
  state.pointerDown = true;
  state.pointerInsideCanvas = true;
  state.pointerPosition = point;

  if (shouldStartPan(event)) {
    state.panGesture = {
      startScreen: screenPoint,
      originOffsetX: state.offsetX,
      originOffsetY: state.offsetY,
    };
    state.pointerGesture = null;
    syncCanvasCursor();
    canvas.setPointerCapture(event.pointerId);
    redraw();
    return;
  }

  if (state.activeTool === "pointer") {
    const selectionBounds = getSelectionBounds();

    const resizeHandle =
      selectionBounds && state.selectedStrokeIds.size > 0 ? getResizeHandleAtPoint(point, selectionBounds) : null;

    if (selectionBounds && state.selectedStrokeIds.size > 0 && resizeHandle) {
      beginHistoryTransaction();
      state.pointerGesture = {
        mode: "resize",
        handle: resizeHandle,
        snapshot: cloneStrokePoints(state.selectedStrokeIds),
        bounds: selectionBounds,
      };
    } else if (
      selectionBounds &&
      state.selectedStrokeIds.size > 0 &&
      pointHitsRotationHandle(point, selectionBounds.rotationHandle)
    ) {
      beginHistoryTransaction();
      state.pointerGesture = {
        mode: "rotate",
        center: { x: selectionBounds.centerX, y: selectionBounds.centerY },
        startAngle: getAngleFromCenter(point, { x: selectionBounds.centerX, y: selectionBounds.centerY }),
        snapshot: cloneStrokePoints(state.selectedStrokeIds),
      };
    } else if (selectionBounds && state.selectedStrokeIds.size > 0 && pointInSelectionBounds(point, selectionBounds)) {
      beginHistoryTransaction();
      state.pointerGesture = {
        mode: "move",
        start: point,
        snapshot: cloneStrokePoints(state.selectedStrokeIds),
      };
    } else {
      const hitStroke = getStrokeAtPoint(point);

      if (hitStroke) {
        const strokeIds = getStrokeSelectionIds(hitStroke);
        setSelectedStrokeIds(strokeIds);
        beginHistoryTransaction();
        state.pointerGesture = {
          mode: "move",
          start: point,
          snapshot: cloneStrokePoints(state.selectedStrokeIds),
        };
      } else {
        clearSelection();
        state.pointerGesture = {
          mode: "marquee",
          start: point,
          current: point,
        };
      }
    }

    canvas.setPointerCapture(event.pointerId);
    redraw();
    return;
  }

  if (state.activeTool === "draw") {
    startDraw(point);
  } else {
    startErase(point);
    requestAnimatedRedraw();
  }

  canvas.setPointerCapture(event.pointerId);
  redraw();
}

export function extendInteraction(event: PointerEvent): void {
  const point = getCanvasPoint(event);
  const screenPoint = getScreenPoint(event);
  state.pointerPosition = point;
  state.pointerInsideCanvas = true;

  if (!state.pointerDown) {
    if (state.activeTool === "erase") {
      redraw();
      requestAnimatedRedraw();
    }
    return;
  }

  if (state.panGesture) {
    state.offsetX = state.panGesture.originOffsetX + (screenPoint.x - state.panGesture.startScreen.x);
    state.offsetY = state.panGesture.originOffsetY + (screenPoint.y - state.panGesture.startScreen.y);
    redraw();
    return;
  }

  if (state.activeTool === "pointer") {
    if (!state.pointerGesture) {
      return;
    }

    if (state.pointerGesture.mode === "marquee") {
      state.pointerGesture.current = point;
      updateSelectionFromMarquee(normalizeRectangle(state.pointerGesture.start, state.pointerGesture.current));
    } else if (state.pointerGesture.mode === "resize") {
      applyResizeSelection(
        state.pointerGesture.snapshot,
        state.pointerGesture.bounds,
        state.pointerGesture.handle,
        point,
        event.shiftKey,
      );
    } else if (state.pointerGesture.mode === "move") {
      applyMoveSelection(
        state.pointerGesture.snapshot,
        point.x - state.pointerGesture.start.x,
        point.y - state.pointerGesture.start.y,
      );
    } else if (state.pointerGesture.mode === "rotate") {
      const currentAngle = getAngleFromCenter(point, state.pointerGesture.center);
      applyRotateSelection(
        state.pointerGesture.snapshot,
        state.pointerGesture.center,
        currentAngle - state.pointerGesture.startAngle,
      );
    }
  } else if (state.activeTool === "draw") {
    extendDraw(point);
  } else {
    extendErase(point);
  }

  redraw();
}

export function endInteraction(event: PointerEvent): void {
  if (!state.pointerDown) {
    return;
  }

  state.pointerDown = false;

  if (state.panGesture) {
    state.panGesture = null;
    syncCanvasCursor();
  } else if (state.activeTool === "pointer") {
    state.pointerGesture = null;
    commitHistoryTransaction();
  } else if (state.activeTool === "draw") {
    finishDraw();
  } else {
    finishErase();
    cancelAnimatedRedraw();
  }

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  redraw();
}

export function handlePointerEnter(event: PointerEvent): void {
  state.pointerInsideCanvas = true;
  state.pointerPosition = getCanvasPoint(event);

  if (state.activeTool === "erase") {
    redraw();
    requestAnimatedRedraw();
  }
}

export function handlePointerLeave(): void {
  state.pointerInsideCanvas = false;
  state.pointerPosition = null;

  if (!state.pointerDown) {
    redraw();
  }
}

export function resetCanvas(): void {
  beginHistoryTransaction();
  state.strokes = [];
  state.currentStroke = null;
  clearSelection();
  state.pointerGesture = null;
  state.eraseTrail = [];
  state.pendingEraseIds.clear();
  state.pointerDown = false;
  state.panGesture = null;
  cancelAnimatedRedraw();
  commitHistoryTransaction();
  redraw();
}
