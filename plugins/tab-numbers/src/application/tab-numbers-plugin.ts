import type { TabNumberSynchronizer } from '#tab-numbers/application/tab-number-synchronizer';
import { HerdrCommandError } from '#tab-numbers/errors/herdr-command-error';

type JsonObject = Record<string, unknown>;

export type Environment = Readonly<Record<string, string | undefined>>;

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class TabNumbersPlugin {
	private static readonly singleTabEvents: ReadonlySet<string> = new Set(['tab.created', 'tab.renamed']);
	private static readonly workspaceTabEvents: ReadonlySet<string> = new Set(['tab.closed', 'tab.moved']);

	private readonly synchronizer: TabNumberSynchronizer;

	constructor(synchronizer: TabNumberSynchronizer) {
		this.synchronizer = synchronizer;
	}

	run(environment: Environment = process.env): number {
		const event = environment['HERDR_PLUGIN_EVENT'];

		if (event === undefined || (!TabNumbersPlugin.singleTabEvents.has(event) && !TabNumbersPlugin.workspaceTabEvents.has(event))) {
			return this.synchronizer.syncAll();
		}

		if (TabNumbersPlugin.workspaceTabEvents.has(event)) {
			const workspaceId = environment['HERDR_WORKSPACE_ID'] ?? this.workspaceIdFromEventJson(environment['HERDR_PLUGIN_EVENT_JSON']);

			if (!workspaceId) {
				throw new HerdrCommandError(`${event} did not include a workspace id`);
			}

			return this.synchronizer.syncWorkspace(workspaceId);
		}

		const tabId = environment['HERDR_TAB_ID'] ?? this.tabIdFromEventJson(environment['HERDR_PLUGIN_EVENT_JSON']);

		if (!tabId) {
			throw new HerdrCommandError(`${event} did not include a tab id`);
		}

		try {
			return Number(
				this.synchronizer.syncById(tabId),
			);
		} catch (error) {
			if (error instanceof HerdrCommandError && error.code === 'tab_not_found') {
				return 0;
			}

			throw error;
		}
	}

	private tabIdFromEventJson(eventJson: string | undefined): string | undefined {
		const data = this.eventData(eventJson);

		if (!data) {
			return undefined;
		}

		if (typeof data['tab_id'] === 'string') {
			return data['tab_id'];
		}

		const tab = data['tab'];

		return isJsonObject(tab) && typeof tab['tab_id'] === 'string' ? tab['tab_id'] : undefined;
	}

	private workspaceIdFromEventJson(eventJson: string | undefined): string | undefined {
		const data = this.eventData(eventJson);

		if (!data) {
			return undefined;
		}

		if (typeof data['workspace_id'] === 'string') {
			return data['workspace_id'];
		}

		const tab = data['tab'];

		return isJsonObject(tab) && typeof tab['workspace_id'] === 'string' ? tab['workspace_id'] : undefined;
	}

	private eventData(eventJson: string | undefined): JsonObject | undefined {
		if (!eventJson) {
			return undefined;
		}

		let event: unknown;

		try {
			event = JSON.parse(eventJson) as unknown;
		} catch (error) {
			throw new HerdrCommandError('HERDR_PLUGIN_EVENT_JSON contains malformed JSON', {
				cause: error,
			});
		}

		return isJsonObject(event) && isJsonObject(event['data']) ? event['data'] : undefined;
	}
}
