import { pathToFileURL } from 'node:url';

import { TabNumberSynchronizer } from './src/application/tab-number-synchronizer.ts';
import { TabNumbersPlugin } from './src/application/tab-numbers-plugin.ts';
import { HerdrCliClient } from './src/infrastructure/herdr-cli-client.ts';
import { TabNumbersApplication } from './src/presentation/tab-numbers-application.ts';

export { type HerdrClientPort } from './src/application/ports/herdr-client-port.ts';
export { TabNumberSynchronizer } from './src/application/tab-number-synchronizer.ts';
export { TabNumbersPlugin, type Environment } from './src/application/tab-numbers-plugin.ts';
export { type Tab, type Workspace } from './src/domain/models.ts';
export { TabNumberFormatter } from './src/domain/tab-number-formatter.ts';
export { HerdrCommandError } from './src/errors/herdr-command-error.ts';
export {
  type CommandResult,
  type CommandRunner,
  NodeCommandRunner,
} from './src/infrastructure/command-runner.ts';
export { HerdrCliClient } from './src/infrastructure/herdr-cli-client.ts';
export { TabNumbersApplication } from './src/presentation/tab-numbers-application.ts';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = new HerdrCliClient();
  const synchronizer = new TabNumberSynchronizer(client);
  const plugin = new TabNumbersPlugin(synchronizer);
  new TabNumbersApplication(plugin).execute();
}
