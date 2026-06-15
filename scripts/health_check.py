#!/usr/bin/env python3
"""TV Channel Health Checker — scan all streams, save results incrementally."""
import json, subprocess, sys, concurrent.futures, os, time

TV_WEB = '/home/ubuntu/tv-web/src/data/channels.json'
STATUS_FILE = '/home/ubuntu/tv-web/src/data/health_status.json'
PROGRESS_FILE = '/home/ubuntu/tv-web/src/data/health_progress.json'
BATCH_SIZE = 200
MAX_WORKERS = 20

def check_stream(url):
    try:
        r = subprocess.run(['curl', '-sI', '--max-time', '8', url],
            capture_output=True, text=True, timeout=10)
        status = r.stdout.split('\n')[0] if r.stdout else ''
        if '200' not in status and '206' not in status:
            if '302' in status: return 'redirect'
            if '403' in status: return 'geo-blocked'
            if '404' in status: return 'dead'
            if '50' in status[:7]: return 'dead'
            return 'unknown'

        # Playlist is live — verify actual TS segment for HLS
        if '.m3u8' in url:
            try:
                # Fetch playlist to get segment URL
                pl = subprocess.run(['curl', '-sL', '--max-time', '6', url],
                    capture_output=True, text=True, timeout=8)
                lines = pl.stdout.strip().split('\n')
                # Find last non-comment line (a .ts or .m3u8 segment)
                seg = None
                for line in reversed(lines):
                    line = line.strip()
                    if line and not line.startswith('#'):
                        seg = line
                        break
                if seg:
                    # Resolve relative URL
                    if seg.startswith('http'):
                        seg_url = seg
                    else:
                        base = url.rsplit('/', 1)[0]
                        seg_url = base + '/' + seg
                    # HEAD-check the segment
                    sr = subprocess.run(['curl', '-sI', '--max-time', '6', seg_url],
                        capture_output=True, text=True, timeout=8)
                    s_status = sr.stdout.split('\n')[0] if sr.stdout else ''
                    if '200' not in s_status and '206' not in s_status:
                        return 'dead'  # playlist OK but segments dead
            except:
                pass  # segment check failed, trust playlist status
        return 'live'
    except:
        return 'timeout'

# Load channels
with open(TV_WEB) as f:
    channels = json.load(f)['channels']

# Load progress
if os.path.exists(PROGRESS_FILE):
    with open(PROGRESS_FILE) as f:
        progress = json.load(f)
else:
    progress = {'checked': 0, 'results': {}}

# Load existing full results
if os.path.exists(STATUS_FILE):
    with open(STATUS_FILE) as f:
        status_data = json.load(f)
    all_results = status_data.get('results', {})
else:
    all_results = {}

start_idx = progress['checked']
end_idx = min(start_idx + BATCH_SIZE, len(channels))
batch = channels[start_idx:end_idx]

print(f"Scanning {start_idx}-{end_idx} of {len(channels)}...")

results = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
    futures = {ex.submit(check_stream, ch['url']): ch for ch in batch}
    for i, future in enumerate(concurrent.futures.as_completed(futures)):
        ch = futures[future]
        try:
            results[ch['id']] = future.result()
        except:
            results[ch['id']] = 'error'
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{len(batch)} done...")

# Merge results
all_results.update(results)
progress['checked'] = end_idx
progress['results'] = all_results

# Counts
counts = {}
for st in all_results.values():
    counts[st] = counts.get(st, 0) + 1

# Save
with open(STATUS_FILE, 'w') as f:
    json.dump({
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S+07:00'),
        'total_channels': len(channels),
        'checked': len(all_results),
        'counts': counts,
        'results': all_results
    }, f)

with open(PROGRESS_FILE, 'w') as f:
    json.dump(progress, f)

# Summary
done = end_idx >= len(channels)
print(f"\n✅ Batch done: {start_idx}-{end_idx}")
print(f"   Results: {counts}")
print(f"   Total checked: {len(all_results)}/{len(channels)}")
if done:
    print("   🎉 ALL CHANNELS SCANNED!")
else:
    print(f"   ⏳ Next batch starts at {end_idx}")
