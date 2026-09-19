import { test, expect } from '../../fixtures/test-fixtures';

test('les mutations métier ne peuvent être activées que sur une base explicitement marquée test', () => {
  const enabled = process.env.PLAYWRIGHT_E2E_MUTATIONS === '1';
  const databaseUrl = process.env.PLAYWRIGHT_TEST_DATABASE_URL || '';
  test.skip(!enabled, 'Les mutations exigent PLAYWRIGHT_E2E_MUTATIONS=1 et une base dédiée.');
  expect(databaseUrl).toMatch(/(?:_test|test_)/i);
});
