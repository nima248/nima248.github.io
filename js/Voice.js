let Tone;

export class Voice {
  /* Wraps a Tone.Player object for audio playback
   */
  constructor(audioUrl) {
    this.player = new Tone.Player({
      audioUrl,
      loop: true,
      autostart: false,
      fadeOut: 0.2,
    }).toDestination();
  }

  async playFile(audioUrl) {
    console.log(`playing ${file}`);
  }
}
