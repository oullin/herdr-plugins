export class PluginError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'PluginError';
	}
}

export interface HerdrErrorOptions extends ErrorOptions {
	readonly code?: string | undefined;
}

export class HerdrCommandError extends PluginError {
	readonly code: string | undefined;

	constructor(message: string, options: HerdrErrorOptions = {}) {
		super(message, options);
		this.name = 'HerdrCommandError';
		this.code = options.code;
	}
}
