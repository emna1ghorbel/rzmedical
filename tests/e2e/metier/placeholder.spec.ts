import { test, expect } from '../../fixtures/test-fixtures';

test.describe('Parcours métier avec données de test', () => {
  test('rappelle que les mutations nécessitent une base dédiée', async () => {
    test.skip(process.env.PLAYWRIGHT_E2E_MUTATIONS !== '1', 'Activer PLAYWRIGHT_E2E_MUTATIONS=1 uniquement avec une base PostgreSQL de test');
    expect(process.env.PLAYWRIGHT_TEST_DATABASE_URL).toBeTruthy();
  });
});
