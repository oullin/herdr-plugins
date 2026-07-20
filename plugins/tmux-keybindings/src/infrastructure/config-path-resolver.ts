import { join } from 'node:path';

import type { Environment } from '#tmux-keybindings/domain/models';
import { PluginError } from '#tmux-keybindings/errors/plugin-error';

export class ConfigPathResolver {
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
