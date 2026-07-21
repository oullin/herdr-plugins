import { describe, expect, it } from 'vite-plus/test';

import { HerdrCliClient } from '#tmux-keybindings/infrastructure/herdr-cli-client';
import { StubCommandRunner } from '@oullin/herdr-plugin-core/testing';

describe('HerdrCliClient', () => {
	it('opens the bindings entrypoint as an active-pane popup', () => {
		const runner = new StubCommandRunner({ error: undefined, status: 0, stdout: '', stderr: '' });
		const client = new HerdrCliClient('/mock/herdr', runner);

		client.openBindingsPopup();

		expect(runner.calls[0]?.args).toEqual(['plugin', 'pane', 'open', '--plugin', 'oullin.tmux-keybindings', '--entrypoint', 'bindings', '--placement', 'popup']);
	});
});
