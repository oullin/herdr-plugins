import { describe, expect, it } from 'vite-plus/test';

import { ConfigPathResolver } from '#tmux-keybindings/infrastructure/config-path-resolver';

describe('ConfigPathResolver', () => {
	const resolver = new ConfigPathResolver();

	it('prefers HERDR_CONFIG_PATH', () => {
		expect(
			resolver.resolve({ HERDR_CONFIG_PATH: '/custom/herdr.toml', HOME: '/ignored' }, 'linux'),
		).toBe('/custom/herdr.toml');
	});

	it('follows XDG and home paths on Unix platforms', () => {
		expect(
			resolver.resolve({ XDG_CONFIG_HOME: '/xdg' }, 'linux'),
		).toBe('/xdg/herdr/config.toml');
		expect(
			resolver.resolve({ HOME: '/home/person' }, 'darwin'),
		).toBe('/home/person/.config/herdr/config.toml');
	});

	it('uses APPDATA on Windows', () => {
		expect(
			resolver.resolve({ APPDATA: 'C:\\Users\\person\\AppData\\Roaming' }, 'win32'),
		).toMatch(/herdr[\\/]config\.toml$/u);
	});
});
