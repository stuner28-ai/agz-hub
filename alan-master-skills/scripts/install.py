from pathlib import Path
import argparse, shutil, sys

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description="Install Alan Master Skills")
parser.add_argument("--pack", default="core-recommended", help="pack filename without .txt")
parser.add_argument("--dest", default=str(Path.home()/".agents"/"skills"), help="destination skills directory")
parser.add_argument("--force", action="store_true", help="replace existing skill folders")
args = parser.parse_args()

pack = ROOT/"packs"/f"{args.pack}.txt"
if not pack.exists():
    print("Unknown pack:", args.pack)
    print("Available:", ", ".join(sorted(p.stem for p in (ROOT/"packs").glob("*.txt"))))
    sys.exit(2)

dest = Path(args.dest).expanduser()
dest.mkdir(parents=True, exist_ok=True)
names = [x.strip() for x in pack.read_text(encoding="utf-8").splitlines() if x.strip()]

installed, skipped = [], []
for name in names:
    src = ROOT/"skills"/name
    out = dest/name
    if out.exists():
        if not args.force:
            skipped.append(name)
            continue
        shutil.rmtree(out)
    shutil.copytree(src, out)
    installed.append(name)

print(f"Installed: {len(installed)}")
if skipped:
    print(f"Skipped existing: {len(skipped)} (use --force to replace)")
print("Destination:", dest)
