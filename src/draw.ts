import { DRAW_POINT_SPACING, DRAW_TOOL, state } from "./state";
import type { DrawStroke, Point } from "./types";

export function startDraw(point: Point): void {
  const stroke: DrawStroke = {
    id: state.nextStrokeId,
    points: [point],
    color: DRAW_TOOL.strokeColor,
    width: DRAW_TOOL.strokeWidth,
    opacity: DRAW_TOOL.strokeOpacity,
    groupId: null,
    rotation: 0,
  };

  state.nextStrokeId += 1;
  state.currentStroke = stroke;
  state.strokes.push(stroke);
}

export function extendDraw(point: Point): void {
  if (!state.currentStroke) {
    return;
  }

  const lastPoint = state.currentStroke.points[state.currentStroke.points.length - 1];

  if (lastPoint && Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) < DRAW_POINT_SPACING) {
    return;
  }

  state.currentStroke.points.push(point);
}

export function finishDraw(): void {
  if (state.currentStroke && state.currentStroke.points.length === 1) {
    const point = state.currentStroke.points[0];
    state.currentStroke.points.push({ x: point.x + 0.01, y: point.y + 0.01 });
  }

  state.currentStroke = null;
}
