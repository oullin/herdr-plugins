import { describe, expect, it } from 'vite-plus/test';

import { TabNumberSynchronizer } from '#tab-numbers/application/tab-number-synchronizer';
import { FakeHerdrClient } from '#tab-numbers/testing/support/fake-herdr-client';

describe('TabNumberSynchronizer', () => {
	it('reapplies the contiguous suffix after a manual rename', () => {
		const client = new FakeHerdrClient();
		const synchronizer = new TabNumberSynchronizer(client);

		expect(
			synchronizer.syncTab({ tab_id: 'w1:t5', workspace_id: 'w1', label: 'maker tools', number: 5 }, 3),
		).toBe(true);
		expect(client.renameCalls).toEqual([['w1:t5', 'maker tools · 3']]);
	});

	it('does not recursively rename an already synchronized tab', () => {
		const client = new FakeHerdrClient();
		const synchronizer = new TabNumberSynchronizer(client);

		expect(
			synchronizer.syncTab({ tab_id: 'w1:t5', workspace_id: 'w1', label: 'maker tools · 3', number: 5 }, 3),
		).toBe(false);
		expect(client.renameCalls).toEqual([]);
	});

	it('synchronizes every workspace with contiguous display numbers', () => {
		const client = new FakeHerdrClient({
			workspaces: [{ workspace_id: 'w1' }, { workspace_id: 'w9' }],
			tabsByWorkspace: new Map([
				[
					'w1',
					[
						{ tab_id: 'w1:t1', workspace_id: 'w1', label: 'skills', number: 1 },
						{ tab_id: 'w1:t5', workspace_id: 'w1', label: 'gocanto.sh', number: 5 },
						{ tab_id: 'w1:t7', workspace_id: 'w1', label: 'oullin-web', number: 7 },
					],
				],
				['w9', [{ tab_id: 'w9:t2', workspace_id: 'w9', label: '2', number: 2 }]],
			]),
		});

		expect(
			new TabNumberSynchronizer(client).syncAll(),
		).toBe(3);
		expect(client.renameCalls).toEqual([
			['w1:t1', 'skills · 1'],
			['w1:t5', 'gocanto.sh · 2'],
			['w1:t7', 'oullin-web · 3'],
		]);
	});
});
