import { test, expect } from '../../fixtures/test-fixtures';
import { productFixture } from '../../data/test-data';
import { mockProductReferenceData } from '../../helpers/api-mocks';
import { authenticatedAdminSession } from '../../helpers/auth';

test('stock : la quantité exposée correspond au produit retourné par l’API', async ({ page }) => {
  await authenticatedAdminSession(page);
  await mockProductReferenceData(page);
  await page.goto('/stock');

  await expect(page.getByRole('heading', { name: 'Stock', exact: true })).toBeVisible();
  await expect(page.getByText(productFixture.nom)).toBeVisible();
  await expect(page.getByText(`${productFixture.stock} en stock`)).toBeVisible();
});
