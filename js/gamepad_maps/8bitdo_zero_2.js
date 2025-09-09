/* Button mappings
 * Each button or axis direction maps to an array:
 *      [short_press_action, long_press_action]
 */

export const gamepadMap = {
  axes: {
    0: {
      "-1": ["low-ga", "low-ga"], // left
      1: ["ni", "pa"], // right
    },
    1: {
      "-1": ["low-di", "low-ke"], // up
      1: ["low-zo-flat", "low-zo"], // down
    },
  },

  buttons: {
    2: ["bou", "ga"],
    3: ["di", "ke"],
    0: ["zo-flat", "zo"],
    1: ["high-ni", null],

    4: ["off", "off"],
    5: [null, null],
  },
};
