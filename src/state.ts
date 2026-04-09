import type {
  DrawStroke,
  DrawToolConfig,
  EraseToolConfig,
  HistorySnapshot,
  PanGesture,
  PointerGesture,
  Point,
  Tool,
  TrailPoint,
} from "./types";

export const state: {
  activeTool: Tool;
  strokes: DrawStroke[];
  currentStroke: DrawStroke | null;
  selectedStrokeIds: Set<number>;
  pointerGesture: PointerGesture;
  panGesture: PanGesture;
  eraseTrail: TrailPoint[];
  drawPanelDismissed: boolean;
  pointerPosition: Point | null;
  pointerInsideCanvas: boolean;
  pendingEraseIds: Set<number>;
  pointerDown: boolean;
  nextStrokeId: number;
  nextGroupId: number;
  clipboardStrokes: DrawStroke[];
  clipboardPasteCount: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  viewportInitialized: boolean;
  spacePressed: boolean;
  animationFrame: number | null;
  historyPast: HistorySnapshot[];
  historyFuture: HistorySnapshot[];
  pendingHistorySnapshot: HistorySnapshot | null;
} = {
  activeTool: "draw",
  strokes: [],
  currentStroke: null,
  selectedStrokeIds: new Set<number>(),
  pointerGesture: null,
  panGesture: null,
  eraseTrail: [],
  drawPanelDismissed: false,
  pointerPosition: null,
  pointerInsideCanvas: false,
  pendingEraseIds: new Set<number>(),
  pointerDown: false,
  nextStrokeId: 1,
  nextGroupId: 1,
  clipboardStrokes: [],
  clipboardPasteCount: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  viewportInitialized: false,
  spacePressed: false,
  animationFrame: null,
  historyPast: [],
  historyFuture: [],
  pendingHistorySnapshot: null,
};

export const DRAW_TOOL: DrawToolConfig = {
  strokeColor: "#1e1e1e",
  strokeWidth: 4,
  strokeOpacity: 1,
};

export const ERASE_TOOL: EraseToolConfig = {
  previewColor: "rgba(149, 154, 163, 1)",
  width: 12,
  trailOpacity: 0.7,
  previewOpacity: 0.5,
  trailDecayMs: 200,
  trailDecayLength: 10,
  trailStreamline: 0.2,
  trailSimplify: 0.1,
  trailKeepHead: true,
  trailMaxPoints: 128,
  trailMaxLength: 50,
};

export const DRAW_POINT_SPACING = 0.9;
export const SELECTION_STROKE = "#8f89ff";
export const SELECTION_FILL = "rgba(143, 137, 255, 0.12)";
export const SELECTION_HANDLE_SIZE = 7;
export const ROTATION_HANDLE_OFFSET = 18;
export const POINTER_HIT_PADDING = 6;
export const MIN_ZOOM = 0.4;
export const MAX_ZOOM = 2.5;
export const ZOOM_STEP = 0.1;
