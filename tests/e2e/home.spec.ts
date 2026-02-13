import { test, expect } from '@playwright/test';

const testSessionCode = process.env.PLAYWRIGHT_TEST_SESSION_CODE ?? 'TEST-TEST';
const testSessionName = process.env.PLAYWRIGHT_TEST_SESSION_NAME ?? 'Test Session';
const testSessionGmUsername = process.env.PLAYWRIGHT_TEST_SESSION_GM_USERNAME ?? 'Test GM';

test('shows the Stormlight VTT landing content', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Stormlight VTT' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Create New Session' })
  ).toBeVisible();
});

test('navigates to create session from the landing page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Create New Session' }).click();

  await expect(
    page.getByRole('heading', { name: 'Create Session' })
  ).toBeVisible();
});

test('navigates to join session from the landing page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Join Existing Session' }).click();

  await expect(
    page.getByRole('heading', { name: 'Join Session' })
  ).toBeVisible();
});

test('redirects protected routes back to home when not in a session', async ({
  page,
}) => {
  await page.goto('/lobby');

  await expect(
    page.getByRole('heading', { name: 'Stormlight VTT' })
  ).toBeVisible();

  await page.goto('/play');

  await expect(
    page.getByRole('heading', { name: 'Stormlight VTT' })
  ).toBeVisible();
});

test('joins the configured test session from the join flow', async ({ page }) => {
  await page.goto('/join');

  await page.getByLabel('Session Code').fill(testSessionCode);
  await page.getByLabel('Your Username').fill(testSessionGmUsername);
  await page.getByRole('button', { name: 'Join Session' }).click();

  await expect(page.getByRole('heading', { name: testSessionName })).toBeVisible();
  await expect(page.getByText(`Code: ${testSessionCode}`)).toBeVisible();
});
