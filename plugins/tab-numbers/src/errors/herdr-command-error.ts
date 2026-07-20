interface HerdrErrorOptions extends ErrorOptions {
  readonly code?: string | undefined;
}

export class HerdrCommandError extends Error {
  readonly code: string | undefined;

  constructor(message: string, options: HerdrErrorOptions = {}) {
    super(message, options);
    this.name = 'HerdrCommandError';
    this.code = options.code;
  }
}
