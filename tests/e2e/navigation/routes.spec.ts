import { test, expect } from '../../fixtures/test-fixtures';
import { clearSession } from '../../helpers/auth';

test('les routes critiques sont accessibles et protégées de façon cohérente', async ({ page }) => {
  test.setTimeout(120000);
  await clearSession(page);
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  const routes = ['/dashboard', '/products', '/customers', '/fournisseurs', '/stock', '/bons-livraison', '/inventaires', '/rapports'];
  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/signin/, { timeout: 20000 });
  }
});
