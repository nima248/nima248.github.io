let tonePromise = null;

export async function getTone() {
  if (!tonePromise) {
    tonePromise = import("https://cdn.skypack.dev/tone");
  }
  return tonePromise;
}
