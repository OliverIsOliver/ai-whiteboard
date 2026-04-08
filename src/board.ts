import { canvas } from "./dom";
import { extendDraw, finishDraw, startDraw } from "./draw";
import { extendErase, finishErase, startErase } from "./erase";
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
import { cancelAnimatedRedraw, redraw, requestAnimatedRedraw } from "./render";
import type { Point } from "./types";

export function getCanvasPoint(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function startInteraction(event: PointerEvent): void {
  event.preventDefault();

  const point = getCanvasPoint(event);
  state.pointerDown = true;
  state.pointerInsideCanvas = true;
  state.pointerPosition = point;

  if (state.activeTool === "pointer") {
    const selectionBounds = getSelectionBounds();

    const resizeHandle =
      selectionBounds && state.selectedStrokeIds.size > 0 ? getResizeHandleAtPoint(point, selectionBounds) : null;

    if (selectionBounds && state.selectedStrokeIds.size > 0 && resizeHandle) {
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
      state.pointerGesture = {
        mode: "rotate",
        center: { x: selectionBounds.centerX, y: selectionBounds.centerY },
        startAngle: getAngleFromCenter(point, { x: selectionBounds.centerX, y: selectionBounds.centerY }),
        snapshot: cloneStrokePoints(state.selectedStrokeIds),
      };
    } else if (selectionBounds && state.selectedStrokeIds.size > 0 && pointInSelectionBounds(point, selectionBounds)) {
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
  state.pointerPosition = point;
  state.pointerInsideCanvas = true;

  if (!state.pointerDown) {
    if (state.activeTool === "erase") {
      redraw();
      requestAnimatedRedraw();
    }
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

  if (state.activeTool === "pointer") {
    state.pointerGesture = null;
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
  state.strokes = [];
  state.currentStroke = null;
  clearSelection();
  state.pointerGesture = null;
  state.eraseTrail = [];
  state.pendingEraseIds.clear();
  state.pointerDown = false;
  cancelAnimatedRedraw();
  redraw();
}
