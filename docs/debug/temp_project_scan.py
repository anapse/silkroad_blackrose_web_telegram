import os
root = os.getcwd()
ext = ['.js','.jsx','.json','.md','.bat']
files = []
for dirpath, dirnames, filenames in os.walk(root):
    if 'node_modules' in dirpath.split(os.sep):
        continue
    for f in filenames:
        if os.path.splitext(f)[1].lower() in ext:
            files.append(os.path.join(dirpath, f))
files = sorted(files)
refs = {}
for f in files:
    if os.path.splitext(f)[1].lower() not in ['.js','.jsx']:
        continue
    refs[f] = set()
    try:
        with open(f, 'r', encoding='utf-8', errors='ignore') as fh:
            for line in fh:
                s = line.strip()
                if s.startswith('import '):
                    if ' from ' in s and ('"' in s or "'" in s):
                        quote = '"' if '"' in s else "'"
                        part = s.split(' from ')[-1].strip()
                        if part.startswith(quote) and part.endswith(quote):
                            refs[f].add(part[1:-1])
                    elif s.startswith('import') and ('"' in s or "'" in s):
                        quote = '"' if '"' in s else "'"
                        start = s.find(quote)
                        end = s.rfind(quote)
                        if start != -1 and end != -1 and end > start:
                            refs[f].add(s[start+1:end])
                if 'require(' in s:
                    for quote in ['"', "'"]:
                        token = 'require(' + quote
                        if token in s:
                            start = s.find(token) + len(token)
                            end = s.find(quote, start)
                            if end != -1:
                                refs[f].add(s[start:end])
    except Exception:
        continue
resolved = {f: set() for f in files}
for f, mods in refs.items():
    base = os.path.dirname(f)
    for mod in mods:
        if mod.startswith('.'):
            cand = os.path.normpath(os.path.join(base, mod))
            found = False
            for e in ['.js', '.jsx', '.json']:
                p = cand + e
                if p in resolved:
                    resolved[f].add(p)
                    found = True
                    break
            if not found:
                p = os.path.join(cand, 'index.js')
                if p in resolved:
                    resolved[f].add(p)
imported_by = {f: set() for f in files}
for f, out in resolved.items():
    for t in out:
        imported_by[t].add(f)
entrypoints = []
for f in files:
    if f.endswith(('src/index.js', 'src/app.js', 'src/gamegateway/index.js', 'src/gamegateway/websocket/WebSocketServer.js', 'blackroseweb/src/main.jsx', 'blackroseweb/src/App.jsx')):
        entrypoints.append(f)
entrypoints = list(set(entrypoints))
reachable = set(entrypoints)
queue = list(entrypoints)
while queue:
    curr = queue.pop()
    for child in resolved.get(curr, []):
        if child not in reachable:
            reachable.add(child)
            queue.append(child)
output = {
    'root': root,
    'total_files': len(files),
    'entrypoints': entrypoints,
    'reachable_count': len(reachable),
    'orphan_files': [f for f in files if os.path.splitext(f)[1] in ['.js','.jsx'] and not imported_by[f] and f not in entrypoints],
    'sample_files': files[:20],
}
print(json.dumps(output, indent=2))
