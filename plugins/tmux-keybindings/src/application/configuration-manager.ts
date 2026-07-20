import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import type { StateRepositoryPort } from '#tmux-keybindings/application/ports/state-repository-port';
import type { ConfigPathResolver } from '#tmux-keybindings/infrastructure/config-path-resolver';
import type { KeybindingConfigEditor } from '#tmux-keybindings/infrastructure/keybinding-config-editor';

export type ConfigurationResult = 'applied' | 'unchanged' | 'restored' | 'not-applied' | 'automatic-disabled';

export class ConfigurationManager {
	private readonly client: HerdrClientPort;
	private readonly editor: KeybindingConfigEditor;
	private readonly pathResolver: ConfigPathResolver;
	private readonly state: StateRepositoryPort;

	constructor(client: HerdrClientPort, editor: KeybindingConfigEditor, pathResolver: ConfigPathResolver, state: StateRepositoryPort) {
		this.client = client;
		this.editor = editor;
		this.pathResolver = pathResolver;
		this.state = state;
	}

	apply(environment: Readonly<Record<string, string | undefined>> = process.env, automatic = false): ConfigurationResult {
		if (automatic && this.state.isAutomaticApplyDisabled()) {
			return 'automatic-disabled';
		}

		const configPath = this.pathResolver.resolve(environment);
		const originalExists = existsSync(configPath);
		const original = originalExists ? readFileSync(configPath, 'utf8') : '';
		const edit = this.editor.apply(original, configPath);
		const savedSnapshot = this.state.loadConfigurationSnapshot(configPath);

		this.writeAndValidate(configPath, original, originalExists, edit.content);

		if (!savedSnapshot) {
			this.state.saveConfigurationSnapshot(edit.snapshot);
		}

		if (!automatic) {
			this.state.setAutomaticApplyDisabled(false);
		}

		this.client.reloadConfig();

		return edit.content === original ? 'unchanged' : 'applied';
	}

	restore(environment: Readonly<Record<string, string | undefined>> = process.env): ConfigurationResult {
		const configPath = this.pathResolver.resolve(environment);
		const snapshot = this.state.loadConfigurationSnapshot(configPath);

		if (!snapshot) {
			return 'not-applied';
		}

		const originalExists = existsSync(configPath);
		const original = originalExists ? readFileSync(configPath, 'utf8') : '';
		const restored = this.editor.restore(original, snapshot);

		this.writeAndValidate(configPath, original, originalExists, restored);
		this.state.deleteConfigurationSnapshot(configPath);
		this.state.setAutomaticApplyDisabled(true);
		this.client.reloadConfig();

		return 'restored';
	}

	private writeAndValidate(configPath: string, original: string, originalExists: boolean, candidate: string): void {
		this.writeAtomically(configPath, candidate, originalExists ? statSync(configPath).mode : 0o600);

		try {
			this.client.validateConfig(configPath);
		} catch (error) {
			if (originalExists) {
				this.writeAtomically(configPath, original, statSync(configPath).mode);
			} else if (existsSync(configPath)) {
				unlinkSync(configPath);
			}

			throw error;
		}
	}

	private writeAtomically(path: string, content: string, mode: number): void {
		mkdirSync(
			dirname(path),
			{ recursive: true },
		);

		const temporaryPath = join(
			dirname(path),
			`.${basename(path)}.${process.pid}.tmp`,
		);

		writeFileSync(
			temporaryPath,
			content,
			{ encoding: 'utf8', mode },
		);
		renameSync(temporaryPath, path);
	}
}
