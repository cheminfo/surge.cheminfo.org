/**
 * A block of text to hand over: the address of a page, or the markup that
 * frames it. The buttons that take it away sit under it.
 * @param props - The text to show.
 * @returns The code block component.
 */
export default function CodeBlock(props: { code: string }) {
  return (
    <div className="code-block">
      <pre>{props.code}</pre>
    </div>
  );
}
