import { test, expect } from '../../fixtures/test-fixtures';

test('le backend peut être vérifié séparément quand il est démarré', async ({ request, apiUrl }) => {
  test.skip(process.env.PLAYWRIGHT_API_HEALTH !== '1', 'Activer PLAYWRIGHT_API_HEALTH=1 avec une API de test démarrée');
  const response = await request.get(apiUrl.replace(/\/api$/, ''));
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ message: expect.any(String) });
});
