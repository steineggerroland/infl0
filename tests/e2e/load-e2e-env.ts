import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'

/**
 * Same merge semantics as `npm run test:e2e` (`dotenv-cli` without `--override`):
 * load `.env`, then `.env.e2e`. Duplicate keys keep the **first** value (from `.env`);
 * keys only present in `.env.e2e` (e.g. `E2E_LOGIN_PASSWORD`, `DEV_SRP_*`) are added.
 * Used when Playwright is started without `dotenv-cli` (e.g. `npx playwright test`).
 */
export function loadE2eMergedEnv(root = process.cwd()) {
  const envFile = resolve(root, '.env')
  const e2eFile = resolve(root, '.env.e2e')
  if (existsSync(envFile)) loadEnv({ path: envFile })
  if (existsSync(e2eFile)) loadEnv({ path: e2eFile })
}
