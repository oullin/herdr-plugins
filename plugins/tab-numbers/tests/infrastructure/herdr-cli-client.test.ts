import { describe, expect, it } from 'vite-plus/test';

import { HerdrCommandError } from '#tab-numbers/errors/herdr-command-error';
import type { CommandResult, CommandRunner } from '#tab-numbers/infrastructure/command-runner';
import { HerdrCliClient } from '#tab-numbers/infrastructure/herdr-cli-client';

interface CommandCall {
	readonly binPath: string;
	readonly args: readonly string[];
}

class StubCommandRunner implements CommandRunner {
	readonly calls: CommandCall[] = [];

	private readonly result: CommandResult;

	constructor(result: CommandResult) {
		this.result = result;
	}

	run(binPath: string, args: readonly string[]): CommandResult {
		this.calls.push({ binPath, args });

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
		expect(runner.calls).toEqual([
			{
				binPath: '/mock/herdr',
				args: ['tab', 'list', '--workspace', 'w1'],
			},
		]);
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
