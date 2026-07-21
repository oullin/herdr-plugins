export interface PluginExecutionOptions<T> {
	readonly failurePrefix: string;
	readonly successMessage: (result: T) => string;
}

export function executePlugin<T>(operation: () => T, options: PluginExecutionOptions<T>): void {
	try {
		process.stdout.write(`${options.successMessage(operation())}\n`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);

		process.stderr.write(`${options.failurePrefix}: ${message}\n`);
		process.exitCode = 1;
	}
}
