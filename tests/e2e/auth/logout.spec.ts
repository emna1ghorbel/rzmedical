import { test, expect } from '../../fixtures/test-fixtures';
import { authenticatedAdminSession, clearSession } from '../../helpers/auth';

test('redirige une session absente vers la connexion', async ({ page }) => {
  test.setTimeout(120000);
  await clearSession(page);
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('/');
  await expect(page).toHaveURL(/\/signin/);
  await expect(page.getByRole('heading', { name: 'Connexion Admin' })).toBeVisible();
});

test('déconnecte une session existante et interdit le retour à une page protégée', async ({ page }) => {
  test.setTimeout(120000);
  await authenticatedAdminSession(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Déconnexion/i }).click();

  await expect(page).toHaveURL(/\/signin/);
  await clearSession(page);
  await page.goto('/products');
  await expect(page).toHaveURL(/\/signin/, { timeout: 20000 });
});
