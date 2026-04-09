export type Tool = "pointer" | "draw" | "erase";

export type Point = {
  x: number;
  y: number;
};

export type TrailPoint = Point & {
  timestamp: number;
};

export type TrailVector = [x: number, y: number, pressure: number];

export type DrawStroke = {
  id: number;
  points: Point[];
  pressures: number[];
  simulatePressure: boolean;
  color: string;
  width: number;
  opacity: number;
  groupId: number | null;
  rotation: number;
};

export type StrokeSnapshot = {
  points: Point[];
  rotation: number;
};

export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ResizeHandle = "nw" | "ne" | "se" | "sw";

export type SelectionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  angle: number;
  corners: Record<ResizeHandle, Point>;
  rotationHandle: Point;
};

export type PointerGesture =
  | {
      mode: "marquee";
      start: Point;
      current: Point;
    }
  | {
      mode: "move";
      start: Point;
      snapshot: Map<number, StrokeSnapshot>;
    }
  | {
      mode: "rotate";
      center: Point;
      startAngle: number;
      snapshot: Map<number, StrokeSnapshot>;
    }
  | {
      mode: "resize";
      handle: ResizeHandle;
      snapshot: Map<number, StrokeSnapshot>;
      bounds: SelectionBounds;
    }
  | null;

export type PanGesture = {
  startScreen: Point;
  originOffsetX: number;
  originOffsetY: number;
} | null;

export type DrawToolConfig = {
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
};

export type EraseToolConfig = {
  previewColor: string;
  width: number;
  trailOpacity: number;
  previewOpacity: number;
  trailDecayMs: number;
  trailDecayLength: number;
  trailStreamline: number;
  trailSimplify: number;
  trailKeepHead: boolean;
  trailMaxPoints: number;
  trailMaxLength: number;
};

export type HistorySnapshot = {
  strokes: DrawStroke[];
  selectedStrokeIds: number[];
  nextStrokeId: number;
  nextGroupId: number;
};
