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

test('a formula with thousands of isomers keeps every one of them, and draws a screenful at a time', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('textbox').first().fill('C6H10O2');
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();

  // Nothing is left out: the whole enumeration is on the page.
  await expect(page.getByText('— 4869 isomers')).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText('Showing 4869 of 4869')).toBeVisible();

  // A drawing costs a molecule parsed and an SVG laid out, so only the rows
  // around the viewport are in the document.
  await expect(page.locator('.structure-cell').first()).toBeVisible();
  expect(await page.locator('.structure-cell').count()).toBeLessThan(200);
  await expect(page.locator('.structure-cell figcaption').first()).toHaveText(
    '1',
  );

  // The rows that are not drawn are still there to scroll through, and the
  // last isomer is reached at the bottom of them.
  const results = page.locator('.results-scroll');
  await results.evaluate((element: HTMLElement) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(page.locator('.structure-cell figcaption').last()).toHaveText(
    '4869',
  );
  expect(await page.locator('.structure-cell').count()).toBeLessThan(200);
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
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('butanols.txt');
});

test('a substructure filter says how far it is, and can be given up on', async ({
  page,
}) => {
  // A benzene filter over the seventy thousand isomers of C8H10O: every one of
  // them is read, which is the longest a search ever takes.
  await page.goto(
    '/generator?mf=C8H10O&fragment=gFp%40DiTt%40%40&limit=1000000',
  );

  const progress = page.locator('.run-progress-line > span').first();
  await expect(progress).toContainText(/Examining \d+ of 69659 structures/);

  const cancel = page.getByRole('button', { name: 'Cancel' });
  await cancel.click();

  // Giving up is not a failure: nothing is said, and the search is offered
  // again rather than half a result being shown.
  await expect(cancel).toBeHidden();
  await expect(page.getByText('No structure yet')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Search constitutional isomers' }),
  ).toBeEnabled();
});

test('writing an sdf says how far it is, can be given up on, and comes back', async ({
  page,
}) => {
  await page.goto('/generator?mf=C6H10O2');
  await expect(page.getByText('— 4869 isomers')).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole('button', { name: 'Export the structures' }).click();
  await page.getByRole('tab', { name: 'SDF' }).click();
  // The preview is written from the first structures alone, so it is there
  // before anything is exported.
  await expect(page.locator('.export-preview')).toContainText('V2000');

  // A molfile per structure with coordinates invented for it: seconds of
  // openchemlib, said out loud and interruptible.
  await page.getByRole('button', { name: 'Download' }).click();
  const progress = page.locator('.run-progress-line');
  await expect(progress).toContainText(/Writing \d+ of 4869 structures/);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(progress).toBeHidden();

  // Giving up ends the worker; the next export starts a new one and finishes.
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('C6H10O2.sdf');
  await expect(
    page.getByText('Wrote 4869 structures to C6H10O2.sdf'),
  ).toBeVisible();
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
