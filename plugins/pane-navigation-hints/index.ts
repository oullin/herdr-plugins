import { pathToFileURL } from 'node:url';

import { PaneNavigationHintSynchroniser } from '#pane-navigation-hints/application/pane-navigation-hint-synchroniser';
import { PaneNavigationHintsPlugin } from '#pane-navigation-hints/application/pane-navigation-hints-plugin';
import { NavigationHintFormatter } from '#pane-navigation-hints/domain/navigation-hint-formatter';
import { HerdrCliClient } from '#pane-navigation-hints/infrastructure/herdr-cli-client';
import { KeybindingConfigParser } from '#pane-navigation-hints/infrastructure/keybinding-config-parser';
import { KeybindingConfigurationReader } from '#pane-navigation-hints/infrastructure/keybinding-configuration-reader';
import { PluginApplication } from '#pane-navigation-hints/presentation/plugin-application';

export { type HerdrClientPort } from '#pane-navigation-hints/application/ports/herdr-client-port';
export { type KeybindingConfigurationPort } from '#pane-navigation-hints/application/ports/keybinding-configuration-port';
export { PANE_TITLE_SOURCE, PaneNavigationHintSynchroniser } from '#pane-navigation-hints/application/pane-navigation-hint-synchroniser';
export { type PaneNavigationHintsCommand, PaneNavigationHintsPlugin } from '#pane-navigation-hints/application/pane-navigation-hints-plugin';
export { DEFAULT_PANE_NAVIGATION_BINDINGS, PANE_NAVIGATION_CONFIG_KEYS } from '#pane-navigation-hints/domain/default-keybindings';
export type * from '#pane-navigation-hints/domain/models';
export { NavigationHintFormatter } from '#pane-navigation-hints/domain/navigation-hint-formatter';
export { PluginError } from '#pane-navigation-hints/errors/plugin-error';
export { HerdrCliClient } from '#pane-navigation-hints/infrastructure/herdr-cli-client';
export { KeybindingConfigParser } from '#pane-navigation-hints/infrastructure/keybinding-config-parser';
export { KeybindingConfigurationReader } from '#pane-navigation-hints/infrastructure/keybinding-configuration-reader';
export { PluginApplication } from '#pane-navigation-hints/presentation/plugin-application';
export { HerdrConfigPathResolver, PluginContext } from '@oullin/herdr-plugin-core';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const client = new HerdrCliClient();
	const configuration = new KeybindingConfigurationReader(new KeybindingConfigParser());
	const synchroniser = new PaneNavigationHintSynchroniser(client, configuration, new NavigationHintFormatter());
	const plugin = new PaneNavigationHintsPlugin(synchroniser);

	new PluginApplication(plugin).run(process.argv[2]);
}
