import "../styles.css";

import {
  canvas,
  mainMenuDropdown,
  mainMenuItems,
  mainMenuShell,
  mainMenuTrigger,
  opacityInput,
  strokeColorButtons,
  strokeWidthInputs,
  toolButtons,
} from "./dom";
import { copySelectedStrokes, deleteSelectedStrokes, groupSelectedStrokes, pasteClipboard } from "./selection";
import { DRAW_TOOL, state } from "./state";
import { redraw, resizeCanvas } from "./render";
import { endInteraction, extendInteraction, handlePointerEnter, handlePointerLeave, resetCanvas, startInteraction } from "./board";
import { setActiveTool, setMainMenuOpen, syncDrawControls, updateOpacityDisplay } from "./ui";

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

setMainMenuOpen(false);
syncDrawControls();
setActiveTool("draw");
resizeCanvas();
