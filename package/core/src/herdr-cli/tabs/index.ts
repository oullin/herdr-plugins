import { HerdrCommandError } from '#herdr-plugin-core/errors';
import type { HerdrCliTransport } from '#herdr-plugin-core/herdr-cli/transport';
import { isJsonObject } from '#herdr-plugin-core/json';
import type { Tab } from '#herdr-plugin-core/models';
import type { TabClient } from '#herdr-plugin-core/ports';

export class HerdrTabClient implements TabClient {
	private readonly transport: HerdrCliTransport;

	constructor(transport: HerdrCliTransport) {
		this.transport = transport;
	}

	listTabs(workspaceId: string): readonly Tab[] {
		const tabs = this.transport.call(['tab', 'list', '--workspace', workspaceId])['tabs'];

		if (!Array.isArray(tabs)) {
			throw new HerdrCommandError('herdr tab list returned no tabs');
		}

		return tabs.map((tab) => this.parse(tab));
	}

	getTab(tabId: string): Tab {
		const tab = this.transport.call(['tab', 'get', tabId])['tab'];

		if (tab === undefined) {
			throw new HerdrCommandError(`herdr tab get returned no tab for ${tabId}`);
		}

		return this.parse(tab);
	}

	renameTab(tabId: string, label: string): void {
		this.transport.call(['tab', 'rename', tabId, label]);
	}

	private parse(value: unknown): Tab {
		if (
			!isJsonObject(value) ||
			typeof value['tab_id'] !== 'string' ||
			typeof value['workspace_id'] !== 'string' ||
			typeof value['label'] !== 'string' ||
			!Number.isInteger(value['number']) ||
			(value['number'] as number) < 1
		) {
			throw new HerdrCommandError('Herdr returned an invalid tab');
		}

		return {
			tab_id: value['tab_id'],
			workspace_id: value['workspace_id'],
			label: value['label'],
			number: value['number'] as number,
		};
	}
}
