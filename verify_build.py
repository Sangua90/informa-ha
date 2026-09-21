from pathlib import Path
import subprocess,re,shlex,sys,ast
root=Path('informa'); docker=(root/'Dockerfile').read_text(encoding="utf-8");fail=[]
for line in docker.splitlines():
 if 'grep -Fq' in line:
  args=shlex.split(line.replace('\\','').strip());i=args.index('-Fq');items=args[i+1:];items=items[1:] if items[0]=='--' else items
  needle,file=items;found=needle in (root/Path(file).relative_to('/app')).read_text(encoding='utf-8');expected='!' not in args
  if found!=expected:fail.append(file+': '+needle)
files=list((root/'web').glob('*.js'))
for p in files:
 r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
 if r.returncode:fail.append(r.stderr)
line=next(x for x in docker.splitlines() if x.startswith('RUN for f in '));names=line.split(' in ',1)[1].split('; do ')[0].split()
bundle=(root/'web/app.js').read_text(encoding="utf-8")+''.join((root/'web'/f).read_text(encoding="utf-8") for f in names)
Path('bundle-check.js').write_text(bundle, encoding="utf-8")
r=subprocess.run(['node','--check','bundle-check.js'],capture_output=True,text=True)
if r.returncode:fail.append(r.stderr)
Path('bundle-check.js').unlink()
for p in root.glob('*.py'):ast.parse(p.read_text(encoding='utf-8'))
sys.path.insert(0,str(root.resolve()));import coach_library_0962 as c
assert c.exercise_count()==49 and len(c.guide_ids())==49
print('JavaScript files:',len(files),'bundle fragments:',len(names),'Python syntax and catalog: OK')
print('Build checks:', 'PASS' if not fail else '\n'.join(fail))
raise SystemExit(bool(fail))
