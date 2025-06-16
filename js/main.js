import { VoiceManager } from "./VoiceManager.js";
import { ScaleManager } from "./ScaleManager.js";

const MAX_PITCH_SHIFT = 6;
const MIN_PITCH_SHIFT = -8;

const ACTIVE_NOTE_CLASS = "active-note";

const voiceManager = new VoiceManager();
const scaleManager = new ScaleManager();

const noteButtons = document.querySelectorAll(".note-btn");
const pitchButtons = document.querySelectorAll(".pitch-btn");

let activeNoteButton = null;

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
    }
  });
}

function activateNoteButton(button) {
  noteButtons.forEach((btn) => btn.classList.remove(ACTIVE_NOTE_CLASS));
  button.classList.add(ACTIVE_NOTE_CLASS);
  //console.debug("Pressed:", button.id);
  activeNoteButton = button;
}

function deactivateNoteButton(button) {
  button.classList.remove("active-note");
  activeNoteButton = null;
  //console.debug("Released:", button.id);
}

addEventListener("DOMContentLoaded", () => setNotesDisabledStatus());

noteButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    // Determine the active note
    if (button.classList.contains(ACTIVE_NOTE_CLASS)) {
      deactivateNoteButton(button);
    } else {
      activateNoteButton(button);
    }
    if (activeNoteButton === null) {
      voiceManager.stop();
    } else {
      const freq = freqOfButton(activeNoteButton);
      voiceManager.playFrequency(freq);
    }
  });
});

const pitchDownBtn = document.querySelector("#pitch-down");
const pitchUpBtn = document.querySelector("#pitch-up");
const pitchShiftP = document.querySelector("#pitch-shift");
pitchShiftP.textContent = scaleManager.getSemitonesShift();

pitchButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const semitonesChange = button.id === "pitch-up" ? 1 : -1;
    const newPitchShift = scaleManager.changeSemitonesShift(semitonesChange);
    if (activeNoteButton !== null) {
      const freq = freqOfButton(activeNoteButton);
      if (voiceManager.haveAudioForFreq(freq)) {
        voiceManager.playFrequency(freq);
      } else {
        voiceManager.stop();
        activeNoteButton.disabled = true;
        deactivateNoteButton(activeNoteButton);
      }
    }

    // update UI
    pitchShiftP.textContent = newPitchShift;
    if (semitonesChange === 1) {
      pitchDownBtn.disabled = false;
      if (newPitchShift === MAX_PITCH_SHIFT) {
        pitchUpBtn.disabled = true;
      }
    } else {
      pitchUpBtn.disabled = false;
      if (newPitchShift === MIN_PITCH_SHIFT) {
        pitchDownBtn.disabled = true;
      }
    }
    await setNotesDisabledStatus();
  });
});
