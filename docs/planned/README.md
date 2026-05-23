# Planned feature packages

This folder contains **concrete implementation packages**: bounded scope,
order, acceptance criteria — separate from the larger idea pool in
[`../ROADMAP.md`](../ROADMAP.md).

## Convention

- **One file per package** (or per larger theme), e.g.
  `some-feature-package.md`.
- At the top: **goal**, **non-goals**, **dependencies**, optional **estimate /
  risk**.
- At the bottom: **user stories** or a checklist, **definition of done**, links to
  PRs/issues when available.
- New package: copy [`_template.md`](./_template.md), use `kebab-case.md` for
  the file name.
- When a package ships: move it to `../archive/` and drop it from the index
  below. The archive carries the full shipped scope; this README stays
  forward-looking.

## Index

| Package | Summary | Status |
|--------|--------|--------|
| [`bdd-persona-coverage-wave-1.md`](./bdd-persona-coverage-wave-1.md) | Add first BDD scenario wave for new-user, privacy-sensitive, and power-user personas | Draft |

*(Add a row when a new package markdown is created.)*

## Prioritized backlog (recommended working order)

Use this order when choosing what to implement next. **Revisit** after each
package ships or when dependencies change.

| Priority | Package | Rationale |
|:--------:|---------|-----------|
| **P1** | [`bdd-persona-coverage-wave-1.md`](./bdd-persona-coverage-wave-1.md) | Broad BDD coverage wave; natural **after** major surfaces stabilise, or incrementally if scenarios stay behavior-focused. |
