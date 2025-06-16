let toneModulePromiseResolve;
let toneModulePromise = new Promise((resolve) => {
  toneModulePromiseResolve = resolve;
});

const TONE_DB_NAME = "tone-cache";
const TONE_STORE = "scripts";
const TONE_KEY = "tone-v1";
const TONE_URL = "https://unpkg.com/tone@latest/build/Tone.js";

// --- IndexedDB Helpers ---
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(TONE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      console.info("Initialising indexedDB for ToneJS");
      request.result.createObjectStore(TONE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getCachedScript(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TONE_STORE, "readonly");
    const store = tx.objectStore(TONE_STORE);
    const req = store.get(TONE_KEY);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function storeScript(db, scriptText) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TONE_STORE, "readwrite");
    const store = tx.objectStore(TONE_STORE);
    const req = store.put(scriptText, TONE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- Start preloading the script ASAP ---
const toneScriptTextPromise = (async () => {
  let db = await openDB();
  let toneScriptText = await getCachedScript(db)
    .then((script) => {
      if (script) {
        console.info("Tone.JS script retrieved from cache");
        return script;
      } else {
        return null;
      }
    })
    .catch((e) => {
      console.error(e);
    });

  if (!toneScriptText) {
    toneScriptText = await fetch(TONE_URL)
      .then((res) => {
        console.info(`Fetched Tone.js from ${TONE_URL}`);
        return res.text();
      })
      .catch((e) => console.error(`Failed fetching Tone.JS: ${e}`));
    if (toneScriptText) {
      storeScript(db, toneScriptText).catch((e) => {
        console.error(`Failed to store ToneJS script in cache: ${e}`);
      });
    }
  }

  return toneScriptText;
})();

document.addEventListener(
  "click",
  async () => {
    const scriptText = await toneScriptTextPromise;
    const blob = new Blob([scriptText], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    await import(url);
    // Set latency for longer buffering to avoid pops
    const context = new Tone.Context({ latencyHint: "playback" });
    Tone.setContext(context);
    console.debug(`Latencyhint: ${Tone.getContext().latencyHint}`);

    toneModulePromiseResolve();
  },
  { once: true },
);

export { toneModulePromise };
