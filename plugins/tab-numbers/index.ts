import { pathToFileURL } from 'node:url';

import { TabNumberSynchroniser } from '#tab-numbers/application/tab-number-synchroniser';
import { TabNumbersPlugin } from '#tab-numbers/application/tab-numbers-plugin';
import { HerdrCliClient } from '#tab-numbers/infrastructure/herdr-cli-client';
import { TabNumbersApplication } from '#tab-numbers/presentation/tab-numbers-application';

export { type HerdrClientPort } from '#tab-numbers/application/ports/herdr-client-port';
export { TabNumberSynchroniser } from '#tab-numbers/application/tab-number-synchroniser';
export { TabNumbersPlugin, type Environment } from '#tab-numbers/application/tab-numbers-plugin';
export { type Tab, type Workspace } from '#tab-numbers/domain/models';
export { TabNumberFormatter } from '#tab-numbers/domain/tab-number-formatter';
export { HerdrCommandError } from '#tab-numbers/errors/herdr-command-error';
export { type CommandResult, type CommandRunner, NodeCommandRunner } from '#tab-numbers/infrastructure/command-runner';
export { HerdrCliClient } from '#tab-numbers/infrastructure/herdr-cli-client';
export { TabNumbersApplication } from '#tab-numbers/presentation/tab-numbers-application';
export { PluginContext } from '@oullin/herdr-plugin-core';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const client = new HerdrCliClient();
	const synchroniser = new TabNumberSynchroniser(client);
	const plugin = new TabNumbersPlugin(synchroniser);

	new TabNumbersApplication(plugin).execute();
}
