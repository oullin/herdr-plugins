import { join } from 'node:path';

import { PluginError } from '#herdr-plugin-core/errors';
import type { Environment } from '#herdr-plugin-core/models';

export class HerdrConfigPathResolver {
	resolve(environment: Environment = process.env, platform: NodeJS.Platform = process.platform): string {
		const override = environment['HERDR_CONFIG_PATH'];

		if (override) {
			return override;
		}

		if (platform === 'win32') {
			const appData = environment['APPDATA'];

			if (!appData) {
				throw new PluginError('Could not resolve Herdr config: APPDATA is not set');
			}

			return join(appData, 'herdr', 'config.toml');
		}

		const configHome = environment['XDG_CONFIG_HOME'];

		if (configHome) {
			return join(configHome, 'herdr', 'config.toml');
		}

		const home = environment['HOME'];

		if (!home) {
			throw new PluginError('Could not resolve Herdr config: HOME is not set');
		}

		return join(home, '.config', 'herdr', 'config.toml');
	}
}

export class PluginStateDirectoryResolver {
	private readonly pluginId: string;

	constructor(pluginId: string) {
		this.pluginId = pluginId;
	}

	resolve(environment: Environment = process.env, platform: NodeJS.Platform = process.platform): string {
		const injected = environment['HERDR_PLUGIN_STATE_DIR'];

		if (injected) {
			return injected;
		}

		if (platform === 'win32') {
			const localAppData = environment['LOCALAPPDATA'] ?? environment['APPDATA'];

			if (!localAppData) {
				throw new PluginError('Could not resolve plugin state: LOCALAPPDATA and APPDATA are not set');
			}

			return join(localAppData, 'herdr', 'plugins', this.pluginId, 'state');
		}

		const stateHome = environment['XDG_STATE_HOME'];

		if (stateHome) {
			return join(stateHome, 'herdr', 'plugins', this.pluginId);
		}

		const home = environment['HOME'];

		if (!home) {
			throw new PluginError('Could not resolve plugin state: HOME is not set');
		}

		return join(home, '.local', 'state', 'herdr', 'plugins', this.pluginId);
	}
}
