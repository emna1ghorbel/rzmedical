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
  await page.route('**/api/auth/profile', route => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ id: 1, email: 'admin.e2e@example.test', prenom: 'Admin', nom: 'E2E' }),
  }));
  await page.goto('/');
  await page.getByRole('button', { name: /Admin E2E/i }).click();
  await page.getByRole('button', { name: /Déconnexion/i }).click();

  await expect(page).toHaveURL(/\/signin/);
  await page.goto('/products');
  await expect(page).toHaveURL(/\/signin/);
});
