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
  forward-looking. **Do not link to archive paths** from active docs, tests, or
  product code — record operator-facing facts in `CHANGELOG.md`, `DEPLOYING.md`,
  or `DEVELOPING.md` instead.

## Index

| Package | Summary | Status |
|-----|-----|-----|
| [`knowledge-base-tags.md`](knowledge-base-tags.md) | Tag suggestions, clouds, merging, organization | 🎯 Next |
| [`knowledge-base-connections.md`](knowledge-base-connections.md) | Visualize and manage connections between reading notes | 📋 Later |
| [`knowledge-base-learning.md`](knowledge-base-learning.md) | Spaced repetition and active recall for reading notes | 📋 Later |

*(Add a row when a new package markdown is created.)*

## Prioritized backlog (recommended working order)

| Priority | Package | Rationale |
|:-----:|-----|-----|
| 1 | `knowledge-base-tags.md` | Improve tag management. Improves discoverability of reading notes. |
| 2 | `knowledge-base-connections.md` | Visual graph of connections. More complex, visual. |
| 3 | `knowledge-base-learning.md` | Spaced repetition. Depends on reading notes having sufficient quality. |

*(Revisit after each package ships.)*
