import { VoiceManager } from "./VoiceManager.js";
import { ScaleManager } from "./ScaleManager.js";

const voiceManager = new VoiceManager();
const scaleManager = new ScaleManager();

const noteButtons = document.querySelectorAll(".note-btn");

function freqOfButton(button) {
  let note = button.id.replace("note-", "");
  let octave = 0;
  if (note.startsWith("low-")) {
    note = note.replace("low-", "");
    octave = -1;
  } else if (note.startsWith("high-")) {
    note = note.replace("high-", "");
    octave = 1;
  }
  note = note.replace("-", "_");
  return scaleManager.getFreq(note, octave);
}

async function setNotesDisabledStatus() {
  await voiceManager.audioManifestLoaded();
  noteButtons.forEach((button) => {
    const freq = freqOfButton(button);
    if (voiceManager.haveAudioForFreq(freq)) {
      button.disabled = false;
    } else {
      button.disabled = true;
      console.debug(`Disabled note ${button.id}`);
    }
  });
}

addEventListener("DOMContentLoaded", () => setNotesDisabledStatus());

noteButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    // Determine the active note
    let activeButton = null;
    if (button.classList.contains("active-note")) {
      button.classList.remove("active-note");
      //console.debug("Released:", button.id);
    } else {
      noteButtons.forEach((btn) => btn.classList.remove("active-note"));
      button.classList.add("active-note");
      //console.debug("Pressed:", button.id);
      activeButton = button;
    }
    if (activeButton === null) {
      voiceManager.stopAll();
    } else {
      const freq = freqOfButton(activeButton);
      voiceManager.playFrequency(freq);
    }
  });
});
