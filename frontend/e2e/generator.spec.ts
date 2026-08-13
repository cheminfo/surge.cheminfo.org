import { expect, test } from '@playwright/test';

test('generates the seven isomers of C4H10O', async ({ page }) => {
  await page.goto('/');

  const formula = page.getByRole('textbox').first();
  await formula.fill('C4H10O');
  await page.getByRole('button', { name: 'Search structural isomers' }).click();

  await expect(page.getByText('— 7 isomers')).toBeVisible();
  await expect(page.getByText('Every isomer was enumerated.')).toBeVisible();

  // Seven drawings, and the SMILES list that goes with them.
  await expect(page.locator('.structure-cell')).toHaveCount(7);
  await expect(page.getByText('CCOCC', { exact: true })).toBeVisible();
});

test('a formula surge cannot use is reported instead of failing silently', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('textbox').first().fill('C4H10Fe');
  await page.getByRole('button', { name: 'Search structural isomers' }).click();

  await expect(
    page.getByText('"C4H10Fe" is not a formula surge can enumerate'),
  ).toBeVisible();
});

test('a restriction narrows the result', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('textbox').first().fill('C5H10');
  await page.getByRole('button', { name: 'Search structural isomers' }).click();
  await expect(page.getByText('— 10 isomers')).toBeVisible();

  // A BlueprintJS switch is clicked through its label: its own control
  // indicator intercepts a click aimed at the input.
  await page
    .getByText('Show ring and substructure restrictions', { exact: true })
    .click();
  await page.getByPlaceholder('max or min:max').nth(1).fill('0');
  await page.getByPlaceholder('max or min:max').nth(2).fill('0');
  await page.getByPlaceholder('max or min:max').nth(3).fill('0');
  await page.getByRole('button', { name: 'Search structural isomers' }).click();

  // Only the five acyclic pentenes are left.
  await expect(page.getByText('— 5 isomers')).toBeVisible();
});
