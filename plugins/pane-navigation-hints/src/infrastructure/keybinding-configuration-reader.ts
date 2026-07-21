import { existsSync, readFileSync } from 'node:fs';

import type { KeybindingConfigurationPort } from '#pane-navigation-hints/application/ports/keybinding-configuration-port';
import type { Environment, KeybindingConfiguration } from '#pane-navigation-hints/domain/models';
import type { KeybindingConfigParser } from '#pane-navigation-hints/infrastructure/keybinding-config-parser';
import { HerdrConfigPathResolver } from '@oullin/herdr-plugin-core';

export class KeybindingConfigurationReader implements KeybindingConfigurationPort {
	private readonly parser: KeybindingConfigParser;
	private readonly pathResolver: HerdrConfigPathResolver;

	constructor(parser: KeybindingConfigParser, pathResolver: HerdrConfigPathResolver = new HerdrConfigPathResolver()) {
		this.parser = parser;
		this.pathResolver = pathResolver;
	}

	read(environment: Environment = process.env): KeybindingConfiguration {
		const configPath = this.pathResolver.resolve(environment);
		const source = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';

		return { configPath, bindings: this.parser.parse(source) };
	}
}
