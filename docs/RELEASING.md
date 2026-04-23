# Releases (GitHub)

## Was passiert automatisch

- **`CI`** (`.github/workflows/ci.yml`) läuft bei jedem Push und PR auf
  `main`: `npm ci`, `prisma generate`, `nuxt prepare`, Lint, Unit-Tests,
  Typecheck.
- **`Release`** (`.github/workflows/release.yml`) läuft, sobald ein **Tag**
  wie `v0.2.0` **gepusht** wird: es wird ein **GitHub Release** mit
  auto-generierten Release Notes (Commits/PRs seit dem vorherigen Tag)
  erstellt.

Es werden **keine** Build-Artefakte angehängt — infl0 wird typischerweise
selbst gebaut (`npm run build`) und mit eigener `DATABASE_URL` deployed.
Wenn ihr später z. B. `docker build`-Logs oder SBOMs anhängen wollt, erweitert
den Release-Job.

## Ersten (oder nächsten) Release auslösen

1. Auf `main` (oder dem Release-Branch) sicherstellen, dass **CI grün** ist.
2. **`docs/CHANGELOG.md`** pflegen: unter `[Unreleased]` eintragen, was
   Betreiber betrifft; für einen Release die Einträge unter eine neue
   Überschrift **`## [0.x.y] — YYYY-MM-DD`** verschieben (Keep-a-Changelog-
   Stil).
3. Optional **`package.json`** → Feld **`version`** auf dieselbe Semver
   setzen (ohne `v`-Präfix), damit Repo und Tag zusammenpassen.
4. Tag setzen und pushen:

   ```bash
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin v0.2.0
   ```

5. Auf GitHub unter **Releases** prüfen; Text bei Bedarf manuell nachbearbeiten.

**Konvention:** Tag-Name = `v` + Semver aus `CHANGELOG` / `package.json`.

## Berechtigungen

Für private Repos: Standard-`GITHUB_TOKEN` der Action reicht für Releases,
solange die Workflow-Berechtigung **Read and write** für „Contents“ erlaubt
(Repository → Settings → Actions → General → Workflow permissions).
