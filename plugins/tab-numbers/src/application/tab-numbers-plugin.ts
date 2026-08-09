import type { TabNumberSynchroniser } from '#tab-numbers/application/tab-number-synchroniser';
import { HerdrCommandError } from '#tab-numbers/errors/herdr-command-error';
import { type Environment, PluginContext } from '@oullin/herdr-plugin-core';

export type { Environment } from '@oullin/herdr-plugin-core';

export class TabNumbersPlugin {
	private static readonly singleTabEvents: ReadonlySet<string> = new Set(['tab.created', 'tab.renamed']);
	private static readonly workspaceTabEvents: ReadonlySet<string> = new Set(['tab.closed', 'tab.moved', 'pane.closed', 'pane.exited']);

	private readonly synchroniser: TabNumberSynchroniser;

	constructor(synchroniser: TabNumberSynchroniser) {
		this.synchroniser = synchroniser;
	}

	run(environment: Environment = process.env): number {
		const context = new PluginContext(environment);
		const event = context.event;

		if (event === undefined || (!TabNumbersPlugin.singleTabEvents.has(event) && !TabNumbersPlugin.workspaceTabEvents.has(event))) {
			return this.synchroniser.syncAll();
		}

		if (TabNumbersPlugin.workspaceTabEvents.has(event)) {
			const workspaceId = context.workspaceId();

			if (!workspaceId) {
				throw new HerdrCommandError(`${event} did not include a workspace id`);
			}

			return this.synchroniser.syncWorkspace(workspaceId);
		}

		const tabId = context.tabId();

		if (!tabId) {
			throw new HerdrCommandError(`${event} did not include a tab id`);
		}

		try {
			return Number(
				this.synchroniser.syncById(tabId),
			);
		} catch (error) {
			if (error instanceof HerdrCommandError && error.code === 'tab_not_found') {
				return 0;
			}

			throw error;
		}
	}
}
