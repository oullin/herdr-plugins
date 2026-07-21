import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { KeybindingConfigParser } from '#pane-navigation-hints/infrastructure/keybinding-config-parser';
import { KeybindingConfigurationReader } from '#pane-navigation-hints/infrastructure/keybinding-configuration-reader';

describe('KeybindingConfigurationReader', () => {
	const directories: string[] = [];

	afterEach(() => {
		for (const directory of directories.splice(0)) {
			rmSync(
				directory,
				{ recursive: true, force: true },
			);
		}
	});

	it('follows HERDR_CONFIG_PATH and reads the current keys section', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'pane-navigation-hints-',
			),
		);

		const configPath = join(directory, 'config.toml');

		directories.push(directory);
		writeFileSync(configPath, '[keys]\nprefix = "ctrl+a"\n', 'utf8');

		const configuration = new KeybindingConfigurationReader(new KeybindingConfigParser()).read({ HERDR_CONFIG_PATH: configPath });

		expect(configuration.configPath).toBe(configPath);
		expect(configuration.bindings.prefix).toBe('ctrl+a');
	});

	it('uses defaults when the resolved config file does not exist', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'pane-navigation-hints-',
			),
		);

		const configPath = join(directory, 'missing.toml');

		directories.push(directory);

		const configuration = new KeybindingConfigurationReader(new KeybindingConfigParser()).read({ HERDR_CONFIG_PATH: configPath });

		expect(configuration.bindings.prefix).toBe('ctrl+b');
	});
});
