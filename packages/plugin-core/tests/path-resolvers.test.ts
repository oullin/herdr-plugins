import { describe, expect, it } from 'vite-plus/test';

import { HerdrConfigPathResolver, PluginStateDirectoryResolver } from '@oullin/herdr-plugin-core';

describe('path resolvers', () => {
	it('honours Herdr path overrides', () => {
		expect(
			new HerdrConfigPathResolver().resolve({ HERDR_CONFIG_PATH: '/config.toml' }, 'linux'),
		).toBe('/config.toml');
		expect(
			new PluginStateDirectoryResolver('example.plugin').resolve({ HERDR_PLUGIN_STATE_DIR: '/state' }, 'linux'),
		).toBe('/state');
	});

	it('derives platform defaults for plugin state', () => {
		const resolver = new PluginStateDirectoryResolver('example.plugin');

		expect(
			resolver.resolve({ XDG_STATE_HOME: '/xdg-state' }, 'linux'),
		).toBe('/xdg-state/herdr/plugins/example.plugin');
		expect(
			resolver.resolve({ APPDATA: 'C:\\Users\\person\\AppData\\Roaming' }, 'win32'),
		).toMatch(/herdr[\\/]plugins[\\/]example\.plugin[\\/]state$/u);
	});
});
