import { expect, test } from '@playwright/test';

test('the news page lists what changed, newest first', async ({ page }) => {
  await page.goto('/news');

  await expect(page.getByTestId('news-exercises-sets')).toContainText(
    'The set is the address',
  );
  await expect(page.getByTestId('news-new-interface')).toContainText(
    'A new interface',
  );
  // The version is read off the executable, never written in the entry.
  await expect(page.getByTestId('news-surge-2')).toContainText(/surge \d/);
});

test('an entry opens the page it talks about', async ({ page }) => {
  await page.goto('/news');

  await page
    .getByTestId('news-exercises-sets')
    .getByRole('button', { name: 'Open the exercises' })
    .click();

  await expect(page).toHaveURL(/\/exercises\?formulas=C4H10O%2CC5H12/);
  await expect(page.getByText('C4H10O').first()).toBeVisible();
});

test('the news tab is reachable from the header and survives a reload', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'News', exact: true }).click();

  await expect(page).toHaveURL(/\/news$/);
  await page.reload();
  await expect(page.getByTestId('news-surge-2')).toBeVisible();
});
