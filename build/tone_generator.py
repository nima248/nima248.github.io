#!/bin/env python3

import math
import numpy as np
import pathlib
import soundfile as sf
import subprocess
import tempfile

NOTES = {
    'C': -9,
    'Csh': -8,
    'D': -7,
    'Dsh': -6,
    'E': -5,
    'F': -4,
    'Fsh': -3,
    'G': -2,
    'Gsh': -1,
    'A': 0,
    'Ash': 1,
    'B': 2, 
}

SR = 44100
DURATION = 1.0
HARMONICS = 20  # number of partials
FREQ_CUTOFF = 5000


def make_tone(note, octave, decay_power, opus_dir=None, mp3_dir=None):
    if note not in NOTES.keys():
        raise ValueError(f'Bad note: {note}')
    freq = 440 * 2**(((octave - 4)*12 + NOTES[note]) / 12)

    if not (opus_dir or mp3_dir):
        raise ValueError('Must give either opus_dir or mp3_dir')

    # set duration to an integer number of periods, for clean looping
    period = 1 / freq
    duration = math.floor(DURATION / period) * period

    t = np.linspace(0, duration, int(SR * duration), False)
    signal = np.zeros_like(t)

    for n in range(1, HARMONICS + 1):
        if freq * n > FREQ_CUTOFF:
            print(f'Frequency {freq * n} skipped')
            break
        amplitude = 1 / n**decay_power
        signal += amplitude * np.sin(2 * np.pi * freq * n * t)

    signal /= np.max(np.abs(signal))
    filename = f"{note}{octave}"
    with tempfile.TemporaryDirectory() as tempdir:
        tempwav = pathlib.Path(tempdir) / 'temp.wav'
        sf.write(tempwav, signal, SR)
        if opus_dir:
            subprocess.run([
                "ffmpeg", "-y",
                "-i", tempwav,
                "-c:a", "libopus",
                "-b:a", "256k",
                f"{opus_dir}/{filename}.opus"
            ], check=True)
        if mp3_dir:
            subprocess.run([
                "ffmpeg",
                "-y",
                "-i", tempwav,
                "-codec:a", "libmp3lame",
                "-b:a", "320k",
                f"{mp3_dir}/{filename}.mp3"
            ], check=True)


def make_synth_tones(output_dir):
    decay_power = 1.25

    START_NOTE = 'C'
    START_OCTAVE = 2

    END_NOTE = 'D'
    END_OCTAVE = 4

    note_letters = list(NOTES)
    note_i = note_letters.index(START_NOTE)
    octave = START_OCTAVE

    opus_dir = pathlib.Path(output_dir) / './opus' / f'{decay_power:.2f}'
    mp3_dir = pathlib.Path(output_dir) / './mp3' / f'{decay_power:.2f}'

    pathlib.Path.mkdir(opus_dir, parents=True, exist_ok=True)
    pathlib.Path.mkdir(mp3_dir, parents=True, exist_ok=True)

    print(f'Saving to {opus_dir} and {mp3_dir}')

    while True:
        note = note_letters[note_i]
        print(f'{note}{octave}')
        make_tone(note, octave, decay_power, opus_dir=opus_dir, mp3_dir=mp3_dir)
        if note == END_NOTE and octave == END_OCTAVE:
            break
        note_i = (note_i + 1) % len(note_letters)
        if note_i == 0:
            octave += 1



if __name__ == '__main__':
    print('Running main')
    make_synth_tones('./')
