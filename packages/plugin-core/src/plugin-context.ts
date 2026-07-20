import { HerdrCommandError } from '#herdr-plugin-core/errors';
import { isJsonObject } from '#herdr-plugin-core/json';
import type { Environment, JsonObject } from '#herdr-plugin-core/models';

export class PluginContext {
	readonly environment: Environment;

	constructor(environment: Environment = process.env) {
		this.environment = environment;
	}

	get event(): string | undefined {
		return this.environment['HERDR_PLUGIN_EVENT'];
	}

	workspaceId(): string | undefined {
		return this.environment['HERDR_WORKSPACE_ID'] ?? this.identifier('workspace_id');
	}

	tabId(): string | undefined {
		return this.environment['HERDR_TAB_ID'] ?? this.identifier('tab_id');
	}

	paneId(): string | undefined {
		return this.environment['HERDR_PANE_ID'] ?? this.identifier('pane_id');
	}

	eventData(): JsonObject | undefined {
		const eventJson = this.environment['HERDR_PLUGIN_EVENT_JSON'];

		if (!eventJson) {
			return undefined;
		}

		let event: unknown;

		try {
			event = JSON.parse(eventJson) as unknown;
		} catch (error) {
			throw new HerdrCommandError('HERDR_PLUGIN_EVENT_JSON contains malformed JSON', { cause: error });
		}

		return isJsonObject(event) && isJsonObject(event['data']) ? event['data'] : undefined;
	}

	private identifier(name: 'pane_id' | 'tab_id' | 'workspace_id'): string | undefined {
		const data = this.eventData();

		if (!data) {
			return undefined;
		}

		if (typeof data[name] === 'string') {
			return data[name];
		}

		for (const entityName of ['pane', 'tab', 'workspace']) {
			const entity = data[entityName];

			if (isJsonObject(entity) && typeof entity[name] === 'string') {
				return entity[name];
			}
		}

		return undefined;
	}
}
