import { canvas, context } from "./dom";
import { drawEraserTrail } from "./erase";
import { getStrokePathData } from "./freeDraw";
import { getSelectionBounds, normalizeRectangle } from "./selection";
import {
  ERASE_TOOL,
  MAX_ZOOM,
  MIN_ZOOM,
  SELECTION_FILL,
  SELECTION_HANDLE_SIZE,
  SELECTION_STROKE,
  state,
} from "./state";
import type { DrawStroke, Point } from "./types";

export function drawStroke(stroke: DrawStroke, strokeColor = stroke.color, opacity = 1): void {
  if (stroke.points.length === 0) {
    return;
  }

  const pathData = getStrokePathData(stroke);

  context.save();
  context.globalAlpha = stroke.opacity * opacity;
  context.globalCompositeOperation = "source-over";

  if (pathData) {
    context.fillStyle = strokeColor;
    context.fill(new Path2D(pathData));
  } else {
    context.strokeStyle = strokeColor;
    context.lineWidth = stroke.width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    context.lineTo(stroke.points[0].x + 0.01, stroke.points[0].y + 0.01);
    context.stroke();
  }
  context.restore();
}

function drawSelectionHandle(center: Point): void {
  const size = SELECTION_HANDLE_SIZE / state.zoom;
  const halfSize = size / 2;

  context.beginPath();
  context.rect(center.x - halfSize, center.y - halfSize, size, size);
  context.fill();
  context.stroke();
}

function drawSelectionOverlay(): void {
  const marquee = state.pointerGesture?.mode === "marquee" ? normalizeRectangle(state.pointerGesture.start, state.pointerGesture.current) : null;
  const selectionBounds = getSelectionBounds();

  if (!marquee && !selectionBounds) {
    return;
  }

  context.save();
  context.strokeStyle = SELECTION_STROKE;
  context.fillStyle = SELECTION_FILL;
  context.lineWidth = 1.25 / state.zoom;

  if (marquee && (marquee.width > 0 || marquee.height > 0)) {
    context.setLineDash([6, 4]);
    context.fillRect(marquee.x, marquee.y, marquee.width, marquee.height);
    context.strokeRect(marquee.x, marquee.y, marquee.width, marquee.height);
    context.restore();
    return;
  }

  if (!selectionBounds) {
    context.restore();
    return;
  }

  context.setLineDash([]);
  context.beginPath();
  context.moveTo(selectionBounds.corners.nw.x, selectionBounds.corners.nw.y);
  context.lineTo(selectionBounds.corners.ne.x, selectionBounds.corners.ne.y);
  context.lineTo(selectionBounds.corners.se.x, selectionBounds.corners.se.y);
  context.lineTo(selectionBounds.corners.sw.x, selectionBounds.corners.sw.y);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  const topMidpoint = {
    x: (selectionBounds.corners.nw.x + selectionBounds.corners.ne.x) / 2,
    y: (selectionBounds.corners.nw.y + selectionBounds.corners.ne.y) / 2,
  };
  context.moveTo(topMidpoint.x, topMidpoint.y);
  context.lineTo(selectionBounds.rotationHandle.x, selectionBounds.rotationHandle.y);
  context.stroke();

  context.fillStyle = "#ffffff";
  context.strokeStyle = SELECTION_STROKE;

  drawSelectionHandle(selectionBounds.corners.nw);
  drawSelectionHandle(selectionBounds.corners.ne);
  drawSelectionHandle(selectionBounds.corners.sw);
  drawSelectionHandle(selectionBounds.corners.se);

  context.beginPath();
  context.arc(selectionBounds.rotationHandle.x, selectionBounds.rotationHandle.y, 4 / state.zoom, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function renderScene(): void {
  context.save();
  context.translate(state.offsetX, state.offsetY);
  context.scale(state.zoom, state.zoom);

  const pendingEraseIds = state.pendingEraseIds;

  state.strokes.forEach((stroke) => {
    if (!pendingEraseIds.has(stroke.id)) {
      drawStroke(stroke);
    }
  });

  state.strokes.forEach((stroke) => {
    if (pendingEraseIds.has(stroke.id)) {
      drawStroke(stroke, stroke.color, ERASE_TOOL.previewOpacity);
    }
  });

  if (state.activeTool === "pointer") {
    drawSelectionOverlay();
  }

  drawEraserTrail(state.eraseTrail);

  context.restore();
}

export function redraw(): void {
  const pixelRatio = window.devicePixelRatio || 1;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.filter = "none";
  context.globalAlpha = 1;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(pixelRatio, pixelRatio);
  renderScene();
}

export function requestAnimatedRedraw(): void {
  if (state.animationFrame !== null) {
    return;
  }

  const step = (): void => {
    state.animationFrame = null;

    if (state.activeTool === "erase" && (state.pointerDown || state.pointerInsideCanvas)) {
      redraw();
      requestAnimatedRedraw();
    }
  };

  state.animationFrame = window.requestAnimationFrame(step);
}

export function cancelAnimatedRedraw(): void {
  if (state.animationFrame !== null) {
    window.cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
}

export function resizeCanvas(): void {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  if (!state.viewportInitialized) {
    state.offsetX = window.innerWidth / 2;
    state.offsetY = window.innerHeight / 2;
    state.viewportInitialized = true;
  }

  redraw();
}

export function screenToScene(point: Point): Point {
  return {
    x: (point.x - state.offsetX) / state.zoom,
    y: (point.y - state.offsetY) / state.zoom,
  };
}

export function setZoom(nextZoom: number, anchor: Point = { x: window.innerWidth / 2, y: window.innerHeight / 2 }): void {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
  const sceneAnchor = screenToScene(anchor);
  state.zoom = zoom;
  state.offsetX = anchor.x - sceneAnchor.x * zoom;
  state.offsetY = anchor.y - sceneAnchor.y * zoom;
  redraw();
}

export function panBy(dx: number, dy: number): void {
  state.offsetX += dx;
  state.offsetY += dy;
  redraw();
}
