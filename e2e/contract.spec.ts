import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { siteById } from 'react-cheminfo/core';

import { ABOUT } from '../src/about.ts';
import { PAGE_ROUTES } from '../src/seo/routes.ts';

/**
 * Collect every uncaught page error and every console error of a page.
 * @param page - Page to listen to.
 * @returns The list the errors are pushed to as they happen.
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console.error: ${message.text()}`);
    }
  });
  return errors;
}

/**
 * Type a formula in the generator and run the search.
 * @param page - Page holding the generator.
 * @param formula - Molecular formula to enumerate.
 */
async function searchIsomers(page: Page, formula: string): Promise<void> {
  await page.getByRole('textbox').first().fill(formula);
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();
}

test('/about is the About page, with the Cite control and the footer', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/about');

  const { name } = siteById('surge');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    `${name.lead}${name.dot ? '.' : ''}${name.alt}`,
  );
  await expect(page.getByText(ABOUT.what, { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'How to cite', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('banner').getByRole('button', { name: 'Cite', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('contentinfo')).toHaveCount(1);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  expect(errors).toStrictEqual([]);
});

for (const embed of ['embed', 'embed=1']) {
  test(`?${embed} drops the header and the footer, and the tool still runs`, async ({
    page,
  }) => {
    await page.goto(`/?${embed}`);

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(page.getByRole('contentinfo')).toHaveCount(0);

    await searchIsomers(page, 'C3H8O');
    await expect(page.getByText('— 3 isomers')).toBeVisible();
    await expect(page.locator('.structure-cell')).toHaveCount(3);
  });
}

for (const route of PAGE_ROUTES) {
  test(`${route.path} loads with no error`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    expect(errors).toStrictEqual([]);
  });
}

test('an address the site does not know opens the generator', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await page.goto('/no/such/page');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('main')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Search constitutional isomers' }),
  ).toBeVisible();
  expect(errors).toStrictEqual([]);
});
