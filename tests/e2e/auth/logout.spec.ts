import { test, expect } from '../../fixtures/test-fixtures';
import { authenticatedAdminSession, clearSession } from '../../helpers/auth';

test('redirige une session absente vers la connexion', async ({ page }) => {
  await clearSession(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/signin/);
  await expect(page.getByRole('heading', { name: 'Connexion Admin' })).toBeVisible();
});

test('déconnecte une session existante et interdit le retour à une page protégée', async ({ page }) => {
  await authenticatedAdminSession(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Déconnexion/i }).click();

  await expect(page).toHaveURL(/\/signin/);
  await page.goto('/products');
  await expect(page).toHaveURL(/\/signin/, { timeout: 20000 });
});
