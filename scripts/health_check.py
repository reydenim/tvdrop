#!/usr/bin/env python3
"""TV Health Checker — scan channel streams."""
import json, subprocess, sys, concurrent.futures, os, time

TV_WEB = '/home/ubuntu/tv-web/src/data/channels.json'
STATUS_FILE = '/home/ubuntu/tv-web/src/data/health_status.json'
LOG_FILE = '/home/ubuntu/tv-web/logs/health.log'
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

def log(msg):
    t = time.strftime('%Y-%m-%d %H:%M:%S')
    with open(LOG_FILE, 'a') as f: f.write(f'[{t}] {msg}\n')
    print(f'[{t}] {msg}')

def check_stream(url):
    try:
        r = subprocess.run(['curl', '-sI', '--max-time', '8', url], capture_output=True, text=True, timeout=10)
        status = r.stdout.split('\n')[0] if r.stdout else ''
        if '200' in status or '206' in status: return 'live'
        if '302' in status: return 'redirect'
        if '403' in status: return 'geo-blocked'
        if '404' in status: return 'dead'
        return 'unknown'
    except: return 'timeout'

log('Starting health check...')
with open(TV_WEB) as f: data = json.load(f)
channels = data['channels']
log(f'Total: {len(channels)}')

# Scan first 300
batch = channels[:300]
results = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    futures = {ex.submit(check_stream, ch['url']): ch for ch in batch}
    for i, future in enumerate(concurrent.futures.as_completed(futures)):
        ch = futures[future]
        try: results[ch['id']] = future.result()
        except: results[ch['id']] = 'error'

counts = {}
for st in results.values(): counts[st] = counts.get(st, 0) + 1
log('Results: ' + str(counts))

with open(STATUS_FILE, 'w') as f:
    json.dump({'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S+07:00'), 'total': len(results), 'counts': counts, 'results': results}, f, indent=2)
log('Done.')
