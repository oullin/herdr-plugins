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
  it('reports malformed JSON', () => {
    const runner = new StubCommandRunner({
      error: undefined,
      status: 0,
      stdout: '{not-json',
      stderr: '',
    });
    const client = new HerdrCliClient('/mock/herdr', runner);

    expect(() => client.listWorkspaces()).toThrowError(
      new HerdrCommandError('/mock/herdr workspace list returned malformed JSON'),
    );
  });

  it('reports Herdr command failures', () => {
    const runner = new StubCommandRunner({
      error: undefined,
      status: 1,
      stdout: '',
      stderr: 'server unavailable\n',
    });
    const client = new HerdrCliClient('/mock/herdr', runner);

    expect(() => client.listWorkspaces()).toThrowError(
      new HerdrCommandError('/mock/herdr workspace list failed: server unavailable'),
    );
  });
});
