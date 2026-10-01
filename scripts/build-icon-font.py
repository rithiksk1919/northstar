"""Build the small self-hosted Material Symbols Outlined font with only the icons Northstar uses.

Why: the app used to load the full icon font from Google Fonts (about 4 MB). On a slow or
blocked connection icon-only buttons (back, send, settings) disappeared. This keeps a ~30 KB
subset in assets/fonts/ that loads from our own server.

Run it again after adding a new icon name anywhere in the app:

    pip install fonttools brotli
    npm pack material-symbols && tar xzf material-symbols-*.tgz
    python scripts/build-icon-font.py package/material-symbols-outlined.woff2

What it does:
  1. Collects icon names from the live pages and scripts (icon <span>s and quoted names).
  2. Removes every icon rule that isn't used, then subsets the font to those icons.
  3. Pins the variable axes to what the app uses (opsz 24, GRAD 0, wght 300-500, FILL 0-1).
"""
import glob
import io
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'package', 'material-symbols-outlined.woff2')
OUT_DIR = os.path.join(ROOT, 'assets', 'fonts')
os.makedirs(OUT_DIR, exist_ok=True)

# A few spare icons so small future edits don't need a rebuild
EXTRA = {'star', 'trending_up', 'arrow_forward', 'arrow_back', 'warning', 'help', 'info', 'error', 'wifi_off',
         'refresh', 'share', 'ios_share', 'more_horiz', 'more_vert', 'favorite', 'notifications', 'photo_camera',
         'check_circle', 'radio_button_unchecked', 'military_tech', 'expand_more', 'sync', 'history',
         'account_circle', 'directions', 'phone'}

live = [p for p in glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'js', '*.js'))
        if not re.search(r'before-|backup|pre-settings|nate-welcome', p)]
words = set(EXTRA)
for p in live:
    text = io.open(p, encoding='utf-8', errors='ignore').read()
    words.update(re.findall(r'material-symbols-outlined[^>]*>\s*([a-z][a-z0-9_]{1,40})\s*<', text))
    words.update(re.findall(r"""['"`]([a-z][a-z0-9_]{1,40})['"`]""", text))

font = TTFont(SRC)
glyph_char = {g: chr(c) for c, g in font.getBestCmap().items()}


def ligature_tables():
    for lookup in font['GSUB'].table.LookupList.Lookup:
        for st in lookup.SubTable:
            if st.LookupType == 7:
                st = st.ExtSubTable
            if hasattr(st, 'ligatures'):
                yield st


def lig_name(first, lig):
    try:
        return ''.join(glyph_char[g] for g in [first] + list(lig.Component))
    except KeyError:
        return None


lig_glyph = {}
for st in ligature_tables():
    for first, ligs in st.ligatures.items():
        for lig in ligs:
            name = lig_name(first, lig)
            if name:
                lig_glyph[name] = lig.LigGlyph

used = sorted(w for w in words if w in lig_glyph)
keep = set(used)
print('icons used:', len(used))

# Drop unused ligature rules, otherwise the subsetter keeps every icon
for st in ligature_tables():
    for first in list(st.ligatures.keys()):
        kept = [lig for lig in st.ligatures[first] if lig_name(first, lig) in keep]
        if kept:
            st.ligatures[first] = kept
        else:
            del st.ligatures[first]

opts = subset.Options()
opts.layout_features = ['liga', 'rlig', 'calt', 'ccmp']
opts.notdef_outline = True
opts.name_IDs = ['*']
sub = subset.Subsetter(options=opts)
sub.populate(text=''.join(sorted(set(''.join(used)))) + ' ', glyphs=[lig_glyph[n] for n in used])
sub.subset(font)

tmp = os.path.join(OUT_DIR, '_subset_tmp.ttf')
font.flavor = None
font.save(tmp)
font = TTFont(tmp, lazy=False)
font = instancer.instantiateVariableFont(font, {'opsz': 24, 'GRAD': 0, 'wght': (300, 500), 'FILL': (0, 1)})
out = os.path.join(OUT_DIR, 'material-symbols-outlined-subset.woff2')
font.flavor = 'woff2'
font.save(out)
os.remove(tmp)
io.open(os.path.join(OUT_DIR, 'material-symbols-icons.txt'), 'w').write('\n'.join(used) + '\n')
print('wrote', out, os.path.getsize(out), 'bytes')
