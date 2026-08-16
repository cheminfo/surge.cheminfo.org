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
  // The mouse is driven in viewport coordinates, so a canvas below the fold
  // would be dragged across whatever sits at those coordinates instead.
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('the structure editor has no canvas');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2 - 60, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, y, { steps: 10 });
  await page.mouse.up();
}

/**
 * Draw a chain of carbons, one drag per bond, each starting on the atom the
 * previous one left.
 * @param page - Page holding the editor.
 * @param bonds - How many bonds to draw.
 */
async function drawChain(page: Page, bonds: number): Promise<void> {
  const canvas = page.locator('.structure-editor-canvas canvas').last();
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('the structure editor has no canvas');
  const x = box.x + box.width / 2 - (bonds * 60) / 2;
  const y = box.y + box.height / 2;
  for (let bond = 0; bond < bonds; bond++) {
    await page.mouse.move(x + bond * 60, y + (bond % 2 === 0 ? 20 : -20));
    await page.mouse.down();
    await page.mouse.move(
      x + (bond + 1) * 60,
      y + (bond % 2 === 0 ? -20 : 20),
      { steps: 10 },
    );
    await page.mouse.up();
  }
}

test('the shipped set lists every exercise with how many isomers it holds', async ({
  page,
}) => {
  await page.goto('/exercises');

  await expect(page.locator('.exercise-row')).toHaveCount(23);
  const first = page.locator('.exercise-row').first();
  await expect(first).toContainText('C3H8');
  await expect(first).toContainText('0 / 1');
  await expect(page.locator('.exercise-row').last()).toContainText('0 / 26');
});

test('a formula too big to draw is named, and the course is loaded instead', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C6H10O');

  await expect(page.getByText('Left out of this set')).toBeVisible();
  await expect(
    page.getByText('has more than 500 isomers', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('.exercise-row')).toHaveCount(23);
});

test('a set keeps the formulas that work when one of them does not', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O,C6H10O');

  await expect(page.getByText('Left out of this set')).toBeVisible();
  await expect(page.locator('.exercise-row')).toHaveCount(1);
  await expect(page.locator('.exercise-row').first()).toContainText('C4H10O');
});

test('a teacher hands out their own selection in the address', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O,C3H8');

  await expect(page.locator('.exercise-row')).toHaveCount(2);
  await expect(page.locator('.exercise-row').first()).toContainText('0 / 7');
  await expect(page.getByText('0 of 7 found')).toBeVisible();
});

test('a correct structure is kept on its own, and it survives a reload', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C2H6');
  await expect(page.getByText('0 of 1 found')).toBeVisible();

  await drawOneBond(page);

  await expect(
    page.getByText('That is the last one. Every isomer found!'),
  ).toBeVisible();
  await expect(page.getByText('1 of 1 found')).toBeVisible();
  await expect(page.getByText('Exercise complete')).toBeVisible();

  await page.reload();
  await expect(page.getByText('1 of 1 found')).toBeVisible();
});

test('an accepted answer stays on the canvas, to be edited into the next one', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10');
  await expect(page.getByText('0 of 2 found')).toBeVisible();

  await drawChain(page, 3);

  await expect(page.getByText('1 of 2 found')).toBeVisible();
  const status = page.locator('.drawing-status');
  await expect(status).toContainText('You have drawn');
  await expect(status).toContainText('C4H10');
  await expect(status).toContainText('already checked');

  // The next drag works on what is already there — it closes the chain into a
  // ring. A canvas emptied on acceptance would read C2H6 instead.
  await drawChain(page, 1);
  await expect(status).toContainText('C4H8');
  await expect(page.getByText('1 of 2 found')).toBeVisible();
});

test('a reload gives the drawing back, without checking it again', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10');
  await drawChain(page, 3);
  await expect(page.getByText('1 of 2 found')).toBeVisible();

  await page.reload();

  await expect(page.getByText('1 of 2 found')).toBeVisible();
  const status = page.locator('.drawing-status');
  await expect(status).toContainText('You have drawn');
  await expect(status).toContainText('C4H10');
  await expect(status).toContainText('already checked');
  // Restored, not resubmitted: a second check would say it was already found.
  await expect(page.getByText('You had already found this one')).toBeHidden();
});

test('the instructions fold as soon as one draws, and come back on demand', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10');
  await expect(page.locator('.instructions-callout')).toBeVisible();

  await drawOneBond(page);

  await expect(page.locator('.instructions-callout')).toBeHidden();
  // Folded is remembered, so the canvas keeps the room on the next visit.
  await page.reload();
  await expect(page.locator('.instructions-callout')).toBeHidden();

  await page.getByRole('button', { name: 'How this works' }).click();
  await expect(page.locator('.instructions-callout')).toBeVisible();
  // Reopened on purpose: drawing again does not take them away a second time.
  await drawOneBond(page);
  await expect(page.locator('.instructions-callout')).toBeVisible();
});

test('a drawing of another formula is named, and never submitted', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O');

  await drawOneBond(page);

  await expect(page.locator('.drawing-status')).toContainText('You have drawn');
  await expect(page.locator('.drawing-status')).toContainText('C2H6');
  await expect(page.getByText('0 of 7 found')).toBeVisible();
});

test('giving up shows every answer, and the hints come one at a time', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O');

  await page.getByRole('button', { name: 'Reveal a hint' }).click();
  await expect(
    page.getByText('The degree of unsaturation is 0:', { exact: false }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'I give up' }).click();

  await expect(page.getByText('All the answers')).toBeVisible();
  await expect(page.getByText('7 missed')).toBeVisible();
  await expect(page.locator('.structure-cell--missed')).toHaveCount(7);
});

test('the hints name the motifs of the answers that were never drawn', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O');

  // Past the hints the formula alone gives — four of them for this exercise.
  for (let index = 0; index < 5; index++) {
    await page
      .getByRole('button', { name: /Reveal a hint|Another hint/ })
      .click();
  }

  await expect(page.getByText('Never drawn').first()).toBeVisible();
  await expect(
    page.getByText('4 answers hold a hydroxyl group, and none of yours does.', {
      exact: false,
    }),
  ).toBeVisible();
});

test('switching exercise leaves nothing of the previous drawing behind', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C2H6,C4H10O');

  await drawOneBond(page);
  await expect(page.getByText('1 of 1 found')).toBeVisible();

  await page.locator('.exercise-row', { hasText: 'C4H10O' }).first().click();
  await expect(page.getByText('0 of 7 found')).toBeVisible();
  await expect(page.locator('.drawing-status')).toContainText(
    'Draw an isomer: it is kept as soon as it is one of the answers.',
  );
});

test('clearing every answer asks first', async ({ page }) => {
  await page.goto('/exercises?formulas=C2H6');
  await drawOneBond(page);
  await expect(page.getByText('1 of 1 found')).toBeVisible();

  await page.getByRole('button', { name: 'Clear all answers' }).click();
  await page.getByRole('button', { name: 'Clear everything' }).click();

  await expect(page.getByText('0 of 1 found')).toBeVisible();
});
