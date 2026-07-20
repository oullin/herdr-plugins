import { describe, expect, it } from 'vite-plus/test';

import { TabNumberSynchronizer } from '../../src/application/tab-number-synchronizer.ts';
import { FakeHerdrClient } from '../support/fake-herdr-client.ts';

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
