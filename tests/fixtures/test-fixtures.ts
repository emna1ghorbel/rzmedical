import { test as base, expect } from '@playwright/test';

export const test = base.extend<{
  apiUrl: string;
}>({
  apiUrl: async ({}, use) => use(process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:4000/api'),
});

export { expect };
