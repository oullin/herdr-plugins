import { describe, expect, it, vi } from 'vite-plus/test';

import {
  HerdrCommandError,
  createHerdrClient,
  formatTabLabel,
  runPlugin,
  syncAllTabs,
  syncTab,
} from './index.mjs';

describe('formatTabLabel', () => {
  it.each([
    ['skills', 1, 'skills · 1'],
    ['gocanto.sh', 5, 'gocanto.sh · 5'],
    ['oullin-web', 7, 'oullin-web · 7'],
    ['研究', 3, '研究 · 3'],
    ['développement', 12, 'développement · 12'],
  ])('formats %s with stable tab number %i', (label, number, expected) => {
    expect(formatTabLabel(label, number)).toBe(expected);
  });

  it('leaves numeric auto-generated labels untouched', () => {
    expect(formatTabLabel('7', 7)).toBe('7');
  });

  it('normalizes duplicate and stale managed suffixes', () => {
    expect(formatTabLabel('skills · 99 · 4', 1)).toBe('skills · 1');
  });

  it('removes a managed suffix when the base becomes numeric', () => {
    expect(formatTabLabel('7 · 2', 7)).toBe('7');
  });
});

describe('syncTab', () => {
  it('reapplies the stable suffix after a manual rename', () => {
    const renameTab = vi.fn();

    expect(syncTab({ tab_id: 'w1:t5', label: 'maker tools', number: 5 }, { renameTab })).toBe(true);
    expect(renameTab).toHaveBeenCalledOnce();
    expect(renameTab).toHaveBeenCalledWith('w1:t5', 'maker tools · 5');
  });

  it('does not recursively rename an already synchronized tab', () => {
    const renameTab = vi.fn();

    expect(syncTab({ tab_id: 'w1:t5', label: 'maker tools · 5', number: 5 }, { renameTab })).toBe(
      false,
    );
    expect(renameTab).not.toHaveBeenCalled();
  });
});

describe('syncAllTabs', () => {
  it('synchronizes every workspace while preserving number gaps', () => {
    const renameTab = vi.fn();
    const client = {
      listWorkspaces: () => [{ workspace_id: 'w1' }, { workspace_id: 'w9' }],
      listTabs: (workspaceId) =>
        workspaceId === 'w1'
          ? [
              { tab_id: 'w1:t1', label: 'skills', number: 1 },
              { tab_id: 'w1:t5', label: 'gocanto.sh', number: 5 },
              { tab_id: 'w1:t7', label: 'oullin-web', number: 7 },
            ]
          : [{ tab_id: 'w9:t2', label: '2', number: 2 }],
      renameTab,
    };

    expect(syncAllTabs(client)).toBe(3);
    expect(renameTab.mock.calls).toEqual([
      ['w1:t1', 'skills · 1'],
      ['w1:t5', 'gocanto.sh · 5'],
      ['w1:t7', 'oullin-web · 7'],
    ]);
  });
});

describe('event hooks', () => {
  it.each(['tab.created', 'tab.renamed'])('updates only the affected tab for %s', (event) => {
    const client = {
      getTab: vi.fn(() => ({ tab_id: 'w1:t7', label: 'new label', number: 7 })),
      listWorkspaces: vi.fn(() => {
        throw new Error('event hook must not enumerate workspaces');
      }),
      renameTab: vi.fn(),
    };

    expect(runPlugin({ HERDR_PLUGIN_EVENT: event, HERDR_TAB_ID: 'w1:t7' }, { client })).toBe(1);
    expect(client.getTab).toHaveBeenCalledWith('w1:t7');
    expect(client.listWorkspaces).not.toHaveBeenCalled();
    expect(client.renameTab).toHaveBeenCalledWith('w1:t7', 'new label · 7');
  });

  it('treats a tab closed before its queued hook runs as a no-op', () => {
    const client = {
      getTab: () => {
        throw new HerdrCommandError('tab is gone', { code: 'tab_not_found' });
      },
    };

    expect(
      runPlugin({ HERDR_PLUGIN_EVENT: 'tab.renamed', HERDR_TAB_ID: 'w1:t8' }, { client }),
    ).toBe(0);
  });
});

describe('Herdr command handling', () => {
  it('reports malformed JSON', () => {
    const client = createHerdrClient({
      binPath: '/mock/herdr',
      spawn: () => ({ status: 0, stdout: '{not-json', stderr: '' }),
    });

    expect(() => client.listWorkspaces()).toThrowError(
      new HerdrCommandError('/mock/herdr workspace list returned malformed JSON'),
    );
  });

  it('reports Herdr command failures', () => {
    const client = createHerdrClient({
      binPath: '/mock/herdr',
      spawn: () => ({ status: 1, stdout: '', stderr: 'server unavailable\n' }),
    });

    expect(() => client.listWorkspaces()).toThrowError(
      new HerdrCommandError('/mock/herdr workspace list failed: server unavailable'),
    );
  });

  it('reports malformed event JSON when no tab context is available', () => {
    const client = { getTab: vi.fn() };

    expect(() =>
      runPlugin(
        { HERDR_PLUGIN_EVENT: 'tab.created', HERDR_PLUGIN_EVENT_JSON: '{not-json' },
        { client },
      ),
    ).toThrowError('HERDR_PLUGIN_EVENT_JSON contains malformed JSON');
  });
});
