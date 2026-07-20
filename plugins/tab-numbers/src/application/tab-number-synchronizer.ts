import type { Tab } from '../domain/models.ts';
import { TabNumberFormatter } from '../domain/tab-number-formatter.ts';
import type { HerdrClientPort } from './ports/herdr-client-port.ts';

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
      for (const tab of this.client.listTabs(workspace.workspace_id)) {
        changed += Number(this.syncTab(tab));
      }
    }

    return changed;
  }

  syncById(tabId: string): boolean {
    return this.syncTab(this.client.getTab(tabId));
  }

  syncTab(tab: Tab): boolean {
    const nextLabel = this.formatter.format(tab.label, tab.number);

    if (nextLabel === tab.label) {
      return false;
    }

    this.client.renameTab(tab.tab_id, nextLabel);
    return true;
  }
}
