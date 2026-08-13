/**
 * Put the operator's tracking snippet into a page, just before `</head>` so it
 * loads before the application and sees the first view. The snippet is the
 * literal HTML the analytics provider hands out, read from the environment: a
 * deployment that sets nothing is served exactly the page that was built.
 * @param html - The page as the frontend build wrote it.
 * @param snippet - The provider's `<script>` tag, or nothing when tracking is off.
 * @returns The page to serve.
 */
export function injectTrackingScript(html: string, snippet?: string): string {
  const script = snippet?.trim();
  if (!script || html.includes(script)) return html;

  const head = html.lastIndexOf('</head>');
  if (head === -1) return `${html}\n${script}\n`;
  return `${html.slice(0, head)}${script}\n${html.slice(head)}`;
}
