import glyphLibrarySources from "./glyphlibrary.json";
import { beginHistoryTransaction, commitHistoryTransaction } from "./history";
import { redraw, screenToScene } from "./render";
import { DRAW_TOOL, state } from "./state";
import type { DrawStroke, Point } from "./types";

export type ScenePoint = {
  x: number;
  y: number;
};

export type CubicBezierSegment = {
  start: ScenePoint;
  control1: ScenePoint;
  control2?: ScenePoint;
  end: ScenePoint;
};

export type BezierStroke = {
  segments: readonly CubicBezierSegment[];
};

export type RelativeScenePoint = {
  x: number;
  y: number;
};

export type RelativeCubicBezierSegment = {
  start: RelativeScenePoint;
  control1: RelativeScenePoint;
  control2?: RelativeScenePoint;
  end: RelativeScenePoint;
};

export type RelativeBezierStroke = {
  segments: readonly RelativeCubicBezierSegment[];
};

export type GlyphDefinition = {
  char: string;
  width: number;
  height: number;
  advance: number;
  strokes: readonly RelativeBezierStroke[];
};

export type GlyphRegistry = Record<string, GlyphDefinition>;

export type StrokeStyle = {
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  simulatePressure?: boolean;
};

export type PlaybackOptions = StrokeStyle & {
  durationMs?: number;
};

export type DrawStrokeOptions = PlaybackOptions & {
  points: readonly ScenePoint[];
  groupId?: number | null;
};

export type DrawBezierStrokeOptions = PlaybackOptions & {
  segments: readonly CubicBezierSegment[];
  samplesPerCurve?: number;
  controlPointJitterPx?: number;
  groupId?: number | null;
};

export type DrawParametricStrokeOptions = PlaybackOptions & {
  sample: (t: number) => ScenePoint;
  samples?: number;
  groupId?: number | null;
};

export type NormalizeGlyphOptions = {
  char: string;
  strokes: readonly BezierStroke[];
  advance?: number;
};

export type DrawGlyphOptions = PlaybackOptions & {
  char?: string;
  glyph?: GlyphDefinition;
  x: number;
  y: number;
  size: number;
  strokeGapMs?: number;
  samplesPerCurve?: number;
  controlPointJitterPx?: number;
  groupId?: number | null;
};

export type DrawTextOptions = PlaybackOptions & {
  text: string;
  x: number;
  y: number;
  size: number;
  letterSpacing?: number;
  lineHeight?: number;
  strokeGapMs?: number;
  durationMsPerGlyph?: number;
  samplesPerCurve?: number;
  controlPointJitterPx?: number;
  groupText?: boolean;
};

export type DrawResult = {
  strokeIds: number[];
  groupId: number | null;
};

export type DrawGlyphResult = DrawResult & {
  glyph: GlyphDefinition;
  advance: number;
};

export type DrawTextResult = DrawResult & {
  width: number;
  missingChars: string[];
};

export type PlaybackResult = DrawResult & {
  playbackId: string;
};

export type ProgrammaticPlayback = PlaybackResult & {
  cancel: () => void;
  finish: () => void;
  finished: Promise<PlaybackResult>;
};

export interface WhiteboardProgrammaticAPI {
  drawStroke: (options: DrawStrokeOptions) => DrawResult;
  playStroke: (options: DrawStrokeOptions) => ProgrammaticPlayback;
  drawBezierStroke: (options: DrawBezierStrokeOptions) => DrawResult;
  playBezierStroke: (options: DrawBezierStrokeOptions) => ProgrammaticPlayback;
  drawParametricStroke: (options: DrawParametricStrokeOptions) => DrawResult;
  playParametricStroke: (options: DrawParametricStrokeOptions) => ProgrammaticPlayback;
  drawGlyph: (options: DrawGlyphOptions) => DrawGlyphResult;
  playGlyph: (options: DrawGlyphOptions) => Promise<DrawGlyphResult>;
  drawText: (options: DrawTextOptions) => DrawTextResult;
  playText: (options: DrawTextOptions) => Promise<DrawTextResult>;
  normalizeGlyph: (options: NormalizeGlyphOptions) => GlyphDefinition;
  saveGlyph: (glyph: GlyphDefinition) => GlyphDefinition;
  saveGlyphFromAbsoluteStrokes: (options: NormalizeGlyphOptions) => GlyphDefinition;
  getGlyph: (char: string) => GlyphDefinition | null;
  listGlyphs: () => GlyphDefinition[];
  deleteGlyph: (char: string) => boolean;
  exportGlyphs: () => GlyphRegistry;
  importGlyphs: (glyphs: GlyphRegistry) => GlyphRegistry;
  stopAll: () => void;
  getActivePlaybackIds: () => string[];
  clear: () => void;
  getCamera: () => { zoom: number; offsetX: number; offsetY: number };
  screenToScene: (point: Point) => Point;
}

declare global {
  interface Window {
    whiteboardApi?: WhiteboardProgrammaticAPI;
  }
}

type InternalPlayback = {
  cancel: () => void;
  finish: () => void;
};

const DEFAULT_DURATION_MS = 1200;
const DEFAULT_PARAMETRIC_SAMPLES = 96;
const DEFAULT_SAMPLES_PER_CURVE = 20;
const DEFAULT_CONTROL_POINT_JITTER_PX = 15;
const DEFAULT_GLYPH_ADVANCE = 0.15;
const DEFAULT_LINE_HEIGHT = 1.35;
const DEFAULT_LETTER_SPACING = 0.08;
const DEFAULT_SPACE_ADVANCE = 0.35;
const EMPTY_GLYPH_SCALE = 272;
const GLYPH_STORAGE_KEY = "ai-whiteboard-glyphs";
const MIN_DRAW_POINTS = 2;

let glyphRegistryCache: GlyphRegistry | null = null;
const activePlaybacks = new Map<string, InternalPlayback>();

function cloneGlyph(glyph: GlyphDefinition): GlyphDefinition {
  return {
    ...glyph,
    strokes: glyph.strokes.map((stroke) => ({
      segments: stroke.segments.map((segment) => ({
        start: { ...segment.start },
        control1: { ...segment.control1 },
        ...(segment.control2 ? { control2: { ...segment.control2 } } : {}),
        end: { ...segment.end },
      })),
    })),
  };
}

function cloneGlyphRegistry(glyphs: GlyphRegistry): GlyphRegistry {
  return Object.fromEntries(Object.entries(glyphs).map(([key, glyph]) => [key, cloneGlyph(glyph)]));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (durationMs <= 0) {
      resolve();
      return;
    }

    window.setTimeout(resolve, durationMs);
  });
}

function readGlyphRegistry(): GlyphRegistry {
  try {
    const stored = window.localStorage.getItem(GLYPH_STORAGE_KEY);

    if (!stored) {
      return {};
    }

    return JSON.parse(stored) as GlyphRegistry;
  } catch (error) {
    console.error("Unable to read glyph registry", error);
    return {};
  }
}

function writeGlyphRegistry(glyphs: GlyphRegistry): void {
  try {
    window.localStorage.setItem(GLYPH_STORAGE_KEY, JSON.stringify(glyphs));
  } catch (error) {
    console.error("Unable to save glyph registry", error);
  }
}

function getSegmentPoints(segment: CubicBezierSegment | RelativeCubicBezierSegment): RelativeScenePoint[] {
  return segment.control2
    ? [segment.start, segment.control1, segment.control2, segment.end]
    : [segment.start, segment.control1, segment.end];
}

function getGlyphBounds(strokes: readonly BezierStroke[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  strokes.forEach((stroke) => {
    stroke.segments.forEach((segment) => {
      getSegmentPoints(segment).forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    throw new Error("Glyph requires at least one bezier segment");
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function isLowercaseGlyph(char: string): boolean {
  return char.toLowerCase() === char && char.toUpperCase() !== char;
}

function isLowercaseAscenderGlyph(char: string): boolean {
  return "bdfhklt".includes(char);
}

function isLowercaseFullSizeGlyph(char: string): boolean {
  return false;
}

function isLowercaseDescenderGlyph(char: string): boolean {
  return "gpqyj".includes(char);
}

function normalizeGlyphDefinition({ char, strokes, advance }: NormalizeGlyphOptions): GlyphDefinition {
  const hasSegments = strokes.some((stroke) => stroke.segments.length > 0);

  if (!hasSegments) {
    return {
      char,
      width: 0,
      height: 0,
      advance: typeof advance === "number" ? advance / EMPTY_GLYPH_SCALE : DEFAULT_GLYPH_ADVANCE,
      strokes: [],
    };
  }

  const bounds = getGlyphBounds(strokes);
  const scale = bounds.height || bounds.width || 1;
  const normalizedWidth = bounds.width / scale;
  const normalizedHeight = bounds.height / scale || 1;
  const normalizedAdvance =
    typeof advance === "number" ? advance / scale : normalizedWidth + DEFAULT_GLYPH_ADVANCE;
  const normalizedPadding = normalizedAdvance - normalizedWidth;
  const isLowercase = isLowercaseGlyph(char);
  const isAscenderLowercase = isLowercase && isLowercaseAscenderGlyph(char);
  const isFullSizeLowercase = isLowercase && (isAscenderLowercase || isLowercaseFullSizeGlyph(char));
  const isDescenderLowercase = isLowercase && isLowercaseDescenderGlyph(char);
  const lowercaseXScale = isLowercase ? (isFullSizeLowercase || isDescenderLowercase ? 1 : 0.5) : 1;
  const lowercaseYScale = isLowercase ? (isFullSizeLowercase || isDescenderLowercase ? 1 : 0.5) : 1;
  const lowercaseYOffset = isLowercase ? (isDescenderLowercase ? 0.5 : isFullSizeLowercase ? 0 : 0.5) : 0;

  return {
    char,
    width: normalizedWidth * lowercaseXScale,
    height: normalizedHeight * lowercaseYScale,
    advance: normalizedWidth * lowercaseXScale + normalizedPadding,
    strokes: strokes.map((stroke) => ({
      segments: stroke.segments.map((segment) => ({
        start: {
          x: ((segment.start.x - bounds.minX) / scale) * lowercaseXScale,
          y: lowercaseYOffset + ((segment.start.y - bounds.minY) / scale) * lowercaseYScale,
        },
        control1: {
          x: ((segment.control1.x - bounds.minX) / scale) * lowercaseXScale,
          y: lowercaseYOffset + ((segment.control1.y - bounds.minY) / scale) * lowercaseYScale,
        },
        ...(segment.control2
          ? {
              control2: {
                x: ((segment.control2.x - bounds.minX) / scale) * lowercaseXScale,
                y: lowercaseYOffset + ((segment.control2.y - bounds.minY) / scale) * lowercaseYScale,
              },
            }
          : {}),
        end: {
          x: ((segment.end.x - bounds.minX) / scale) * lowercaseXScale,
          y: lowercaseYOffset + ((segment.end.y - bounds.minY) / scale) * lowercaseYScale,
        },
      })),
    })),
  };
}

function createBuiltinGlyphRegistry(): GlyphRegistry {
  return glyphLibrarySources.reduce<GlyphRegistry>((registry, source) => {
    const glyph = normalizeGlyphDefinition(source);
    registry[glyph.char] = glyph;
    return registry;
  }, {});
}

function getGlyphRegistry(): GlyphRegistry {
  if (!glyphRegistryCache) {
    glyphRegistryCache = {
      ...createBuiltinGlyphRegistry(),
      ...readGlyphRegistry(),
    };
  }

  return glyphRegistryCache;
}

function resolveGlyph(char?: string, glyph?: GlyphDefinition): GlyphDefinition {
  if (glyph) {
    return glyph;
  }

  if (!char) {
    throw new Error("drawGlyph requires either a glyph or a character");
  }

  const registry = getGlyphRegistry();
  const resolved = registry[char] ?? registry[char.toUpperCase()] ?? registry[char.toLowerCase()];

  if (!resolved) {
    throw new Error(`No glyph saved for "${char}"`);
  }

  return resolved;
}

function sampleBezierSegment(segment: CubicBezierSegment, steps: number): ScenePoint[] {
  const points: ScenePoint[] = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const mt = 1 - t;

    if (!segment.control2) {
      points.push({
        x: mt ** 2 * segment.start.x + 2 * mt * t * segment.control1.x + t ** 2 * segment.end.x,
        y: mt ** 2 * segment.start.y + 2 * mt * t * segment.control1.y + t ** 2 * segment.end.y,
      });
      continue;
    }

    points.push({
      x:
        mt ** 3 * segment.start.x +
        3 * mt ** 2 * t * segment.control1.x +
        3 * mt * t ** 2 * segment.control2.x +
        t ** 3 * segment.end.x,
      y:
        mt ** 3 * segment.start.y +
        3 * mt ** 2 * t * segment.control1.y +
        3 * mt * t ** 2 * segment.control2.y +
        t ** 3 * segment.end.y,
    });
  }

  return points;
}

function approximateBezierLength(segment: CubicBezierSegment): number {
  const sample = sampleBezierSegment(segment, 12);
  let length = 0;

  for (let index = 1; index < sample.length; index += 1) {
    const current = sample[index];
    const previous = sample[index - 1];
    length += Math.hypot(current.x - previous.x, current.y - previous.y);
  }

  return length;
}

function jitterPoint(point: ScenePoint, maxDistance: number): ScenePoint {
  if (maxDistance <= 0) {
    return { ...point };
  }

  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * maxDistance;

  return {
    x: point.x + Math.cos(angle) * distance,
    y: point.y + Math.sin(angle) * distance,
  };
}

function jitterBezierSegments(
  segments: readonly CubicBezierSegment[],
  controlPointJitterPx: number,
): CubicBezierSegment[] {
  if (controlPointJitterPx <= 0) {
    return segments.map((segment) => ({
      start: { ...segment.start },
      control1: { ...segment.control1 },
      ...(segment.control2 ? { control2: { ...segment.control2 } } : {}),
      end: { ...segment.end },
    }));
  }

  return segments.map((segment) => ({
    start: { ...segment.start },
    control1: jitterPoint(segment.control1, controlPointJitterPx),
    ...(segment.control2 ? { control2: jitterPoint(segment.control2, controlPointJitterPx) } : {}),
    end: { ...segment.end },
  }));
}

function normalizeInputPoints(points: readonly ScenePoint[]): ScenePoint[] {
  if (points.length === 0) {
    throw new Error("Programmatic stroke requires at least one point");
  }

  if (points.length === 1) {
    return [points[0], { x: points[0].x + 0.01, y: points[0].y + 0.01 }];
  }

  return points.map((point) => ({ ...point }));
}

function resolveStyle(style: StrokeStyle) {
  return {
    color: style.strokeColor ?? DRAW_TOOL.strokeColor,
    width: style.strokeWidth ?? DRAW_TOOL.strokeWidth,
    opacity: style.opacity ?? DRAW_TOOL.strokeOpacity,
  };
}

function createStroke(points: readonly ScenePoint[], style: StrokeStyle, groupId: number | null): DrawStroke {
  const runtimeStyle = resolveStyle(style);

  return {
    id: state.nextStrokeId++,
    points: normalizeInputPoints(points),
    color: runtimeStyle.color,
    width: runtimeStyle.width,
    opacity: runtimeStyle.opacity,
    groupId,
    rotation: 0,
  };
}

function insertStroke(points: readonly ScenePoint[], style: StrokeStyle, groupId: number | null): DrawStroke {
  const stroke = createStroke(points, style, groupId);
  state.strokes.push(stroke);
  return stroke;
}

function sampleParametricStroke(sample: (t: number) => ScenePoint, samples: number): ScenePoint[] {
  const normalizedSamples = Math.max(samples, DEFAULT_PARAMETRIC_SAMPLES);
  return Array.from({ length: normalizedSamples + 1 }, (_, index) => sample(index / normalizedSamples));
}

function sampleBezierStroke(
  segments: readonly CubicBezierSegment[],
  samplesPerCurve?: number,
  controlPointJitterPx: number = DEFAULT_CONTROL_POINT_JITTER_PX,
): ScenePoint[] {
  if (segments.length === 0) {
    throw new Error("Bezier stroke requires at least one segment");
  }

  const jitteredSegments = jitterBezierSegments(segments, controlPointJitterPx);
  const points: ScenePoint[] = [];

  jitteredSegments.forEach((segment, index) => {
    const steps = samplesPerCurve ?? Math.max(DEFAULT_SAMPLES_PER_CURVE, Math.ceil(approximateBezierLength(segment) / 8));
    const segmentPoints = sampleBezierSegment(segment, steps);

    if (index > 0) {
      segmentPoints.shift();
    }

    points.push(...segmentPoints);
  });

  return points;
}

function transformGlyphStroke(stroke: RelativeBezierStroke, x: number, y: number, size: number): BezierStroke {
  return {
    segments: stroke.segments.map((segment) => ({
      start: { x: x + segment.start.x * size, y: y + segment.start.y * size },
      control1: { x: x + segment.control1.x * size, y: y + segment.control1.y * size },
      ...(segment.control2
        ? { control2: { x: x + segment.control2.x * size, y: y + segment.control2.y * size } }
        : {}),
      end: { x: x + segment.end.x * size, y: y + segment.end.y * size },
    })),
  };
}

function maybeCreateGroupId(forceGroup: boolean): number | null {
  if (!forceGroup) {
    return null;
  }

  const groupId = state.nextGroupId;
  state.nextGroupId += 1;
  return groupId;
}

function createProgrammaticPlayback(
  points: readonly ScenePoint[],
  style: StrokeStyle,
  durationMs: number,
  groupId: number | null,
): ProgrammaticPlayback {
  const sampledPoints = normalizeInputPoints(points);
  const playbackId = `playback-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  beginHistoryTransaction();
  const stroke = insertStroke([sampledPoints[0]], style, groupId);

  let animationFrame = 0;
  let startTime: number | null = null;
  let isSettled = false;
  let resolveFinished!: (value: PlaybackResult) => void;

  const finished = new Promise<PlaybackResult>((resolve) => {
    resolveFinished = resolve;
  });

  const result: PlaybackResult = {
    strokeIds: [stroke.id],
    groupId,
    playbackId,
  };

  const cleanup = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    activePlaybacks.delete(playbackId);
  };

  const settle = (callback: () => void) => {
    if (isSettled) {
      return;
    }

    isSettled = true;
    cleanup();
    callback();
  };

  const updateStrokePoints = (nextPointCount: number) => {
    stroke.points = normalizeInputPoints(sampledPoints.slice(0, clamp(nextPointCount, 1, sampledPoints.length)));
    redraw();
  };

  const finish = () => {
    updateStrokePoints(sampledPoints.length);
    settle(() => {
      commitHistoryTransaction();
      redraw();
      resolveFinished(result);
    });
  };

  const cancel = () => {
    settle(() => {
      commitHistoryTransaction();
      redraw();
      resolveFinished(result);
    });
  };

  activePlaybacks.set(playbackId, { cancel, finish });

  if (durationMs <= 0 || sampledPoints.length <= MIN_DRAW_POINTS) {
    finish();
    return {
      ...result,
      cancel,
      finish,
      finished,
    };
  }

  const tick = (timestamp: number) => {
    if (isSettled) {
      return;
    }

    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = clamp(elapsed / durationMs, 0, 1);
    const nextPointCount = Math.max(MIN_DRAW_POINTS, Math.ceil(progress * sampledPoints.length));

    updateStrokePoints(nextPointCount);

    if (progress >= 1) {
      finish();
      return;
    }

    animationFrame = requestAnimationFrame(tick);
  };

  animationFrame = requestAnimationFrame(tick);

  return {
    ...result,
    cancel,
    finish,
    finished,
  };
}

function clearBoard(): void {
  beginHistoryTransaction();
  state.strokes = [];
  state.currentStroke = null;
  state.selectedStrokeIds.clear();
  state.pointerGesture = null;
  state.pendingEraseIds.clear();
  state.eraseTrail = [];
  state.pointerDown = false;
  commitHistoryTransaction();
  redraw();
}

export function createWhiteboardProgrammaticAPI(): WhiteboardProgrammaticAPI {
  const api: WhiteboardProgrammaticAPI = {
    drawStroke(options) {
      beginHistoryTransaction();
      const stroke = insertStroke(options.points, options, options.groupId ?? null);
      commitHistoryTransaction();
      redraw();
      return { strokeIds: [stroke.id], groupId: stroke.groupId };
    },

    playStroke(options) {
      return createProgrammaticPlayback(options.points, options, options.durationMs ?? DEFAULT_DURATION_MS, options.groupId ?? null);
    },

    drawBezierStroke(options) {
      const points = sampleBezierStroke(
        options.segments,
        options.samplesPerCurve,
        options.controlPointJitterPx ?? DEFAULT_CONTROL_POINT_JITTER_PX,
      );
      beginHistoryTransaction();
      const stroke = insertStroke(points, options, options.groupId ?? null);
      commitHistoryTransaction();
      redraw();
      return { strokeIds: [stroke.id], groupId: stroke.groupId };
    },

    playBezierStroke(options) {
      const points = sampleBezierStroke(
        options.segments,
        options.samplesPerCurve,
        options.controlPointJitterPx ?? DEFAULT_CONTROL_POINT_JITTER_PX,
      );
      return createProgrammaticPlayback(points, options, options.durationMs ?? DEFAULT_DURATION_MS, options.groupId ?? null);
    },

    drawParametricStroke(options) {
      const points = sampleParametricStroke(options.sample, options.samples ?? DEFAULT_PARAMETRIC_SAMPLES);
      beginHistoryTransaction();
      const stroke = insertStroke(points, options, options.groupId ?? null);
      commitHistoryTransaction();
      redraw();
      return { strokeIds: [stroke.id], groupId: stroke.groupId };
    },

    playParametricStroke(options) {
      const points = sampleParametricStroke(options.sample, options.samples ?? DEFAULT_PARAMETRIC_SAMPLES);
      return createProgrammaticPlayback(points, options, options.durationMs ?? DEFAULT_DURATION_MS, options.groupId ?? null);
    },

    drawGlyph(options) {
      const glyph = resolveGlyph(options.char, options.glyph);
      const shouldGroup = glyph.strokes.length > 1 && options.groupId === undefined;
      const groupId = options.groupId ?? maybeCreateGroupId(shouldGroup);
      const strokeIds: number[] = [];

      beginHistoryTransaction();
      glyph.strokes.forEach((stroke) => {
        const absoluteStroke = transformGlyphStroke(stroke, options.x, options.y, options.size);
        const points = sampleBezierStroke(
          absoluteStroke.segments,
          options.samplesPerCurve,
          options.controlPointJitterPx ?? DEFAULT_CONTROL_POINT_JITTER_PX,
        );
        const inserted = insertStroke(points, options, groupId);
        strokeIds.push(inserted.id);
      });
      commitHistoryTransaction();
      redraw();

      return {
        glyph,
        advance: glyph.advance * options.size,
        strokeIds,
        groupId,
      };
    },

    async playGlyph(options) {
      const glyph = resolveGlyph(options.char, options.glyph);
      const strokeGapMs = options.strokeGapMs ?? 0;
      const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
      const perStrokeDuration = glyph.strokes.length > 0 ? durationMs / glyph.strokes.length : 0;
      const shouldGroup = glyph.strokes.length > 1 && options.groupId === undefined;
      const groupId = options.groupId ?? maybeCreateGroupId(shouldGroup);
      const strokeIds: number[] = [];

      for (const stroke of glyph.strokes) {
        const transformedStroke = transformGlyphStroke(stroke, options.x, options.y, options.size);
        const playback = api.playBezierStroke({
          ...options,
          segments: transformedStroke.segments,
          durationMs: perStrokeDuration,
          groupId,
          samplesPerCurve: options.samplesPerCurve,
          controlPointJitterPx: options.controlPointJitterPx,
        });

        strokeIds.push(...playback.strokeIds);
        await playback.finished;
        await wait(strokeGapMs);
      }

      return {
        glyph,
        advance: glyph.advance * options.size,
        strokeIds,
        groupId,
      };
    },

    drawText(options) {
      const letterSpacing = options.letterSpacing ?? DEFAULT_LETTER_SPACING;
      const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT;
      const lines = options.text.split("\n");
      const strokeIds: number[] = [];
      const missingChars: string[] = [];
      const groupId = maybeCreateGroupId(options.groupText ?? true);
      let maxWidth = 0;

      beginHistoryTransaction();
      lines.forEach((line, lineIndex) => {
        let cursorX = options.x;
        const cursorY = options.y + lineIndex * options.size * lineHeight;

        for (const character of line) {
          if (character === " ") {
            cursorX += options.size * (DEFAULT_SPACE_ADVANCE + letterSpacing);
            continue;
          }

          const glyph = getGlyphRegistry()[character] ?? getGlyphRegistry()[character.toUpperCase()] ?? getGlyphRegistry()[character.toLowerCase()];

          if (!glyph) {
            missingChars.push(character);
            cursorX += options.size * (DEFAULT_SPACE_ADVANCE + letterSpacing);
            continue;
          }

          glyph.strokes.forEach((stroke) => {
            const absoluteStroke = transformGlyphStroke(stroke, cursorX, cursorY, options.size);
            const points = sampleBezierStroke(
              absoluteStroke.segments,
              options.samplesPerCurve,
              options.controlPointJitterPx ?? DEFAULT_CONTROL_POINT_JITTER_PX,
            );
            const inserted = insertStroke(points, options, groupId);
            strokeIds.push(inserted.id);
          });

          cursorX += options.size * (glyph.advance + letterSpacing);
        }

        maxWidth = Math.max(maxWidth, cursorX - options.x);
      });
      commitHistoryTransaction();
      redraw();

      return {
        width: maxWidth,
        strokeIds,
        groupId,
        missingChars,
      };
    },

    async playText(options) {
      const letterSpacing = options.letterSpacing ?? DEFAULT_LETTER_SPACING;
      const lineHeight = options.lineHeight ?? DEFAULT_LINE_HEIGHT;
      const durationMsPerGlyph = options.durationMsPerGlyph ?? options.durationMs ?? DEFAULT_DURATION_MS;
      const groupId = maybeCreateGroupId(options.groupText ?? true);
      const strokeIds: number[] = [];
      const missingChars: string[] = [];
      let cursorX = options.x;
      let cursorY = options.y;
      let lineStartX = options.x;
      let maxWidth = 0;

      for (const character of options.text) {
        if (character === "\n") {
          maxWidth = Math.max(maxWidth, cursorX - lineStartX);
          cursorX = options.x;
          lineStartX = options.x;
          cursorY += options.size * lineHeight;
          continue;
        }

        if (character === " ") {
          cursorX += options.size * (DEFAULT_SPACE_ADVANCE + letterSpacing);
          continue;
        }

        const glyph = getGlyphRegistry()[character] ?? getGlyphRegistry()[character.toUpperCase()] ?? getGlyphRegistry()[character.toLowerCase()];

        if (!glyph) {
          missingChars.push(character);
          cursorX += options.size * (DEFAULT_SPACE_ADVANCE + letterSpacing);
          continue;
        }

        const result = await api.playGlyph({
          ...options,
          glyph,
          x: cursorX,
          y: cursorY,
          size: options.size,
          durationMs: durationMsPerGlyph,
          groupId,
          strokeGapMs: options.strokeGapMs,
          samplesPerCurve: options.samplesPerCurve,
          controlPointJitterPx: options.controlPointJitterPx,
        });

        strokeIds.push(...result.strokeIds);
        cursorX += result.advance + options.size * letterSpacing;
      }

      maxWidth = Math.max(maxWidth, cursorX - lineStartX);

      return {
        width: maxWidth,
        strokeIds,
        groupId,
        missingChars,
      };
    },

    normalizeGlyph(options) {
      return normalizeGlyphDefinition(options);
    },

    saveGlyph(glyph) {
      const registry = getGlyphRegistry();
      registry[glyph.char] = cloneGlyph(glyph);
      writeGlyphRegistry(registry);
      return cloneGlyph(glyph);
    },

    saveGlyphFromAbsoluteStrokes(options) {
      const glyph = normalizeGlyphDefinition(options);
      const registry = getGlyphRegistry();
      registry[glyph.char] = cloneGlyph(glyph);
      writeGlyphRegistry(registry);
      return cloneGlyph(glyph);
    },

    getGlyph(char) {
      const glyph = getGlyphRegistry()[char] ?? getGlyphRegistry()[char.toUpperCase()] ?? getGlyphRegistry()[char.toLowerCase()];
      return glyph ? cloneGlyph(glyph) : null;
    },

    listGlyphs() {
      return Object.values(getGlyphRegistry())
        .map((glyph) => cloneGlyph(glyph))
        .sort((left, right) => left.char.localeCompare(right.char));
    },

    deleteGlyph(char) {
      const registry = getGlyphRegistry();
      const storedRegistry = readGlyphRegistry();

      if (!(char in storedRegistry)) {
        return false;
      }

      delete storedRegistry[char];
      delete registry[char];
      writeGlyphRegistry(storedRegistry);
      glyphRegistryCache = {
        ...createBuiltinGlyphRegistry(),
        ...storedRegistry,
      };
      return true;
    },

    exportGlyphs() {
      return cloneGlyphRegistry(getGlyphRegistry());
    },

    importGlyphs(glyphs) {
      const registry = getGlyphRegistry();
      Object.entries(glyphs).forEach(([char, glyph]) => {
        registry[char] = cloneGlyph(glyph);
      });
      writeGlyphRegistry({
        ...readGlyphRegistry(),
        ...glyphs,
      });
      return cloneGlyphRegistry(registry);
    },

    stopAll() {
      Array.from(activePlaybacks.values()).forEach((playback) => playback.cancel());
    },

    getActivePlaybackIds() {
      return Array.from(activePlaybacks.keys());
    },

    clear() {
      api.stopAll();
      clearBoard();
    },

    getCamera() {
      return {
        zoom: state.zoom,
        offsetX: state.offsetX,
        offsetY: state.offsetY,
      };
    },

    screenToScene(point: Point) {
      return screenToScene(point);
    },
  };

  return api;
}

export function installProgrammaticApi(): WhiteboardProgrammaticAPI {
  const api = createWhiteboardProgrammaticAPI();
  window.whiteboardApi = api;
  return api;
}
