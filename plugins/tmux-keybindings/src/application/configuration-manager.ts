import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import type { StateRepositoryPort } from '#tmux-keybindings/application/ports/state-repository-port';
import type { ConfigPathResolver } from '#tmux-keybindings/infrastructure/config-path-resolver';
import type { KeybindingConfigEditor } from '#tmux-keybindings/infrastructure/keybinding-config-editor';
import { AtomicFileStore } from '@oullin/herdr-plugin-core';

export type ConfigurationResult = 'applied' | 'unchanged' | 'restored' | 'not-applied' | 'automatic-disabled';

export class ConfigurationManager {
	private readonly client: HerdrClientPort;
	private readonly editor: KeybindingConfigEditor;
	private readonly pathResolver: ConfigPathResolver;
	private readonly state: StateRepositoryPort;
	private readonly files: AtomicFileStore;

	constructor(client: HerdrClientPort, editor: KeybindingConfigEditor, pathResolver: ConfigPathResolver, state: StateRepositoryPort, files: AtomicFileStore = new AtomicFileStore()) {
		this.client = client;
		this.editor = editor;
		this.pathResolver = pathResolver;
		this.state = state;
		this.files = files;
	}

	apply(environment: Readonly<Record<string, string | undefined>> = process.env, automatic = false): ConfigurationResult {
		if (automatic && this.state.isAutomaticApplyDisabled()) {
			return 'automatic-disabled';
		}

		const configPath = this.pathResolver.resolve(environment);
		const originalExists = this.files.exists(configPath);
		const original = this.files.read(configPath) ?? '';
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

		const originalExists = this.files.exists(configPath);
		const original = this.files.read(configPath) ?? '';
		const restored = this.editor.restore(original, snapshot);

		this.writeAndValidate(configPath, original, originalExists, restored);
		this.state.deleteConfigurationSnapshot(configPath);
		this.state.setAutomaticApplyDisabled(true);
		this.client.reloadConfig();

		return 'restored';
	}

	private writeAndValidate(configPath: string, original: string, originalExists: boolean, candidate: string): void {
		const originalMode = this.files.mode(configPath);

		this.files.write(configPath, candidate, originalMode);

		try {
			this.client.validateConfig(configPath);
		} catch (error) {
			if (originalExists) {
				this.files.write(configPath, original, originalMode);
			} else {
				this.files.delete(configPath);
			}

			throw error;
		}
	}
}
