const PRESS_HOLD_DURATION_MS = 250;

import { getMap } from "./gamepad_maps.js";

export class GamepadManager {
  constructor(gamepad, onAction) {
    this.mapping = getMap(gamepad);
    this.onAction = onAction;
    this.buttonPressTimes = [];
    this.axes = [];
    this.active = false;

    window.addEventListener("gamepadconnected", () => {
      this.active = true;
      console.log("Gamepad connected");
      this.loop();
    });

    window.addEventListener("gamepaddisconnected", () => {
      this.active = false;
      console.log("Gamepad disconnected");
    });
  }

  loop() {
    if (!this.active) return;

    const gp = navigator.getGamepads()[0];
    if (gp) {
      gp.axes.forEach((value, axis) => {
        const pressTime = this.axes[axis]?.pressTime ?? null;

        if (Math.abs(value) < 0.2) value = 0; // some platforms give small values for zero

        if (!pressTime && value !== 0) {
          if (this.axes[axis] === undefined) {
            this.axes[axis] = {};
          }
          this.axes[axis].pressTime = Date.now();
          this.axes[axis].pressValue = value;
        } else if (pressTime && value === 0) {
          const pressDuration = Date.now() - pressTime;
          const releasedValue = this.axes[axis].pressValue;
          let action;
          if (pressDuration < PRESS_HOLD_DURATION_MS) {
            action = this.mapping.axes[axis][releasedValue][0];
          } else {
            action = this.mapping.axes[axis][releasedValue][1];
          }
          this.axes[axis].pressTime = null;
          if (action) {
            this.onAction(action);
          }
        }
      });

      gp.buttons.forEach((btn, i) => {
        const pressTime = this.buttonPressTimes[i] ?? null;
        const isPressed = btn.pressed;

        if (!pressTime && isPressed) {
          this.buttonPressTimes[i] = Date.now();
        } else if (pressTime && !isPressed) {
          const pressDuration = Date.now() - pressTime;
          if (!this.mapping.buttons[i]) {
            console.warn("No mapping for button ", i);
          } else {
            let action;
            if (pressDuration < PRESS_HOLD_DURATION_MS) {
              action = this.mapping.buttons[i][0];
            } else {
              action = this.mapping.buttons[i][1];
            }
            if (action) {
              this.onAction(action);
            }
          }
          this.buttonPressTimes[i] = null;
        }
      });
    }

    requestAnimationFrame(() => this.loop());
  }
}
