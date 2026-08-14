import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Draw a single carbon-carbon bond by dragging across the editor canvas.
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

/**
 * Check that the container is tall enough for the whole toolbar, which is
 * drawn in a canvas of a fixed height and is simply cut off otherwise.
 * @param page - Page holding the editor.
 */
async function expectWholeToolbar(page: Page): Promise<void> {
  // Heights are read off the layout rather than measured, so that the dialog
  // opening under a scaling transform still compares like with like.
  const toolbar = await page
    .locator('.structure-editor-canvas canvas')
    .first()
    .evaluate((canvas: HTMLCanvasElement) => canvas.offsetHeight);
  expect(toolbar).toBeGreaterThan(0);
  await expect
    .poll(() =>
      page
        .locator('.structure-editor')
        .evaluate((element: HTMLElement) => element.offsetHeight),
    )
    .toBeGreaterThanOrEqual(toolbar);
}

test('generates the seven isomers of C4H10O', async ({ page }) => {
  await page.goto('/');

  const formula = page.getByRole('textbox').first();
  await formula.fill('C4H10O');
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();

  await expect(page.getByText('— 7 isomers')).toBeVisible();
  await expect(page.getByText('Every isomer was enumerated.')).toBeVisible();

  await expect(page.locator('.structure-cell')).toHaveCount(7);
});

test('the export dialog hands the results out in every format', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('textbox').first().fill('C4H10O');
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();
  await expect(page.getByText('— 7 isomers')).toBeVisible();

  await page.getByRole('button', { name: 'Export the structures' }).click();
  const preview = page.locator('.export-preview');
  await expect(page.getByText('7 structures')).toBeVisible();
  await expect(preview).toContainText('CCOCC');

  // The name is the formula, and the extension follows the format.
  await expect(page.getByText('Downloaded as C4H10O.smi')).toBeVisible();
  await page.getByRole('tab', { name: 'SDF' }).click();
  await expect(page.getByText('Downloaded as C4H10O.sdf')).toBeVisible();
  await expect(preview).toContainText('V2000');
  await expect(preview).toContainText('> <SMILES>');

  await page.getByRole('tab', { name: 'idCodes' }).click();
  await expect(page.getByText('Downloaded as C4H10O.txt')).toBeVisible();

  // A name of one's choosing, and the file that is actually written.
  await page.getByRole('textbox').last().fill('butanols');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  expect((await download).suggestedFilename()).toBe('butanols.txt');
});

test('a formula surge cannot use is reported instead of failing silently', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('textbox').first().fill('C4H10Fe');
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();

  await expect(
    page.getByText('"C4H10Fe" is not a formula surge can enumerate'),
  ).toBeVisible();
});

test('a restriction narrows the result', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('textbox').first().fill('C5H10');
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();
  await expect(page.getByText('— 10 isomers')).toBeVisible();

  // Everything but the formula starts folded away.
  await page.getByRole('button', { name: 'Options and restrictions' }).click();
  // A BlueprintJS switch is clicked through its label: its own control
  // indicator intercepts a click aimed at the input.
  await page
    .getByText('Show ring and substructure restrictions', { exact: true })
    .click();
  await page.getByPlaceholder('max or min:max').nth(1).fill('0');
  await page.getByPlaceholder('max or min:max').nth(2).fill('0');
  await page.getByPlaceholder('max or min:max').nth(3).fill('0');
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();

  // Only the five acyclic pentenes are left.
  await expect(page.getByText('— 5 isomers')).toBeVisible();
});

test('a substructure drawn in the dialog filters the result and comes back with it', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('textbox').first().fill('C2H6O');
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();
  await expect(page.locator('.structure-cell')).toHaveCount(2);

  await page.getByRole('button', { name: 'Options and restrictions' }).click();
  await page.getByRole('button', { name: 'Substructure filter' }).click();
  await expectWholeToolbar(page);
  await drawOneBond(page);
  await page.getByRole('button', { name: 'Apply filter' }).click();

  // Ethanol holds a carbon-carbon bond, dimethyl ether does not.
  await expect(page.getByText('— 2 isomers')).toBeVisible();
  await expect(page.getByText('matching the fragment')).toBeVisible();
  await expect(page.locator('.structure-cell')).toHaveCount(1);
  await expect(page.getByText('active', { exact: true })).toBeVisible();

  // Reopening shows the fragment that is in use rather than a blank canvas.
  await page.getByRole('button', { name: 'Substructure filter' }).click();
  const clear = page.locator('.fragment-dialog').getByRole('button', {
    name: 'Clear',
  });
  await expect(clear).toBeEnabled();
  await clear.click();
  await expect(clear).toBeDisabled();
  await page.getByRole('button', { name: 'Apply filter' }).click();

  await expect(page.locator('.structure-cell')).toHaveCount(2);
});
