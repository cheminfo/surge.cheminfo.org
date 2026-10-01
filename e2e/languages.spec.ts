import { expect, test } from '@playwright/test';

test('a prefixed address opens the page in that language', async ({ page }) => {
  await page.goto('/fr/exercises?formulas=C4H10O');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page).toHaveTitle(
    "Exercices d'isomérie : trouvez-les, puis vérifiez — surge.cheminfo.org",
  );
  await expect(
    page.getByRole('button', { name: 'Exercices', exact: true }),
  ).toBeVisible();
  // The chrome is react-cheminfo's, and is written in the same language.
  await expect(
    page.getByRole('button', { name: 'Partager', exact: true }),
  ).toBeVisible();
});

test('the unprefixed address stays English for everybody', async ({ page }) => {
  await page.goto('/exercises?formulas=C4H10O');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('0 of 7 found')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Share', exact: true }),
  ).toBeVisible();
});

test('every page names every language, plus x-default', async ({ page }) => {
  await page.goto('/');

  for (const hreflang of ['en', 'fr', 'de', 'es', 'it', 'x-default']) {
    await expect(
      page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`),
    ).toHaveCount(1);
  }
});

test('the switcher keeps the path and the query', async ({ page }) => {
  await page.goto('/exercises?formulas=C4H10O');

  await page.getByTestId('language-select-de').click();
  await expect(page).toHaveURL('/de/exercises?formulas=C4H10O');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(
    page.getByRole('button', { name: 'Übungen', exact: true }),
  ).toBeVisible();
  // The tab follows the switch too: the title is the table's, and the table is
  // the language's.
  await expect(page).toHaveTitle(
    'Isomerie-Übungen: selbst finden, dann prüfen — surge.cheminfo.org',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/de\/exercises$/,
  );

  await page.getByTestId('language-select-en').click();
  await expect(page).toHaveURL('/exercises?formulas=C4H10O');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('a sibling site hands the language over, and the address is normalised', async ({
  page,
}) => {
  await page.goto('/exercises?lang=de&formulas=C4H10O');

  // `?lang=` is how the family carries the language between its tools; a
  // translated site routes by the prefix, so the address becomes that one —
  // with no history entry, so Back leaves the site rather than bouncing.
  await expect(page).toHaveURL('/de/exercises?formulas=C4H10O');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(
    page.getByRole('button', { name: 'Übungen', exact: true }),
  ).toBeVisible();
});

test('the prefix of the address wins over the parameter offering a language', async ({
  page,
}) => {
  await page.goto('/fr/exercises?lang=de');

  // The prefix is what somebody handed out; the parameter is only an offer,
  // and it does not stay in the address either way.
  await expect(page).toHaveURL('/fr/exercises');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('a framed page inherits the prefix', async ({ page }) => {
  await page.goto('/fr/?embed=1');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Chercher les isomères de constitution' }),
  ).toBeVisible();
});

test('the shared link carries the language in its path', async ({ page }) => {
  await page.goto('/fr/?mf=C3H8O');

  await page.getByRole('button', { name: 'Partager', exact: true }).click();

  const link = page.locator('.code-block pre').first();
  await expect(link).toContainText('/fr/?mf=C3H8O');
  await expect(link).not.toContainText('lang=');
});

test('a bare front page opens in the language last read, a deep link never does', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C4H10O');
  await page.getByTestId('language-select-de').click();
  await expect(page).toHaveURL('/de/exercises?formulas=C4H10O');

  // Nothing but the bare front page is steered by what this browser remembers.
  await page.goto('/exercises');
  await expect(page).toHaveURL('/exercises');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.goto('/');
  await expect(page).toHaveURL('/de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});
