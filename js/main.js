import { VoiceManager } from "./VoiceManager.js";

const voiceManager = new VoiceManager("./audio");

const noteButtons = document.querySelectorAll(".note-btn");

noteButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    // Determine the active note
    let activeNote = null;
    if (button.classList.contains("active-note")) {
      button.classList.remove("active-note");
      console.log("Released:", button.id);
    } else {
      noteButtons.forEach((btn) => btn.classList.remove("active-note"));
      button.classList.add("active-note");
      console.log("Pressed:", button.id);
      activeNote = button.id;
    }

    // Testing
    if (
      (activeNote != null) &
      ((button.id === "note-test-1") | (button.id === "note-test-2"))
    ) {
      voiceManager.playFrequency(440);
      voiceManager.playFrequency(428);
      voiceManager.playFrequency(528);
      voiceManager.playFrequency(660);
    }
  });
});
