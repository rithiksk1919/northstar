"""Build Northstar's master list of places from the Seattle resources CSV.

    python scripts/build-resources.py

Reads  src/data/northstar_seattle_resources.csv  (the verified Seattle list, with sources)
plus a few places kept from before (Eastside, DESC's intake office) defined below, and writes:

    src/data/resources.json   used by the server (Companion, /api/resources)
    js/resources-data.js      used by the map and Home (works offline, no fetch)

To update the places: edit the CSV (or replace it with a newer export) and run this again.

What it does to each row:
  - maps the CSV categories to the app's filters (Beds, Meals, Showers, Wi-Fi, Charging,
    Day centers) and keeps the detail tags (food bank, library, mail...)
  - turns hours like "M-F 9am-4pm; Sa 8am-noon" into opening times, so "Open now" works.
    Hours it can't read ("Building hours", "Call hotline") are kept as text and marked
    unknown; the app then says "Hours not listed. Call first."
  - flags referral-only places, ID required, private addresses (no map pin), and the
    source notes that say to confirm something
  - applies the coordinate fixes listed in FIXES (checked against OpenStreetMap)
"""
import csv
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(ROOT, 'src', 'data', 'northstar_seattle_resources.csv')
JSON_OUT = os.path.join(ROOT, 'src', 'data', 'resources.json')
JS_OUT = os.path.join(ROOT, 'js', 'resources-data.js')

# Coordinates corrected after checking each address against OpenStreetMap (Oct 2026)
FIXES = {
    'sh04': {'lat': 47.599863, 'lng': -122.313914},   # Operation Nightwatch, 302 14th Ave S (CSV pin was 4.4 mi south)
    'fb15': {'lat': 47.620560, 'lng': -122.354517},   # Queen Anne Food Bank, 232 Warren Ave N (CSV pin was 0.7 mi north)
    'fd23': {'lat': 47.600477, 'lng': -122.333147},   # Food Not Bombs meets at Occidental Square
}

# Places in the old list that this CSV replaces: old id -> new id (saved places and links keep working)
ALIASES = {
    'res-real-5': 'dc02',   # Urban Rest Stop Downtown
    'res-real-7': 'sh18',   # Mary's Place family intake (phone only)
    'res-real-8': 'fb01',   # Ballard Food Bank
    'res-real-9': 'fd13',   # YouthCare Orion Center
    'res-real-10': 'sh21',  # Compass Center at 210 Alaskan Way S (shelter + meals)
}

# Kept from before: not in the Seattle CSV
EXTRA = [
    {
        'id': 'res-real-1', 'name': 'Together Center (Human Services Campus)', 'tags': ['day_center'],
        'address': '16305 NE 87th St', 'city': 'Redmond', 'lat': 47.6805, 'lng': -122.1225,
        'phone': '425-869-6699', 'hours': 'Office M-F 8:30am-5pm; drop-in Tu 1-3pm',
        'population': 'Anyone', 'notes': 'Housing navigation and help from 20+ agencies in one place.',
        'source': ('Together Center', 'https://togethercenter.org/', '2025'),
    },
    {
        'id': 'res-real-2', 'name': 'Hopelink Redmond Food Bank', 'tags': ['food_bank'],
        'address': '8990 154th Ave NE', 'city': 'Redmond', 'lat': 47.6822, 'lng': -122.1345,
        'phone': '425-869-6000', 'hours': 'M 1-4pm; Tu 10am-3pm; W 1-4pm and 5-7pm; Th 10am-3pm',
        'population': 'Anyone', 'notes': 'Groceries, fresh produce and emergency food packs.',
        'source': ('Hopelink', 'https://www.hopelink.org/', '2025'),
    },
    {
        'id': 'res-real-3', 'name': "Helen's Place (The Sophia Way)", 'tags': ['shelter', 'hygiene'],
        'address': '8045 120th Ave NE, Suite 200', 'city': 'Kirkland', 'lat': 47.6755, 'lng': -122.1795,
        'phone': '425-572-2178', 'hours': '24 hours daily',
        'population': 'Women 18+', 'notes': 'Low-barrier shelter with beds, showers, laundry and meals.',
        'source': ('The Sophia Way', 'https://sophiaway.org/', '2025'),
    },
    {
        'id': 'res-real-4', 'name': 'Redmond Library (KCLS)', 'tags': ['library', 'wifi', 'charging'],
        'address': '15990 NE 85th St', 'city': 'Redmond', 'lat': 47.6765, 'lng': -122.124,
        'phone': '425-885-1861', 'hours': 'M-Th 10am-8pm; F-Sa 10am-5pm; Su 1-5pm',
        'population': 'Public', 'charging': 'outlets', 'notes': 'Free guest Wi-Fi and computers.',
        'source': ('King County Library System', 'https://kcls.org/', '2025'),
    },
    {
        'id': 'res-real-6', 'name': 'DESC main office (apply for shelter)', 'tags': ['shelter'],
        'address': '515 3rd Ave', 'city': 'Seattle', 'lat': 47.6025, 'lng': -122.3308,
        'phone': '206-464-1570', 'hours': 'Intake daily from 9:30am',
        'population': 'Adults 18+', 'notes': 'Apply in person for DESC shelters from 9:30am. Not a shelter itself.',
        'source': ('WA211 – DESC', 'https://search.wa211.org/search/8232e629-7932-5c88-97f9-40fe81b27ca7', '2025-2026'),
    },
]

APP_CATEGORY_LABELS = {'shelter', 'food', 'restroom', 'wifi', 'charging', 'daycenter'}

# ---------------------------------------------------------------------------------------
# Hours
DAY_WORDS = {
    'su': 0, 'sun': 0, 'sunday': 0, 'sundays': 0,
    'm': 1, 'mo': 1, 'mon': 1, 'monday': 1, 'mondays': 1,
    'tu': 2, 'tue': 2, 'tues': 2, 'tuesday': 2, 'tuesdays': 2,
    'w': 3, 'we': 3, 'wed': 3, 'wednesday': 3, 'wednesdays': 3,
    'th': 4, 'thu': 4, 'thur': 4, 'thurs': 4, 'thursday': 4, 'thursdays': 4,
    'f': 5, 'fr': 5, 'fri': 5, 'friday': 5, 'fridays': 5,
    'sa': 6, 'sat': 6, 'saturday': 6, 'saturdays': 6,
}
DAY_TOKEN = r'(?:Sundays?|Sun|Su|Mondays?|Mon|Mo|M|Tuesdays?|Tues|Tue|Tu|Wednesdays?|Wed|We|W|Thursdays?|Thurs|Thur|Thu|Th|Fridays?|Fri|Fr|F|Saturdays?|Sat|Sa)'
DAY_RUN = re.compile(r'(?<![A-Za-z])' + DAY_TOKEN + r'(?:\s*(?:-|–|/|,|&|and)\s*' + DAY_TOKEN + r')*(?![A-Za-z])')
TIME = r'(?:(\d{1,2})(?::(\d{2}))?\s*(am|pm)?|(noon|midnight))'
RANGE = re.compile(TIME + r'\s*(?:-|–|to)\s*' + TIME, re.I)
SINGLE = re.compile(r'(?<![\d:])(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?![a-z])|(?<![a-z])(noon)(?![a-z])', re.I)
EVERY_DAY = re.compile(r'\b(daily|nightly|every day|7 days)\b', re.I)
IRREGULAR = re.compile(r'\b(1st|2nd|3rd|4th|first|second|third|last)\b', re.I)


def parse_day_run(text):
    tokens = re.split(r'\s*(-|–|/|,|&|\band\b)\s*', text.strip())
    days, prev, pending_range = [], None, False
    for t in tokens:
        if not t:
            continue
        low = t.lower()
        if low in ('-', '–'):
            pending_range = True
            continue
        if low in ('/', ',', '&', 'and'):
            continue
        d = DAY_WORDS.get(low)
        if d is None:
            continue
        if pending_range and prev is not None:
            cur = prev
            while cur != d:
                cur = (cur + 1) % 7
                if cur not in days:
                    days.append(cur)
        elif d not in days:
            days.append(d)
        prev, pending_range = d, False
    return days


def to_minutes(h, m, ap, word):
    if word:
        return 12 * 60 if word.lower() == 'noon' else 24 * 60
    h = int(h)
    m = int(m or 0)
    if ap:
        ap = ap.lower()
        if ap == 'pm' and h != 12:
            h += 12
        if ap == 'am' and h == 12:
            h = 0
    return h * 60 + m


def range_minutes(match):
    h1, m1, ap1, w1, h2, m2, ap2, w2 = match.groups()
    if not w1 and not w2 and not ap1 and not ap2:
        # "10-6" style (library hours): opening in the morning, closing in the afternoon/evening
        s, e = int(h1), int(h2)
        ap1 = 'am' if 6 <= s <= 11 else 'pm'
        ap2 = 'pm' if (e <= 11 or e == 12) else None
    elif not w1 and not ap1:
        # "5-6:30pm": the start shares the end's am/pm unless that would put it after the end
        ap1 = (ap2 or 'pm').lower() if ap2 else None
        if w2 and w2.lower() == 'noon':
            ap1 = 'am'
        elif ap2 and ap2.lower() == 'pm' and int(h1) != 12 and int(h1) > int(h2 or 0) and int(h2 or 0) != 12:
            ap1 = 'am'
    elif not w2 and not ap2:
        ap2 = ap1
    start = to_minutes(h1, m1, ap1, w1)
    end = to_minutes(h2, m2, ap2, w2)
    return start, end


def parse_hours(text):
    """Returns (periods, is24, known). periods: [{day, start, end}] in minutes."""
    raw = (text or '').strip()
    if not raw:
        return [], False, False
    if re.search(r'\bclosed\b', raw, re.I) and re.search(r'\b(through|until|thru)\b', raw, re.I):
        return [], False, True  # temporarily closed; handled by closedNote
    if re.search(r'24\s*(hours|hrs|h\b|/7)', raw, re.I):
        return [], True, True
    if IRREGULAR.search(raw):
        return [], False, False  # e.g. "2nd and last Monday": can't be shown as weekly hours
    periods = []
    current_days = None
    for segment in re.split(r';|\|', raw):
        seg = re.sub(r'\(.*?\)', '', segment)
        if re.search(r'\b(from)\s+\d', seg, re.I) and not RANGE.search(seg):
            continue  # "grab-and-go from 9am": no end time
        # walk the segment left to right: day runs set the days for the times that follow
        pos = 0
        events = []
        for m in DAY_RUN.finditer(seg):
            events.append((m.start(), 'days', parse_day_run(m.group(0))))
        for m in EVERY_DAY.finditer(seg):
            events.append((m.start(), 'days', list(range(7))))
        for m in RANGE.finditer(seg):
            events.append((m.start(), 'range', range_minutes(m)))
        taken = [(m.start(), m.end()) for m in RANGE.finditer(seg)]
        for m in SINGLE.finditer(seg):
            if any(a <= m.start() < b for a, b in taken):
                continue
            h, mm, ap, word = m.groups()
            start = to_minutes(h, mm, ap, word)
            events.append((m.start(), 'single', (start, start + 60)))  # a meal time: about an hour
        events.sort(key=lambda e: e[0])
        last_was_days = False
        for _, kind, val in events:
            if kind == 'days':
                if last_was_days and current_days is not None:
                    current_days = sorted(set(current_days) | set(val))
                else:
                    current_days = val
                last_was_days = True
                continue
            last_was_days = False
            if current_days is None:
                continue
            start, end = val
            for d in current_days:
                periods.append({'day': d, 'start': start, 'end': end})
    return periods, False, bool(periods)


def to_google_periods(periods):
    out = []
    for p in periods:
        s, e = p['start'], p['end'] % (24 * 60)
        out.append({
            'open': {'day': p['day'], 'time': f"{s // 60:02d}{s % 60:02d}"},
            'close': {'day': p['day'], 'time': f"{e // 60:02d}{e % 60:02d}"},
        })
    return out


# ---------------------------------------------------------------------------------------
def app_categories(tags, has_charging):
    cats = []
    if 'shelter' in tags:
        cats.append('shelter')
    if 'meal' in tags or 'food_bank' in tags:
        cats.append('food')
    if 'hygiene' in tags:
        cats.append('restroom')
    if 'wifi' in tags or 'library' in tags:
        cats.append('wifi')
    if has_charging or 'charging' in tags:
        cats.append('charging')
    if 'day_center' in tags:
        cats.append('daycenter')
    return cats


def primary_category(primary, tags):
    return {
        'shelter': 'shelter', 'meal': 'food', 'food_bank': 'food',
        'hygiene': 'restroom', 'library': 'wifi', 'wifi': 'wifi',
    }.get(primary) or ('restroom' if 'hygiene' in tags else 'daycenter')


def first_phone(text):
    m = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text or '')
    return m.group(0) if m else ''


def short_description(notes, tags):
    text = re.split(r'\s\|\s', notes or '')[-1].strip(' |')
    text = re.sub(r'\s+', ' ', text)
    if len(text) > 180:
        text = text[:177].rsplit(' ', 1)[0] + '…'
    return text


def build_place(r):
    tags = [t for t in (r.get('categories') or '').split(';') if t]
    has_charging = str(r.get('has_charging', '')).lower() == 'true'
    lat = float(r['lat']) if r.get('lat') else None
    lng = float(r['lng']) if r.get('lng') else None
    if r['id'] in FIXES:
        lat, lng = FIXES[r['id']]['lat'], FIXES[r['id']]['lng']
    hours = (r.get('hours') or '').strip()
    periods, is24, known = parse_hours(hours)
    notes = (r.get('notes') or '').strip(' |')
    walk_in = (r.get('walk_in') or '').strip().lower()
    note_l = notes.lower()
    referral = walk_in.startswith('no') or any(k in note_l for k in (
        'referral only', 'entry by referral', 'walk-ins not accepted', 'enrollment-based', 'by referral'))
    closed_note = ''
    if re.search(r'\bclosed\b', hours, re.I):
        closed_note = (r.get('verify') or hours).replace('Temporarily closed', 'Closed').strip()
    titles = [t.strip() for t in (r.get('source_titles') or '').split('|')]
    urls = [u.strip() for u in (r.get('source_urls') or '').split('|')]
    dates = [d.strip() for d in (r.get('source_as_of') or '').split('|')]
    sources = [{'title': t, 'url': urls[i] if i < len(urls) else '', 'asOf': dates[i] if i < len(dates) else ''}
               for i, t in enumerate(titles) if t]
    city = r.get('city') or 'Seattle'
    address = (r.get('address') or '').strip()
    confidential = lat is None or lng is None
    place = {
        'id': r['id'],
        'name': r['name'].strip(),
        'category': primary_category(r.get('primary_category'), tags),
        'categories': app_categories(tags, has_charging),
        'tags': tags,
        'lat': lat,
        'lng': lng,
        'address': address if confidential and not re.search(r'\d', address) else f"{address}, {city}",
        'phone': (r.get('phone') or '').strip(),
        'tel': re.sub(r'[^0-9]', '', first_phone(r.get('phone') or '')),
        'hours': hours,
        'hoursKnown': known,
        'is24Seven': is24,
        'opening_hours': {'periods': to_google_periods(periods)} if periods else None,
        'closedNote': closed_note,
        'population': (r.get('population') or '').strip(),
        'idRequired': (r.get('id_required') or '').strip().lower().startswith('yes'),
        'referralOnly': referral,
        'confidential': confidential,
        'freeFood': str(r.get('free_food', '')).lower() == 'true',
        'freeWifi': str(r.get('free_wifi', '')).lower() == 'true',
        'charging': (r.get('charging') or '').strip(),
        'notes': notes,
        'checkNote': (r.get('verify') or '').strip(),
        'description': short_description(notes, tags),
        'sources': sources,
        'verifiedOnly': True,
        'aliases': [old for old, new in ALIASES.items() if new == r['id']],
    }
    return place


def extra_place(e):
    row = {
        'id': e['id'], 'name': e['name'], 'primary_category': e['tags'][0], 'categories': ';'.join(e['tags']),
        'has_charging': 'True' if 'charging' in e['tags'] else 'False', 'lat': str(e['lat']), 'lng': str(e['lng']),
        'address': e['address'], 'city': e['city'], 'phone': e['phone'], 'hours': e['hours'],
        'population': e['population'], 'notes': e['notes'], 'charging': e.get('charging', ''),
        'free_food': 'True' if ('food_bank' in e['tags'] or 'meal' in e['tags']) else 'False',
        'free_wifi': 'True' if 'wifi' in e['tags'] else 'False',
        'source_titles': e['source'][0], 'source_urls': e['source'][1], 'source_as_of': e['source'][2],
    }
    return build_place(row)


def main():
    with open(CSV_PATH, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    places = [build_place(r) for r in rows] + [extra_place(e) for e in EXTRA]

    # Several services in one building: give each pin a small offset slot so none hides another
    by_spot = {}
    for p in places:
        if p['lat'] is None:
            continue
        key = (round(p['lat'], 4), round(p['lng'], 4))
        by_spot.setdefault(key, []).append(p)
    for group in by_spot.values():
        if len(group) > 1:
            for i, p in enumerate(group):
                p['pinSlot'] = i
                p['pinSlots'] = len(group)

    with open(JSON_OUT, 'w', encoding='utf-8') as f:
        json.dump(places, f, ensure_ascii=False, indent=1)
    with open(JS_OUT, 'w', encoding='utf-8') as f:
        f.write('// Generated by scripts/build-resources.py from src/data/northstar_seattle_resources.csv.\n')
        f.write('// Do not edit by hand: change the CSV and run the script again.\n')
        f.write('window.NS_RESOURCES = ')
        json.dump(places, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    known = sum(1 for p in places if p['hoursKnown'])
    print(f"{len(places)} places ({len(rows)} from the CSV + {len(EXTRA)} kept). Hours read: {known}; "
          f"no map pin: {sum(1 for p in places if p['confidential'])}; referral only: {sum(1 for p in places if p['referralOnly'])}")


if __name__ == '__main__':
    main()
