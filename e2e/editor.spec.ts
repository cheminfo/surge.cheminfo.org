import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Read where the editor's toolbar and drawing area are on the screen. Both
 * are canvases inside the editor's shadow root, which locators do not reach
 * reliably, so they are measured in the page itself.
 * @param page - Page holding a single editor.
 * @returns The viewport boxes of the toolbar and of the drawing area.
 */
async function editorBoxes(
  page: Page,
): Promise<{ toolbar: Box; drawing: Box }> {
  await page.locator('.structure-editor').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-openchemlib-canvas-editor]');
    const toolbar = root?.shadowRoot?.firstElementChild;
    const drawing = root?.shadowRoot?.querySelector('canvas[tabindex]');
    return (
      toolbar instanceof HTMLElement &&
      drawing instanceof HTMLElement &&
      toolbar.getBoundingClientRect().height > 0 &&
      drawing.getBoundingClientRect().width > 0
    );
  });
  return page.evaluate(() => {
    const root = document.querySelector('[data-openchemlib-canvas-editor]');
    const toolbar = root?.shadowRoot?.firstElementChild;
    const drawing = root?.shadowRoot?.querySelector('canvas[tabindex]');
    if (!toolbar || !drawing) throw new Error('the editor has no canvas');
    return {
      toolbar: toolbar.getBoundingClientRect().toJSON() as Box,
      drawing: drawing.getBoundingClientRect().toJSON() as Box,
    };
  });
}

test('the editor names its tools, explains its keys, and a click answers the exercise', async ({
  page,
}) => {
  await page.goto('/exercises?formulas=C2H6');
  await expect(page.getByText('0 of 1 found')).toBeVisible();

  const { toolbar, drawing } = await editorBoxes(page);

  // Button 5 of the first column is the single bond, the default tool.
  await page.mouse.move(toolbar.x + 12, toolbar.y + 2 + 5 * 21 + 10, {
    steps: 5,
  });
  const tooltip = page.getByTestId('structure-editor-tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Single bond');

  await page.getByRole('button', { name: 'Mouse and keyboard' }).click();
  const help = page.getByTestId('structure-editor-help');
  await expect(help).toBeVisible();
  await expect(help).toContainText(
    'Hover a toolbar button to see what it does and its key.',
  );
  await page.keyboard.press('Escape');
  await expect(help).toBeHidden();

  // A click on empty space with the single bond draws ethane, which the page
  // checks against surge's answers on its own.
  await page.mouse.click(
    drawing.x + drawing.width / 2,
    drawing.y + drawing.height / 2,
  );

  await expect(page.getByText('1 of 1 found')).toBeVisible();
  await expect(page.getByText('Exercise complete')).toBeVisible();
});
