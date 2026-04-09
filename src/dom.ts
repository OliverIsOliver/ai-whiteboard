const canvasElement = document.getElementById("board");

if (!(canvasElement instanceof HTMLCanvasElement)) {
  throw new Error("Expected #board canvas element to exist.");
}

const contextValue = canvasElement.getContext("2d");

if (!contextValue) {
  throw new Error("2D canvas context is not available.");
}

export const canvas = canvasElement;
export const context = contextValue;
export const toolButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tool]"));
export const mainMenuShell = document.querySelector(".main-menu-shell");
export const mainMenuTrigger = document.querySelector<HTMLButtonElement>(".main-menu-trigger");
export const mainMenuDropdown = document.querySelector<HTMLElement>(".main-menu-dropdown");
export const mainMenuItems = Array.from(document.querySelectorAll<HTMLButtonElement>(".main-menu-item"));
export const drawPanel = document.querySelector<HTMLElement>(".draw-panel");
export const strokeColorButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-stroke-color]"));
export const strokeWidthInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="stroke-width"]'));
export const opacityInput = document.querySelector<HTMLInputElement>(".draw-panel__range");
export const opacityValue = document.querySelector<HTMLElement>(".draw-panel__value");
export const activeStrokeColorButton = document.querySelector<HTMLElement>('[data-openpopup="elementStroke"]');
export const zoomOutButton = document.querySelector<HTMLButtonElement>(".zoom-out-button");
export const zoomResetButton = document.querySelector<HTMLButtonElement>(".reset-zoom-button");
export const zoomInButton = document.querySelector<HTMLButtonElement>(".zoom-in-button");
export const undoButton = document.querySelector<HTMLButtonElement>(".undo-button");
export const redoButton = document.querySelector<HTMLButtonElement>(".redo-button");
