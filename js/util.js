import * as math from "./math.js";

export function randomChoice(choices) {
  const index = math.randomInt(choices.length);
  return choices[index];
}
