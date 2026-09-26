import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * Click a value and read back what it put on the clipboard.
 * @param page - Page holding the value.
 * @param value - The value to click.
 * @returns What the clipboard holds afterwards.
 */
async function copyValue(
  page: Page,
  value: ReturnType<Page['locator']>,
): Promise<string> {
  await value.click();
  await expect(value).toHaveAttribute('data-copy', 'copied');
  return page.evaluate(() => navigator.clipboard.readText());
}

/**
 * What the browser computes for an element's `user-select`.
 * @param page - Page holding the element.
 * @param selector - What to look at.
 * @returns The computed value.
 */
function userSelect(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => globalThis.getComputedStyle(element).userSelect);
}

async function searchButanols(page: Page): Promise<void> {
  await page.goto('/generator?mf=C4H10O');
  await expect(page.locator('.structure-cell')).toHaveCount(7);
}

test('the text of the tool cannot be selected', async ({ page }) => {
  await searchButanols(page);

  expect(await userSelect(page, '.result-title')).toBe('none');

  // A double click on the tool paints nothing: the page is driven, not read.
  await page.locator('.result-title').dblclick();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('');
});

test('an isomer of the result copies its SMILES', async ({ page }) => {
  await searchButanols(page);

  const first = page.locator('.structure-cell-drawing').first();
  await expect(first).toHaveAttribute('title', 'Copy the SMILES (CC(C)(O)C)');
  expect(
    await first.evaluate(
      (element) => globalThis.getComputedStyle(element).cursor,
    ),
    // The library draws its own clipboard cursor and keeps `copy` behind it,
    // so a browser that will not take the drawing still says what a click does.
  ).toMatch(/^url\("data:image\/svg\+xml,.+"\) 1 1, copy$/);

  expect(await copyValue(page, first)).toBe('CC(C)(O)C');
});

test('the number of isomers copies without its noun', async ({ page }) => {
  await searchButanols(page);

  const count = page.locator('.result-title .click-to-copy');
  await expect(count).toHaveText('7 isomers');
  await expect(count).toHaveAttribute('title', 'Copy the isomer count (7)');

  expect(await copyValue(page, count)).toBe('7');
});

test('an answer of the correction copies its SMILES', async ({ page }) => {
  await page.goto('/exercises?formulas=C4H10O');
  await page.getByRole('button', { name: 'I give up' }).click();
  await expect(page.locator('.structure-cell--missed')).toHaveCount(7);

  const first = page
    .locator('.structure-cell--missed .structure-cell-drawing')
    .first();
  // The answer carries its SMILES, so the title names it without openchemlib
  // being asked anything.
  await expect(first).toHaveAttribute('title', 'Copy the SMILES (CC(C)(O)C)');
  expect(await copyValue(page, first)).toBe('CC(C)(O)C');
});

test('the formula of an exercise copies as plain text', async ({ page }) => {
  await page.goto('/exercises?formulas=C4H10O');

  const formula = page.locator('.target-formula');
  await expect(formula).toHaveAttribute(
    'title',
    'Copy the molecular formula (C4H10O)',
  );

  expect(await copyValue(page, formula)).toBe('C4H10O');
});

test('a query idCode of a motif copies', async ({ page }) => {
  await page.goto('/fragments');

  const idCode = page
    .getByTestId('fragment-ring-3')
    .locator('.fragment-codes .click-to-copy')
    .first();
  await expect(idCode).toHaveText('fH@Mk}y@');

  expect(await copyValue(page, idCode)).toBe('fH@Mk}y@');
});

test('what is read rather than driven stays selectable', async ({ page }) => {
  await searchButanols(page);
  await page.getByRole('button', { name: 'Export the structures' }).click();
  await expect(page.locator('.export-preview')).toContainText('CCCCO');

  // A visitor takes one SMILES line out of the preview by selecting it.
  expect(await userSelect(page, '.export-preview')).toBe('text');

  await page.goto('/news');
  expect(await userSelect(page, '.news-summary')).toBe('text');
});
