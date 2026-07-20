import type { Environment, TabNumbersPlugin } from '#tab-numbers/application/tab-numbers-plugin';
import { executePlugin } from '@oullin/herdr-plugin-core';

export class TabNumbersApplication {
	private readonly plugin: TabNumbersPlugin;

	constructor(plugin: TabNumbersPlugin) {
		this.plugin = plugin;
	}

	execute(environment: Environment = process.env): void {
		executePlugin(
			() => this.plugin.run(environment),
			{
				failurePrefix: 'Tab number synchronisation failed',
				successMessage: (changed) => `Tab numbers synchronised (${changed} changed)`,
			},
		);
	}
}
