# Alan Master Skills

A curated pack of **61 original Agent Skills** organized for ChatGPT/Codex-style agent workflows.

## Why this pack is tiered

Installing huge uncurated catalogs can create trigger collisions and spend the agent's discovery/context budget. Start with `packs/core-recommended.txt`, then add domain packs only when useful.

## Contents

- `skills/` — 61 skill folders, each with a `SKILL.md`
- `.codex-plugin/plugin.json` — plugin manifest
- `packs/` — recommended subsets
- `scripts/validate_skills.py` — structural validator
- `scripts/install.py` — installer for selected packs
- `MANIFEST.md` — human-readable catalog
- `manifest.json` — machine-readable catalog
- `SOURCES.md` — provenance and upstream references

## Recommended installation

For user-level Codex/Agent Skills:

```bash
python scripts/install.py --pack core-recommended
```

Default destination: `~/.agents/skills`.

Install a domain pack:

```bash
python scripts/install.py --pack engineering
python scripts/install.py --pack product-business
python scripts/install.py --pack research
```

Install all skills:

```bash
python scripts/install.py --pack all
```

Validate:

```bash
python scripts/validate_skills.py
```

## Design rules

- One responsibility per skill.
- Trigger descriptions explain **when to use** a skill.
- Workflows are imperative and compact.
- Completion requires evidence where applicable.
- High-risk or irreversible actions require explicit authority.
- Domain packs reduce accidental skill overlap.

## Compatibility note

The folder format follows the open `SKILL.md` Agent Skills convention and the current OpenAI plugin layout. Exact installation surfaces can vary by ChatGPT/Codex product and version.
