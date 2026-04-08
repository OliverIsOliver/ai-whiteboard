import {
  activeStrokeColorButton,
  canvas,
  drawPanel,
  mainMenuDropdown,
  mainMenuTrigger,
  opacityInput,
  opacityValue,
  strokeColorButtons,
  strokeWidthInputs,
  toolButtons,
} from "./dom";
import { DRAW_TOOL, state } from "./state";
import { redraw } from "./render";
import type { Tool } from "./types";

export function updateDrawPanelVisibility(): void {
  if (!drawPanel) {
    return;
  }

  const isMenuOpen = !(mainMenuDropdown?.hidden ?? true);
  drawPanel.hidden = state.activeTool !== "draw" || state.drawPanelDismissed || isMenuOpen;
}

export function setMainMenuOpen(isOpen: boolean): void {
  if (!mainMenuTrigger || !mainMenuDropdown) {
    return;
  }

  mainMenuDropdown.hidden = !isOpen;
  mainMenuTrigger.setAttribute("aria-expanded", String(isOpen));
  mainMenuTrigger.dataset.state = isOpen ? "open" : "closed";

  if (isOpen) {
    state.drawPanelDismissed = true;
  }

  updateDrawPanelVisibility();
}

export function updateOpacityDisplay(value: number): void {
  if (!opacityInput || !opacityValue) {
    return;
  }

  const percentage = `${value}%`;
  opacityValue.textContent = String(value);
  opacityInput.style.background = `linear-gradient(to right, #d9d7ff 0%, #d9d7ff ${percentage}, #ebecef ${percentage}, #ebecef 100%)`;

  const thumbSize = 16;
  const availableWidth = Math.max(0, opacityInput.clientWidth - thumbSize);
  const bubbleLeft = thumbSize / 2 + (value / 100) * availableWidth;
  opacityValue.style.left = `${bubbleLeft}px`;
}

export function syncDrawControls(): void {
  strokeColorButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.strokeColor === DRAW_TOOL.strokeColor);
  });

  strokeWidthInputs.forEach((input) => {
    const isActive = Number(input.value) === DRAW_TOOL.strokeWidth;
    input.checked = isActive;
    input.closest(".width-option")?.classList.toggle("active", isActive);
  });

  if (activeStrokeColorButton) {
    activeStrokeColorButton.style.setProperty("--swatch-color", DRAW_TOOL.strokeColor);
  }

  if (opacityInput) {
    const value = Math.round(DRAW_TOOL.strokeOpacity * 100);
    opacityInput.value = String(value);
    updateOpacityDisplay(value);
  }
}

export function setActiveTool(tool: Tool): void {
  state.activeTool = tool;
  canvas.style.cursor = tool === "draw" ? "crosshair" : tool === "erase" ? "none" : "default";

  toolButtons.forEach((button) => {
    const isActive = button.dataset.tool === tool;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (tool === "draw") {
    state.drawPanelDismissed = false;
    setMainMenuOpen(false);
  }

  updateDrawPanelVisibility();

  if (tool === "draw") {
    syncDrawControls();
  }

  redraw();
}
