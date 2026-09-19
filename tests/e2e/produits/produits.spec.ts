import { test, expect } from '../../fixtures/test-fixtures';
import { authenticatedAdminSession } from '../../helpers/auth';
import { mockProductReferenceData } from '../../helpers/api-mocks';
import { productFixture } from '../../data/test-data';

test.describe('Produits — liste et validation UI', () => {
  test.beforeEach(async ({ page }) => {
    await authenticatedAdminSession(page);
    await mockProductReferenceData(page);
  });

  test('affiche, recherche et ouvre le formulaire de création avec les référentiels', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: 'Produits' })).toBeVisible();
    await expect(page.getByText(productFixture.nom)).toBeVisible();

    const search = page.getByPlaceholder('Rechercher nom, réf, marque...');
    await search.fill(productFixture.reference);
    await expect(page.getByText(productFixture.nom)).toBeVisible();
    await search.fill('aucun-produit-e2e');
    await expect(page.getByText(productFixture.nom)).not.toBeVisible();

    await page.getByRole('button', { name: '+ Nouveau Produit' }).click();
    await expect(page.getByRole('heading', { name: 'Nouveau Produit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible();
  });

  test('refuse un produit incomplet avant tout appel de mutation', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: '+ Nouveau Produit' }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Veuillez remplir tous les champs obligatoires')).toBeVisible();
  });
});
