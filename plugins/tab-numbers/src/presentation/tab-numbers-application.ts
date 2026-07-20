import type { Environment, TabNumbersPlugin } from '../application/tab-numbers-plugin.ts';

export class TabNumbersApplication {
	private readonly plugin: TabNumbersPlugin;

	constructor(plugin: TabNumbersPlugin) {
		this.plugin = plugin;
	}

	execute(environment: Environment = process.env): void {
		try {
			const changed = this.plugin.run(environment);

			process.stdout.write(`Tab numbers synchronized (${changed} changed)\n`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);

			process.stderr.write(`Tab number synchronization failed: ${message}\n`);
			process.exitCode = 1;
		}
	}
}
