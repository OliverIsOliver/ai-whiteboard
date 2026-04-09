import "../styles.css";

import {
  canvas,
  mainMenuDropdown,
  mainMenuItems,
  mainMenuShell,
  mainMenuTrigger,
  opacityInput,
  redoButton,
  strokeColorButtons,
  strokeWidthInputs,
  toolButtons,
  undoButton,
  zoomInButton,
  zoomOutButton,
  zoomResetButton,
} from "./dom";
import { redoHistory, undoHistory } from "./history";
import { copySelectedStrokes, deleteSelectedStrokes, groupSelectedStrokes, pasteClipboard } from "./selection";
import { DRAW_TOOL, state, ZOOM_STEP } from "./state";
import { panBy, redraw, resizeCanvas, setZoom } from "./render";
import { endInteraction, extendInteraction, handlePointerEnter, handlePointerLeave, resetCanvas, startInteraction } from "./board";
import {
  setActiveTool,
  setMainMenuOpen,
  syncCanvasCursor,
  syncDrawControls,
  syncHistoryControls,
  syncZoomControls,
  updateOpacityDisplay,
} from "./ui";

toolButtons.forEach((button) => {
  const tool = button.dataset.tool;

  if (tool === "pointer" || tool === "draw" || tool === "erase") {
    button.addEventListener("click", () => setActiveTool(tool));
  }
});

mainMenuTrigger?.addEventListener("click", (event) => {
  event.stopPropagation();
  setMainMenuOpen(mainMenuDropdown?.hidden ?? true);
});

mainMenuItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (item.dataset.action === "reset") {
      resetCanvas();
    }

    setMainMenuOpen(false);
  });
});

strokeColorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const color = button.dataset.strokeColor;

    if (!color) {
      return;
    }

    DRAW_TOOL.strokeColor = color;
    syncDrawControls();
  });
});

strokeWidthInputs.forEach((input) => {
  input.addEventListener("change", () => {
    DRAW_TOOL.strokeWidth = Number(input.value);
    syncDrawControls();
  });
});

opacityInput?.addEventListener("input", () => {
  const input = opacityInput;

  if (!input) {
    return;
  }

  const value = Number(input.value);
  DRAW_TOOL.strokeOpacity = value / 100;
  updateOpacityDisplay(value);
});

zoomOutButton?.addEventListener("click", () => {
  setZoom(state.zoom - ZOOM_STEP);
  syncZoomControls();
});

zoomResetButton?.addEventListener("click", () => {
  setZoom(1);
  syncZoomControls();
});

zoomInButton?.addEventListener("click", () => {
  setZoom(state.zoom + ZOOM_STEP);
  syncZoomControls();
});

undoButton?.addEventListener("click", () => {
  undoHistory();
});

redoButton?.addEventListener("click", () => {
  redoHistory();
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const anchor = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    if (event.ctrlKey) {
      const zoomFactor = Math.exp(-event.deltaY * 0.0025);
      setZoom(state.zoom * zoomFactor, anchor);
      syncZoomControls();
      return;
    }

    panBy(-event.deltaX, -event.deltaY);
  },
  { passive: false },
);

document.addEventListener("pointerdown", (event) => {
  if (!mainMenuShell || !(event.target instanceof Node)) {
    return;
  }

  if (!mainMenuShell.contains(event.target)) {
    setMainMenuOpen(false);
  }
});

window.addEventListener("keydown", (event) => {
  const isEditableTarget =
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement;
  const key = event.key.toLowerCase();

  if (key === " ") {
    state.spacePressed = true;
    syncCanvasCursor();

    if (!isEditableTarget) {
      event.preventDefault();
    }
  }

  if (key === "escape") {
    setMainMenuOpen(false);
  }

  if ((key === "backspace" || key === "delete") && state.selectedStrokeIds.size > 0 && !isEditableTarget) {
    event.preventDefault();
    deleteSelectedStrokes();
    redraw();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && key === "g" && !isEditableTarget) {
    event.preventDefault();
    groupSelectedStrokes();
    redraw();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && key === "z" && !isEditableTarget) {
    event.preventDefault();

    if (event.shiftKey) {
      redoHistory();
    } else {
      undoHistory();
    }

    return;
  }

  if ((event.metaKey || event.ctrlKey) && key === "y" && !isEditableTarget) {
    event.preventDefault();
    redoHistory();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && key === "c" && !isEditableTarget) {
    event.preventDefault();
    copySelectedStrokes();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && key === "v" && !isEditableTarget) {
    event.preventDefault();
    pasteClipboard();
    redraw();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && (key === "=" || key === "+") && !isEditableTarget) {
    event.preventDefault();
    setZoom(state.zoom + ZOOM_STEP);
    syncZoomControls();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && key === "-" && !isEditableTarget) {
    event.preventDefault();
    setZoom(state.zoom - ZOOM_STEP);
    syncZoomControls();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && key === "0" && !isEditableTarget) {
    event.preventDefault();
    setZoom(1);
    syncZoomControls();
    return;
  }

  if (isEditableTarget || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  if (key === "d") {
    setActiveTool("draw");
  }

  if (key === "e") {
    setActiveTool("erase");
  }

  if (key === "c") {
    setActiveTool("pointer");
  }
});

canvas.addEventListener("pointerdown", startInteraction);
canvas.addEventListener("pointermove", extendInteraction);
canvas.addEventListener("pointerup", endInteraction);
canvas.addEventListener("pointercancel", endInteraction);
canvas.addEventListener("pointerenter", handlePointerEnter);
canvas.addEventListener("pointerleave", handlePointerLeave);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("keyup", (event) => {
  if (event.key === " ") {
    state.spacePressed = false;
    syncCanvasCursor();
  }
});
window.addEventListener("blur", () => {
  state.spacePressed = false;
  state.panGesture = null;
  syncCanvasCursor();
});

setMainMenuOpen(false);
syncDrawControls();
setActiveTool("draw");
resizeCanvas();
syncZoomControls();
syncHistoryControls();
syncCanvasCursor();
