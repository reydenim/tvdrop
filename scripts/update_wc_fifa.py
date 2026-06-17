#!/usr/bin/env python3
"""Update worldcup_schedule.json from FIFA Standing API.
Uses Result codes for status, adds scores + proper display fields.
"""
import json, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
import requests

WIB = timezone(timedelta(hours=7))
FIFA_URL = "https://api.fifa.com/api/v3/calendar/17/285023/289273/standing"
TV_DATA = Path("/home/ubuntu/tv-web/src/data")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "https://www.fifa.com/",
}

# FIFA Result codes from standing API
# 3 = scheduled/upcoming, 4 = finished, 1-2 = live variants
RESULT_MAP = {
    0: "upcoming",
    1: "live",
    2: "live",
    3: "upcoming",
    4: "finished",
    5: "finished",
}

def fetch():
    resp = requests.get(FIFA_URL, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return resp.json()

def extract(standings):
    results = standings.get("Results", [])
    
    # Team lookup
    teams = {}
    for r in results:
        tid = r["Team"]["IdTeam"]
        teams[tid] = {
            "name": r["Team"]["Name"][0]["Description"],
            "abbr": r["Team"]["Abbreviation"],
            "group": r["Group"][0]["Description"],
        }
    
    # Extract unique matches
    matches = {}
    now = datetime.now(WIB)
    
    for r in results:
        for m in r.get("MatchResults", []):
            mid = m["IdMatch"]
            if mid in matches:
                continue
            
            home_id = m["HomeTeamId"]
            away_id = m["AwayTeamId"]
            home_t = teams.get(home_id, {"name": f"Team_{home_id}", "abbr": str(home_id), "group": "Unknown"})
            away_t = teams.get(away_id, {"name": f"Team_{away_id}", "abbr": str(away_id), "group": "Unknown"})
            
            utc_time = datetime.fromisoformat(m["StartTime"].replace("Z", "+00:00"))
            wib_time = utc_time.astimezone(WIB)
            
            home_score = m.get("HomeTeamScore")
            away_score = m.get("AwayTeamScore")
            result_code = m.get("Result", 0)
            
            # Status: use Result code, fallback to time-based
            status = RESULT_MAP.get(result_code)
            if status is None:
                if home_score is not None:
                    status = "finished"
                elif now >= wib_time:
                    status = "live"
                elif (wib_time - now).total_seconds() < 3600:
                    status = "starting_soon"
                else:
                    status = "upcoming"
            
            # Score string
            if home_score is not None:
                score = f"{home_score}-{away_score}"
            else:
                score = ""
            
            # Stage name
            stage = f"Group {home_t['group'].replace('Group ', '')}"
            
            # Slug
            slug = f"{home_t['name'].lower().replace(' ','-')}-vs-{away_t['name'].lower().replace(' ','-')}"
            
            matches[mid] = {
                "id": mid,
                "slug": slug,
                "date": wib_time.strftime("%Y-%m-%d"),
                "time_utc": utc_time.strftime("%H:%M"),
                "time_wib": wib_time.strftime("%H:%M"),
                "home": home_t["name"],
                "away": away_t["name"],
                "home_abbr": home_t["abbr"],
                "away_abbr": away_t["abbr"],
                "home_score": home_score,
                "away_score": away_score,
                "score": score,
                "group": home_t["group"],
                "stage": stage,
                "status": status,
                "result_code": result_code,
                "channels": {},
            }
    
    return sorted(matches.values(), key=lambda x: (x["date"], x["time_wib"]))

def main():
    print("[FIFA WC v3] Fetching standings...")
    try:
        raw = fetch()
        matches = extract(raw)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        import traceback; traceback.print_exc()
        sys.exit(1)
    
    if not matches:
        print("ERROR: no matches", file=sys.stderr)
        sys.exit(1)
    
    out = TV_DATA / "worldcup_schedule.json"
    with open(out, "w") as f:
        json.dump(matches, f, indent=2, ensure_ascii=False)
    
    finished = sum(1 for m in matches if m["status"] == "finished")
    live = sum(1 for m in matches if m["status"] == "live")
    upcoming = sum(1 for m in matches if m["status"] == "upcoming")
    soon = sum(1 for m in matches if m["status"] == "starting_soon")
    
    print(f"Done: {len(matches)} matches | {finished} finished, {live} live, {soon} soon, {upcoming} upcoming")
    
    now = datetime.now(WIB)
    for m in matches:
        mt = datetime.fromisoformat(f"{m['date']}T{m['time_wib']}:00+07:00")
        if now <= mt <= now + timedelta(hours=48):
            s = f" {m['score']}" if m['score'] else ""
            icon = "🔴" if m['status'] == 'live' else "🟢" if m['status'] == 'starting_soon' else "📅"
            print(f"  {icon} {m['date']} {m['time_wib']} WIB | {m['home']} vs {m['away']}{s} | {m['status']} | {m['stage']}")

if __name__ == "__main__":
    main()
