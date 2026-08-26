from pathlib import Path
import re, sys, json

ROOT = Path(__file__).resolve().parents[1]
skills_root = ROOT / "skills"
errors, names = [], []

for d in sorted(p for p in skills_root.iterdir() if p.is_dir()):
    f = d / "SKILL.md"
    if not f.exists():
        errors.append(f"{d.name}: missing SKILL.md")
        continue
    text = f.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        errors.append(f"{d.name}: missing YAML frontmatter")
        continue
    parts = text.split("---", 2)
    if len(parts) < 3:
        errors.append(f"{d.name}: malformed frontmatter")
        continue
    fm = parts[1]
    m_name = re.search(r"^name:\s*(.+)$", fm, re.M)
    m_desc = re.search(r"^description:\s*(.+)$", fm, re.M)
    if not m_name or not m_desc:
        errors.append(f"{d.name}: missing name/description")
        continue
    name = m_name.group(1).strip()
    desc = m_desc.group(1).strip()
    names.append(name)
    if name != d.name:
        errors.append(f"{d.name}: folder/name mismatch ({name})")
    if not re.fullmatch(r"[a-z0-9-]+", name):
        errors.append(f"{d.name}: invalid skill name")
    if not desc.startswith("Use when "):
        errors.append(f"{d.name}: description must start 'Use when '")
    if len(desc) > 500:
        errors.append(f"{d.name}: description >500 chars")
    if len(fm) > 1024:
        errors.append(f"{d.name}: frontmatter >1024 chars")
    for section in ["## Principle","## Workflow","## Output contract","## Quality gates","## Stop conditions"]:
        if section not in text:
            errors.append(f"{d.name}: missing section {section}")

dupes = sorted({n for n in names if names.count(n) > 1})
if dupes:
    errors.append("duplicate names: " + ", ".join(dupes))

try:
    data = json.loads((ROOT/".codex-plugin"/"plugin.json").read_text(encoding="utf-8"))
    if data.get("name") != "alan-master-skills":
        errors.append("plugin manifest name mismatch")
    if data.get("skills") != "./skills/":
        errors.append("plugin manifest skills path mismatch")
except Exception as e:
    errors.append(f"invalid plugin.json: {e}")

if errors:
    print("VALIDATION FAILED")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print(f"VALIDATION PASSED: {len(names)} skills")
