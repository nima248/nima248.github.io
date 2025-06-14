/* Manages the calculations from Byzantine paralagi
 * (Ni, Pa...) to frequency values.
 */

// Frequency multipliers of notes
const SCALES = {
  diatonic: {
    basis: "ni",
    ni: 1,
    pa: 9 / 8,
    bou: 5 / 4,
    ga: 4 / 3,
    di: 3 / 2,
    ke: (3 / 2) * (9 / 8),
    zo_flat: (3 / 2) * (6 / 5),
    zo: (3 / 2) * (5 / 4),
  },
};

// Use Di as the home basis frequency,
// A3 less a pure M2 (~G2)
const DEFAULT_DI_FREQ = 220 / (9 / 8);

const DEFAULT_BASIS_FREQS = {
  di: DEFAULT_DI_FREQ,
  ni: DEFAULT_DI_FREQ / (3 / 2),
};

export class ScaleManager {
  constructor() {
    this.scale = SCALES.diatonic;
    this.setMoriaShift(0);
  }

  getFreq(note, octave) {
    let freq = this.basisFreq * this.scale[note];
    if (octave === -1) {
      freq /= 2;
    } else if (octave === 1) {
      freq *= 2;
    }
    return freq;
  }

  setMoriaShift(moria) {
    // Convert moria shift to a multiplicative value
    const shiftMult = 2 ** (moria / 72);
    this.basisFreq = DEFAULT_BASIS_FREQS[this.scale.basis] * shiftMult;
    console.debug(`Basis ${this.scale.basis} set to ${this.basisFreq}`);
  }
}
