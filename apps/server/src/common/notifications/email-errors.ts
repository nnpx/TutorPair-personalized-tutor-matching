/** Error codes are deliberately generic; never persist provider messages containing recipients. */
export class EmailSendError extends Error {
  constructor(public readonly code: string, public readonly retryable: boolean) {
    super(code);
    this.name = 'EmailSendError';
  }
}
