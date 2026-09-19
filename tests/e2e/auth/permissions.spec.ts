import { test, expect } from '../../fixtures/test-fixtures';
import { clearSession } from '../../helpers/auth';

test('les pages d’administration sont protégées sans token JWT', async ({ page }) => {
  await clearSession(page);
  for (const route of ['/', '/produits', '/bons-sortie', '/factures-fournisseurs', '/commerciaux']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/signin/);
  }
});
