import { test, expect } from '../../fixtures/test-fixtures';
import { clearSession } from '../../helpers/auth';

test('les routes critiques sont accessibles et protégées de façon cohérente', async ({ page }) => {
  await clearSession(page);
  const routes = ['/dashboard', '/produits', '/clients', '/fournisseurs', '/stock', '/bons-livraison', '/inventaires', '/rapports'];
  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/signin/);
  }
});
