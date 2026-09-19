import { test, expect } from '../../fixtures/test-fixtures';
import { productFixture } from '../../data/test-data';
import { mockEmptyStockCommercialData, mockProductReferenceData } from '../../helpers/api-mocks';
import { authenticatedAdminSession } from '../../helpers/auth';

test('bon de sortie : les référentiels sont chargés sans dépendre de données existantes', async ({ page }) => {
  await authenticatedAdminSession(page);
  await mockEmptyStockCommercialData(page);
  await mockProductReferenceData(page);
  await page.goto('/bons-sortie');

  await page.getByRole('button', { name: '+ Nouveau Bon' }).click();
  await expect(page.getByRole('heading', { name: 'Créer un Bon de Sortie' })).toBeVisible();
  await expect(page.getByText(productFixture.nom)).toBeVisible();
  await expect(page.getByText('-- Sélectionner un commercial --')).toBeVisible();
});
