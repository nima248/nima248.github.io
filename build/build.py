#! /bin/env python3

'''
Simple build script to run before deployment
'''

from pathlib import Path
import json

# Generate audio file manifest
EXTENSIONS = ['.mp3']
audio_dir = Path(__file__).resolve().parent.parent / 'assets' / 'audio'
save_file = audio_dir / 'audio-files.json'

files = [
    f.name
    for f in sorted(audio_dir.iterdir())
    if f.is_file() and f.suffix.lower() in EXTENSIONS
]

data = {}
for file in files:
    note, _ = file.split('-') if '-' in file else file.split('.')
    if note not in data.keys():
        data[note] = []
    data[note].append(file)

with save_file.open('w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print(f'Saved {len(data)} notes ({len(files)} files) to {save_file}')
