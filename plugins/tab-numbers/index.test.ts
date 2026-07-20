import { describe, expect, it } from 'vite-plus/test';

import {
  HerdrClient,
  HerdrCommandError,
  TabNumberFormatter,
  TabNumberSynchronizer,
  TabNumbersPlugin,
  type HerdrClientPort,
  type SpawnCommand,
  type Tab,
  type Workspace,
} from './index.ts';

class FakeHerdrClient implements HerdrClientPort {
  readonly renameCalls: Array<readonly [string, string]> = [];
  readonly requestedTabs: string[] = [];
  listWorkspaceCalls = 0;

  private readonly workspaces: readonly Workspace[];
  private readonly tabsByWorkspace: ReadonlyMap<string, readonly Tab[]>;
  private readonly selectedTab: Tab | undefined;

  constructor({
    workspaces = [],
    tabsByWorkspace = new Map(),
    selectedTab,
  }: {
    readonly workspaces?: readonly Workspace[];
    readonly tabsByWorkspace?: ReadonlyMap<string, readonly Tab[]>;
    readonly selectedTab?: Tab;
  } = {}) {
    this.workspaces = workspaces;
    this.tabsByWorkspace = tabsByWorkspace;
    this.selectedTab = selectedTab;
  }

  listWorkspaces(): readonly Workspace[] {
    this.listWorkspaceCalls += 1;
    return this.workspaces;
  }

  listTabs(workspaceId: string): readonly Tab[] {
    return this.tabsByWorkspace.get(workspaceId) ?? [];
  }

  getTab(tabId: string): Tab {
    this.requestedTabs.push(tabId);
    if (!this.selectedTab) {
      throw new Error(`No fake tab configured for ${tabId}`);
    }
    return this.selectedTab;
  }

  renameTab(tabId: string, label: string): void {
    this.renameCalls.push([tabId, label]);
  }
}

class MissingTabClient extends FakeHerdrClient {
  override getTab(): Tab {
    throw new HerdrCommandError('tab is gone', { code: 'tab_not_found' });
  }
}

describe('TabNumberFormatter', () => {
  const formatter = new TabNumberFormatter();

  it.each([
    ['skills', 1, 'skills · 1'],
    ['gocanto.sh', 5, 'gocanto.sh · 5'],
    ['oullin-web', 7, 'oullin-web · 7'],
    ['研究', 3, '研究 · 3'],
    ['développement', 12, 'développement · 12'],
  ])('formats %s with stable tab number %i', (label, number, expected) => {
    expect(formatter.format(label, number)).toBe(expected);
  });

  it('leaves numeric auto-generated labels untouched', () => {
    expect(formatter.format('7', 7)).toBe('7');
  });

  it('normalizes duplicate and stale managed suffixes', () => {
    expect(formatter.format('skills · 99 · 4', 1)).toBe('skills · 1');
  });

  it('removes a managed suffix when the base becomes numeric', () => {
    expect(formatter.format('7 · 2', 7)).toBe('7');
  });
});

describe('TabNumberSynchronizer', () => {
  it('reapplies the stable suffix after a manual rename', () => {
    const client = new FakeHerdrClient();
    const synchronizer = new TabNumberSynchronizer(client);

    expect(synchronizer.syncTab({ tab_id: 'w1:t5', label: 'maker tools', number: 5 })).toBe(true);
    expect(client.renameCalls).toEqual([['w1:t5', 'maker tools · 5']]);
  });

  it('does not recursively rename an already synchronized tab', () => {
    const client = new FakeHerdrClient();
    const synchronizer = new TabNumberSynchronizer(client);

    expect(synchronizer.syncTab({ tab_id: 'w1:t5', label: 'maker tools · 5', number: 5 })).toBe(
      false,
    );
    expect(client.renameCalls).toEqual([]);
  });

  it('synchronizes every workspace while preserving number gaps', () => {
    const client = new FakeHerdrClient({
      workspaces: [{ workspace_id: 'w1' }, { workspace_id: 'w9' }],
      tabsByWorkspace: new Map([
        [
          'w1',
          [
            { tab_id: 'w1:t1', label: 'skills', number: 1 },
            { tab_id: 'w1:t5', label: 'gocanto.sh', number: 5 },
            { tab_id: 'w1:t7', label: 'oullin-web', number: 7 },
          ],
        ],
        ['w9', [{ tab_id: 'w9:t2', label: '2', number: 2 }]],
      ]),
    });

    expect(new TabNumberSynchronizer(client).syncAll()).toBe(3);
    expect(client.renameCalls).toEqual([
      ['w1:t1', 'skills · 1'],
      ['w1:t5', 'gocanto.sh · 5'],
      ['w1:t7', 'oullin-web · 7'],
    ]);
  });
});

describe('TabNumbersPlugin', () => {
  it.each(['tab.created', 'tab.renamed'])('updates only the affected tab for %s', (event) => {
    const client = new FakeHerdrClient({
      selectedTab: { tab_id: 'w1:t7', label: 'new label', number: 7 },
    });
    const plugin = new TabNumbersPlugin(new TabNumberSynchronizer(client));

    expect(plugin.run({ HERDR_PLUGIN_EVENT: event, HERDR_TAB_ID: 'w1:t7' })).toBe(1);
    expect(client.requestedTabs).toEqual(['w1:t7']);
    expect(client.listWorkspaceCalls).toBe(0);
    expect(client.renameCalls).toEqual([['w1:t7', 'new label · 7']]);
  });

  it('treats a tab closed before its queued hook runs as a no-op', () => {
    const client = new MissingTabClient();
    const plugin = new TabNumbersPlugin(new TabNumberSynchronizer(client));

    expect(plugin.run({ HERDR_PLUGIN_EVENT: 'tab.renamed', HERDR_TAB_ID: 'w1:t8' })).toBe(0);
  });

  it('reports malformed event JSON when no tab context is available', () => {
    const plugin = new TabNumbersPlugin(new TabNumberSynchronizer(new FakeHerdrClient()));

    expect(() =>
      plugin.run({ HERDR_PLUGIN_EVENT: 'tab.created', HERDR_PLUGIN_EVENT_JSON: '{not-json' }),
    ).toThrowError('HERDR_PLUGIN_EVENT_JSON contains malformed JSON');
  });
});

describe('HerdrClient', () => {
  it('reports malformed JSON', () => {
    const spawn: SpawnCommand = () => ({
      error: undefined,
      status: 0,
      stdout: '{not-json',
      stderr: '',
    });
    const client = new HerdrClient('/mock/herdr', spawn);

    expect(() => client.listWorkspaces()).toThrowError(
      new HerdrCommandError('/mock/herdr workspace list returned malformed JSON'),
    );
  });

  it('reports Herdr command failures', () => {
    const spawn: SpawnCommand = () => ({
      error: undefined,
      status: 1,
      stdout: '',
      stderr: 'server unavailable\n',
    });
    const client = new HerdrClient('/mock/herdr', spawn);

    expect(() => client.listWorkspaces()).toThrowError(
      new HerdrCommandError('/mock/herdr workspace list failed: server unavailable'),
    );
  });
});
