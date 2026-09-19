import { test as base, expect } from '@playwright/test';

export const test = base.extend<{
  apiUrl: string;
}>({
  apiUrl: async ({}, use) => use(process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:4000/api'),
  page: async ({ page }, use) => {
    // Prevent layout providers from triggering 401s when using fake tokens
    await page.route('**/api/company-info', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await page.route('**/api/exercices*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/api/auth/profile', route => {
      const auth = route.request().headers()['authorization'];
      if (auth && auth.includes('playwright-test-token')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, email: 'admin.e2e@example.test', prenom: 'Admin', nom: 'E2E' }) });
      }
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) });
    });
    await page.route('**/api/notifications*', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await use(page);
  },
});

export { expect };
