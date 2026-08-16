import { Button } from '@blueprintjs/core';
import { useState } from 'react';

/** How long the button says it copied, in milliseconds. */
const CONFIRMATION = 1500;

/**
 * A button that puts a piece of text on the clipboard and says so.
 * @param props - The text to copy, what the button reads, and its size.
 * @returns The copy button component.
 */
export default function CopyButton(props: {
  code: string;
  text: string;
  size?: 'small' | 'medium' | 'large';
  /**
   * Nothing to copy.
   * @default false
   */
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      size={props.size}
      disabled={props.disabled}
      icon={copied ? 'tick' : 'duplicate'}
      intent={copied ? 'success' : 'none'}
      text={copied ? 'Copied' : props.text}
      onClick={() => {
        void navigator.clipboard.writeText(props.code);
        setCopied(true);
        setTimeout(() => setCopied(false), CONFIRMATION);
      }}
    />
  );
}
