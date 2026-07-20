import { describe, expect, it } from 'vite-plus/test';

import { HerdrCommandError } from '../../src/errors/herdr-command-error.ts';
import type { CommandResult, CommandRunner } from '../../src/infrastructure/command-runner.ts';
import { HerdrCliClient } from '../../src/infrastructure/herdr-cli-client.ts';

class StubCommandRunner implements CommandRunner {
	private readonly result: CommandResult;

	constructor(result: CommandResult) {
		this.result = result;
	}

	run(): CommandResult {
		return this.result;
	}
}

describe('HerdrCliClient', () => {
	it('preserves workspace identity when reading ordered tabs', () => {
		const runner = new StubCommandRunner({
			error: undefined,
			status: 0,
			stdout: JSON.stringify({
				result: {
					tabs: [{ tab_id: 'w1:tE', workspace_id: 'w1', label: 'alloy · 7', number: 14 }],
				},
			}),
			stderr: '',
		});

		const client = new HerdrCliClient('/mock/herdr', runner);

		expect(
			client.listTabs('w1'),
		).toEqual([{ tab_id: 'w1:tE', workspace_id: 'w1', label: 'alloy · 7', number: 14 }]);
	});

	it('reports malformed JSON', () => {
		const runner = new StubCommandRunner({
			error: undefined,
			status: 0,
			stdout: '{not-json',
			stderr: '',
		});

		const client = new HerdrCliClient('/mock/herdr', runner);

		expect(() => client.listWorkspaces()).toThrowError(new HerdrCommandError('/mock/herdr workspace list returned malformed JSON'));
	});

	it('reports Herdr command failures', () => {
		const runner = new StubCommandRunner({
			error: undefined,
			status: 1,
			stdout: '',
			stderr: 'server unavailable\n',
		});

		const client = new HerdrCliClient('/mock/herdr', runner);

		expect(() => client.listWorkspaces()).toThrowError(new HerdrCommandError('/mock/herdr workspace list failed: server unavailable'));
	});
});
