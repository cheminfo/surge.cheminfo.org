import { Button, ProgressBar } from '@blueprintjs/core';

/**
 * How far something long is, and the way out of it. Enumerating, reading a
 * result back into molecules and writing an export are all waits nobody can
 * guess the end of, so they all say where they are and can be given up on.
 * @param props - What to say, how far it is, and what to call to give up.
 * @returns The progress bar component.
 */
export default function RunProgressBar(props: {
  label: string;
  /** Between 0 and 1, or nothing while there is no counting the end. */
  value?: number;
  onCancel: () => void;
}) {
  return (
    <div className="run-progress">
      <ProgressBar intent="primary" value={props.value} />
      <div className="run-progress-line">
        <span>{props.label}</span>
        <Button
          variant="minimal"
          size="small"
          intent="danger"
          icon="cross"
          text="Cancel"
          onClick={props.onCancel}
        />
      </div>
    </div>
  );
}
