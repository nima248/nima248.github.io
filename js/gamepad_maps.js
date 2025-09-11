/* Button mappings
 * Each button or axis direction maps to an array:
 *      [short_press_action, long_press_action]
 */

import { detectPlatform } from "./util.js";

export function getMap(gamepad) {
  const platform = detectPlatform();
  if (!platform) {
    console.error("Platform detection failed!");
    return;
  }
  console.log("Platform detected:", platform);
  if (_gamepadMaps[gamepad] === undefined) {
    console.error("No gamepadMap for gamepad", gamepad);
    return;
  }
  if (_gamepadMaps[gamepad][platform] === undefined) {
    console.error("No gamepadMap for", gamepad, "on platform", platform);
    return;
  }
  if (_controlMaps[gamepad] === undefined) {
    console.error("No controlMap for gamepad", gamepad);
    return;
  }
  const controlMap = _controlMaps[gamepad];
  let map = _gamepadMaps[gamepad][platform];
  for (const axis in map.axes) {
    for (const direction in map.axes[axis]) {
      const value = map.axes[axis][direction];
      map.axes[axis][direction] = controlMap[value];
    }
  }
  for (const button in map.buttons) {
    const value = map.buttons[button];
    map.buttons[button] = controlMap[value];
  }
  return map;
}

const _controlMaps = {
  "8bitdo_zero_2": {
    left: ["low-ga", "low-ga"],
    right: ["ni", "pa"],
    up: ["low-di", "low-ke"],
    down: ["low-zo-flat", "low-zo"],

    y: ["bou", "ga"],
    x: ["di", "ke"],
    b: ["zo-flat", "zo"],
    a: ["high-ni", null],

    lt: ["off", "off"],
    rt: [null, null],
  },
};

const _gamepadMaps = {
  "8bitdo_zero_2": {
    linux: {
      axes: {
        0: {
          "-1": "left",
          1: "right",
        },
        1: {
          "-1": "up",
          1: "down",
        },
      },
      buttons: {
        1: "a",
        0: "b",
        3: "x",
        2: "y",
        4: "lt",
        5: "rt",
      },
    },
    android: {
      axes: {
        0: {
          "-1": "left",
          1: "right",
        },
        1: {
          "-1": "up",
          1: "down",
        },
      },
      buttons: {
        1: "a",
        0: "b",
        4: "x",
        3: "y",
        8: "lt",
        9: "rt",
      },
    },
  },
};
