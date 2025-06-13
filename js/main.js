import { VoiceManager } from "./VoiceManager.js";

const voiceManager = new VoiceManager();

const noteButtons = document.querySelectorAll(".note-btn");

noteButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    // Determine the active note
    let activeNote = null;
    if (button.classList.contains("active-note")) {
      button.classList.remove("active-note");
      //console.debug("Released:", button.id);
    } else {
      noteButtons.forEach((btn) => btn.classList.remove("active-note"));
      button.classList.add("active-note");
      //console.debug("Pressed:", button.id);
      activeNote = button.id;
    }

    // Testing
    if (activeNote === null) {
      voiceManager.stopAll();
    } else if (
      (activeNote != null) &
      ((button.id === "note-test-1") | (button.id === "note-test-2"))
    ) {
      voiceManager.playFrequency(110);
    }
  });
});
