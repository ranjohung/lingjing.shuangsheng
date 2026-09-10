from pathlib import Path
import subprocess,sys,time
root=Path(__file__).resolve().parents[1]
watched=[root/'docs/PRD.md',root/'docs/progress-evidence.json',root/'docs/IMPLEMENTATION_STATUS.md']
previous=None
while True:
    current=tuple(p.stat().st_mtime_ns for p in watched)
    if current!=previous:
        subprocess.run([sys.executable,str(root/'scripts/update_progress.py')],check=True)
        previous=current
    time.sleep(3)
