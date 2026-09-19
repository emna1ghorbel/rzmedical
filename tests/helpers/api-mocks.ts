import type { Page } from '@playwright/test';
import { productReferenceData } from '../data/test-data';

export async function mockProductReferenceData(page: Page) {
  await page.route('**/api/products*', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(productReferenceData.products) });
      return;
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(productReferenceData.products[0]) });
  });
  await page.route('**/api/subcategories', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(productReferenceData.subcategories) }));
  await page.route('**/api/brands', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(productReferenceData.brands) }));
}

export async function mockEmptyStockCommercialData(page: Page) {
  await page.route('**/api/stock-commercial/bons-sortie', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
  await page.route('**/api/clients/commerciaux', route => route.fulfill({ contentType: 'application/json', body: '[]' }));
}
