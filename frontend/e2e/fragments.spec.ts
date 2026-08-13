import { expect, test } from '@playwright/test';

test('the debug page shows every motif and the sentence it produces', async ({
  page,
}) => {
  await page.goto('/fragments');

  await expect(
    page.getByText('motifs', { exact: false }).first(),
  ).toBeVisible();
  const card = page.getByTestId('fragment-ring-3');
  await expect(card).toContainText('Any atom sitting in a ring of three atoms');
  await expect(card).toContainText('fH@Mk}y@');
  await expect(card).toContainText(
    'Three atoms close a strained but perfectly stable ring',
  );
});

test('a formula is counted motif by motif, and stays in the address', async ({
  page,
}) => {
  await page.goto('/fragments');

  await page.getByPlaceholder('C4H8O').fill('C4H10O');
  await page.getByRole('button', { name: 'Count in the isomers' }).click();

  await expect(page.getByText('has 7 isomers')).toBeVisible();
  await expect(page.getByTestId('fragment-alcohol')).toContainText('4 / 7');
  expect(page.url()).toContain('mf=C4H10O');
});
