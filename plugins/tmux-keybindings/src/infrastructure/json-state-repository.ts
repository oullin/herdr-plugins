import { createHash } from 'node:crypto';
import { join } from 'node:path';

import type { StateRepositoryPort } from '#tmux-keybindings/application/ports/state-repository-port';
import type { ConfigurationSnapshot } from '#tmux-keybindings/domain/models';
import { JsonFileStore } from '@oullin/herdr-plugin-core';

interface PaneState {
	readonly panes: Readonly<Record<string, string>>;
}

export class JsonStateRepository implements StateRepositoryPort {
	private readonly stateDirectory: string;
	private readonly store: JsonFileStore;

	constructor(stateDirectory: string, store: JsonFileStore = new JsonFileStore()) {
		this.stateDirectory = stateDirectory;
		this.store = store;
	}

	loadConfigurationSnapshot(configPath: string): ConfigurationSnapshot | undefined {
		return this.readJson<ConfigurationSnapshot>(this.snapshotPath(configPath));
	}

	saveConfigurationSnapshot(snapshot: ConfigurationSnapshot): void {
		this.writeJson(this.snapshotPath(snapshot.configPath), snapshot);
	}

	deleteConfigurationSnapshot(configPath: string): void {
		this.writeJson(this.snapshotPath(configPath), undefined);
	}

	isAutomaticApplyDisabled(): boolean {
		return this.readJson<{ readonly disabled: boolean }>(join(this.stateDirectory, 'automatic-apply.json'))?.disabled === true;
	}

	setAutomaticApplyDisabled(disabled: boolean): void {
		this.writeJson(join(this.stateDirectory, 'automatic-apply.json'), { disabled });
	}

	getTrackedPane(workspaceId: string, tabId: string): string | undefined {
		return this.readPaneState().panes[this.paneKey(workspaceId, tabId)];
	}

	setTrackedPane(workspaceId: string, tabId: string, paneId: string): void {
		const state = this.readPaneState();

		this.writeJson(join(this.stateDirectory, 'panes.json'), {
			panes: { ...state.panes, [this.paneKey(workspaceId, tabId)]: paneId },
		});
	}

	deleteTrackedPane(workspaceId: string, tabId: string): void {
		const state = this.readPaneState();
		const panes = { ...state.panes };

		delete panes[this.paneKey(workspaceId, tabId)];
		this.writeJson(join(this.stateDirectory, 'panes.json'), { panes });
	}

	private snapshotPath(configPath: string): string {
		const digest = createHash('sha256')
			.update(configPath)
			.digest('hex')
			.slice(0, 16);

		return join(this.stateDirectory, 'configuration', `${digest}.json`);
	}

	private paneKey(workspaceId: string, tabId: string): string {
		return `${workspaceId}:${tabId}`;
	}

	private readPaneState(): PaneState {
		return this.readJson<PaneState>(join(this.stateDirectory, 'panes.json')) ?? { panes: {} };
	}

	private readJson<T>(path: string): T | undefined {
		return this.store.read<T>(path);
	}

	private writeJson(path: string, value: unknown): void {
		this.store.write(path, value);
	}
}
