import type { HerdrClientPort } from '#tab-numbers/application/ports/herdr-client-port';
import type { Tab } from '#tab-numbers/domain/models';
import { TabNumberFormatter } from '#tab-numbers/domain/tab-number-formatter';

export class TabNumberSynchronizer {
	private readonly client: HerdrClientPort;
	private readonly formatter: TabNumberFormatter;

	constructor(client: HerdrClientPort, formatter = new TabNumberFormatter()) {
		this.client = client;
		this.formatter = formatter;
	}

	syncAll(): number {
		let changed = 0;

		for (const workspace of this.client.listWorkspaces()) {
			changed += this.syncWorkspace(workspace.workspace_id);
		}

		return changed;
	}

	syncWorkspace(workspaceId: string): number {
		return this.client.listTabs(workspaceId).reduce((changed, tab, index) => changed + Number(
			this.syncTab(tab, index + 1),
		), 0);
	}

	syncById(tabId: string): boolean {
		const selectedTab = this.client.getTab(tabId);
		const tabs = this.client.listTabs(selectedTab.workspace_id);
		const index = tabs.findIndex((tab) => tab.tab_id === tabId);

		if (index === -1) {
			return false;
		}

		const tab = tabs[index];

		return tab === undefined ? false : this.syncTab(tab, index + 1);
	}

	syncTab(tab: Tab, displayNumber: number): boolean {
		const nextLabel = this.formatter.format(tab.label, displayNumber);

		if (nextLabel === tab.label) {
			return false;
		}

		this.client.renameTab(tab.tab_id, nextLabel);

		return true;
	}
}
