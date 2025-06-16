#! /bin/env python3

'''
Simple build script to run before deployment
'''

from pathlib import Path
import json

# Generate audio file manifest
FILETYPES = ['mp3', 'ogg']
audio_dir = Path(__file__).resolve().parent.parent / 'assets' / 'audio'
save_file = audio_dir / 'audio-files.json'

data = {}
for ft in FILETYPES:
    dir = audio_dir / ft
    files = [
        f.name
        for f in sorted(dir.iterdir())
        if f.is_file() and f.suffix.lower() == f'.{ft}'
    ]

    this_ft = {}
    for file in files:
        note, _ = file.split('-') if '-' in file else file.split('.')
        if note not in this_ft.keys():
            this_ft[note] = []
        this_ft[note].append(file)
    data[ft] = this_ft

with save_file.open('w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print(f'Saved {len(data)} filetypes to {save_file}:')
for ft, notes in data.items():
    n_files = sum(len(files) for note, files in notes.items())
    print(f'  - {ft}: {len(notes)} notes, {n_files} files')
