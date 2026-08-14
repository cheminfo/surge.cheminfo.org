import { expect, test } from '@playwright/test';

test('a framed exercise drops the header, and the link decides what is left', async ({
  page,
}) => {
  await page.goto(
    '/exercises?formulas=C4H10O&embed=1&hide=list,hints,answers,clear',
  );

  await expect(page.getByText('0 of 7 found')).toBeVisible();
  await expect(page.locator('.page-header')).toHaveCount(0);
  await expect(page.locator('.exercise-list-card')).toHaveCount(0);
  await expect(page.getByText('Hints', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'I give up' })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Clear my answers' }),
  ).toHaveCount(0);

  // The instructions describe the page that is actually shown.
  const instructions = page.locator('.instructions');
  await expect(instructions).not.toContainText('hint');
  await expect(instructions).not.toContainText('Give up');
  await expect(instructions).not.toContainText('Pick an exercise');
  await expect(instructions).toContainText('Draw one possible isomer');
});

test('a framed generator runs the search of its link without offering the knobs', async ({
  page,
}) => {
  await page.goto('/?mf=C3H8O&embed=1&limit=5&timeout=10');

  await expect(page.getByText('3 isomers', { exact: false })).toBeVisible();
  await expect(page.locator('.page-header')).toHaveCount(0);

  await page.getByRole('button', { name: 'Options and restrictions' }).click();
  await expect(page.getByText('Structures returned')).toHaveCount(0);
  await expect(page.getByText('Seconds, at most 30')).toHaveCount(0);
  // Hidden, yet still applied: five of the three isomers is all of them.
  await expect(
    page.getByText('Showing 3 of 3', { exact: false }),
  ).toBeVisible();
});

test('a restriction the link carries survives, with the fold switched off', async ({
  page,
}) => {
  await page.goto('/?mf=C4H6&hide=options,lists,about&disallowTripleBonds=1');

  await expect(page.getByText('Options and restrictions')).toHaveCount(0);
  await expect(page.getByText('Export the structures')).toHaveCount(0);
  await expect(page.getByText('About', { exact: true })).toHaveCount(0);
  // The fold is gone, the restriction it holds is not: C4H6 has nine isomers,
  // seven of them without a triple bond.
  await expect(page.locator('.result-title')).toContainText('7 isomers');
});

test('the search a visitor runs ends up in the address, and in the shared link', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('textbox').first().fill('C3H8O');
  await page
    .getByRole('button', { name: 'Search constitutional isomers' })
    .click();
  await expect(page.getByText('3 isomers', { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/mf=C3H8O/);

  await page.getByRole('button', { name: 'Share' }).click();

  // The dialog opens on the link a course needs: framed, without the fold, the
  // substructure filter or the text lists.
  const link = page.locator('.code-block pre').first();
  await expect(link).toContainText('mf=C3H8O');
  await expect(link).toContainText('embed=1');
  await expect(link).toContainText('hide=options,substructure,lists');
  // The markup is handed over rather than read: only the clipboard has it.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(page.url()).origin,
  });
  await page.getByRole('button', { name: 'Copy the iframe' }).click();
  const iframe = await page.evaluate(() => navigator.clipboard.readText());
  expect(iframe).toContain('<iframe');
  expect(iframe).toContain('mf=C3H8O');

  // The label, not the input: Blueprint draws its own indicator over it.
  await page.getByText('Frame it: no header, no navigation').click();
  await expect(link).not.toContainText('embed');
});

test('the share dialog hands out the exercises that are ticked', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O,C3H8,C2H6');

  await page.getByRole('button', { name: 'Share' }).click();
  await page.getByRole('button', { name: 'None', exact: true }).click();
  await page.locator('.share-set label', { hasText: 'C3H8' }).first().click();

  await expect(page.locator('.code-block pre').first()).toContainText(
    'formulas=C3H8',
  );
});

test('hovering a formula of the picker draws every isomer it hands out', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O,C3H8');

  await page.getByRole('button', { name: 'Share' }).click();
  await page.locator('.share-set label', { hasText: 'C3H8' }).first().hover();

  const preview = page.locator('.exercise-preview');
  await expect(preview).toContainText('1 isomer');
  await expect(preview.locator('.structure-cell')).toHaveCount(1);

  await page.locator('.share-set label', { hasText: 'C4H10O' }).first().hover();
  await expect(preview).toContainText('7 isomers');
  await expect(preview.locator('.structure-cell')).toHaveCount(7);
});

test('a formula dragged elsewhere changes the order the link hands out', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O,C3H8,C2H6');
  await page.getByRole('button', { name: 'Share' }).click();

  const link = page.locator('.code-block pre').first();
  await expect(link).toContainText('formulas=C4H10O,C3H8,C2H6');

  const rows = page.locator('.share-set li');
  await rows.nth(2).dragTo(rows.first());
  await expect(link).toContainText('formulas=C2H6,C4H10O,C3H8');

  // The arrangement is what is shown, not only what is handed out.
  await expect(rows.first()).toContainText('C2H6');

  // One place further with the keyboard, from the grip of the row.
  await rows.first().getByRole('button', { name: 'Move C2H6' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(link).toContainText('formulas=C4H10O,C2H6,C3H8');
});

test('a formula lands on the side of the row the bar was drawn on', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O,C3H8,C2H6');
  await page.getByRole('button', { name: 'Share' }).click();

  const link = page.locator('.code-block pre').first();
  const rows = page.locator('.share-set li');
  // The dialog scales itself in, so a row measured too early is measured
  // small, and a point given as a fraction of it lands in the wrong half.
  await expect(link).toContainText('formulas=C4H10O,C3H8,C2H6');
  await page.waitForTimeout(400);
  const box = (await rows.nth(1).boundingBox()) as {
    width: number;
    height: number;
  };
  const middle = box.height / 2;
  // Well inside each half: the blocks step aside by a few pixels to open the
  // slot, so a point on the very edge of a row may end up beside it.
  const left = box.width * 0.25;
  const right = box.width * 0.75;

  // Dropped on the right half of C3H8, so after it.
  await rows.first().dragTo(rows.nth(1), {
    targetPosition: { x: right, y: middle },
  });
  await expect(link).toContainText('formulas=C3H8,C4H10O,C2H6');

  // And on the left half of C3H8, so before it — the first place again.
  await rows.nth(1).dragTo(rows.first(), {
    targetPosition: { x: left, y: middle },
  });
  await expect(link).toContainText('formulas=C4H10O,C3H8,C2H6');
});

test('reordering keeps the formulas nobody ticked out of the link', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O,C3H8,C2H6');
  await page.getByRole('button', { name: 'Share' }).click();
  await page.locator('.share-set label', { hasText: 'C2H6' }).first().click();

  const link = page.locator('.code-block pre').first();
  await expect(link).toContainText('formulas=C4H10O,C3H8');

  // Moved to the front, and still out of the link.
  const rows = page.locator('.share-set li');
  await rows.nth(2).dragTo(rows.first());
  await expect(rows.first()).toContainText('C2H6');
  await expect(link).toContainText('formulas=C4H10O,C3H8');
});

test('the generator formula is not carried over as an exercise set', async ({
  page,
}) => {
  await page.goto('/?mf=C6H10O');
  await page.getByRole('button', { name: 'Exercises', exact: true }).click();

  await expect(page).toHaveURL(/\/exercises$/);
  await expect(page.getByText('Left out of this set')).toHaveCount(0);
});
