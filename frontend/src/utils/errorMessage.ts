/**
 * Say what went wrong in a sentence, whatever was thrown: the service answers
 * with a message, but a network failure throws something else entirely.
 * @param error - Whatever was caught.
 * @returns Its message.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
