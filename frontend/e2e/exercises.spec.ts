import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Draw a single carbon-carbon bond by dragging across the editor canvas,
 * which is the whole of ethane.
 * @param page - Page holding the editor.
 */
async function drawOneBond(page: Page): Promise<void> {
  // The editor draws its toolbar in a first canvas; the drawing area is the
  // last one.
  const canvas = page.locator('.structure-editor-canvas canvas').last();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('the structure editor has no canvas');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2 - 60, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, y, { steps: 10 });
  await page.mouse.up();
}

test('the shipped set lists every exercise with how many isomers it holds', async ({
  page,
}) => {
  await page.goto('/exercises');

  await expect(page.locator('.exercise-row')).toHaveCount(23);
  const first = page.locator('.exercise-row').first();
  await expect(first).toContainText('C5H12');
  await expect(first).toContainText('0 / 3');
});

test('a teacher hands out their own selection in the address', async ({
  page,
}) => {
  await page.goto('/exercises?mf=C4H10O,C3H8');

  await expect(page.locator('.exercise-row')).toHaveCount(2);
  await expect(page.locator('.exercise-row').first()).toContainText('0 / 7');
  await expect(page.getByText('0 of 7 found')).toBeVisible();
});

test('drawing the only isomer completes the exercise, and it survives a reload', async ({
  page,
}) => {
  await page.goto('/exercises?mf=C2H6');
  await expect(page.getByText('0 of 1 found')).toBeVisible();

  await drawOneBond(page);
  await page.getByRole('button', { name: 'Add this structure' }).click();

  await expect(
    page.getByText('That is the last one. Every isomer found!'),
  ).toBeVisible();
  await expect(page.getByText('1 of 1 found')).toBeVisible();
  await expect(page.getByText('Exercise complete')).toBeVisible();

  await page.reload();
  await expect(page.getByText('1 of 1 found')).toBeVisible();
});

test('a structure of the wrong formula is refused and named', async ({
  page,
}) => {
  await page.goto('/exercises?mf=C4H10O');

  await drawOneBond(page);
  await page.getByRole('button', { name: 'Add this structure' }).click();

  await expect(
    page.getByText('That structure has the wrong molecular formula:'),
  ).toBeVisible();
  await expect(page.getByText('0 of 7 found')).toBeVisible();
});

test('giving up shows every answer, and the hints come one at a time', async ({
  page,
}) => {
  await page.goto('/exercises?mf=C4H10O');

  await page.getByRole('button', { name: /Reveal hint 1 of/ }).click();
  await expect(
    page.getByText('The degree of unsaturation is 0:', { exact: false }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'I give up' }).click();

  await expect(page.getByText('All the answers')).toBeVisible();
  await expect(page.getByText('7 missed')).toBeVisible();
  await expect(page.locator('.structure-cell--missed')).toHaveCount(7);
});

test('an accepted structure cannot be added a second time from an emptied editor', async ({
  page,
}) => {
  await page.goto('/exercises?mf=C2H6');
  const add = page.getByRole('button', { name: 'Add this structure' });

  await drawOneBond(page);
  await expect(add).toBeEnabled();
  await add.click();
  await expect(page.getByText('1 of 1 found')).toBeVisible();

  // The editor was emptied, so there is nothing left to submit.
  await expect(page.getByText('Exercise complete')).toBeVisible();
  await expect(add).toHaveCount(0);
});

test('switching exercise leaves nothing of the previous drawing behind', async ({
  page,
}) => {
  await page.goto('/exercises?mf=C2H6,C4H10O');
  const add = page.getByRole('button', { name: 'Add this structure' });

  await drawOneBond(page);
  await expect(add).toBeEnabled();

  await page.locator('.exercise-row', { hasText: 'C4H10O' }).first().click();
  await expect(page.getByText('0 of 7 found')).toBeVisible();
  await expect(add).toBeDisabled();

  // And drawing works again in the fresh editor.
  await drawOneBond(page);
  await expect(add).toBeEnabled();
});

test('clearing every answer asks first', async ({ page }) => {
  await page.goto('/exercises?mf=C2H6');
  await drawOneBond(page);
  await page.getByRole('button', { name: 'Add this structure' }).click();
  await expect(page.getByText('1 of 1 found')).toBeVisible();

  await page.getByRole('button', { name: 'Clear all answers' }).click();
  await page.getByRole('button', { name: 'Clear everything' }).click();

  await expect(page.getByText('0 of 1 found')).toBeVisible();
});
