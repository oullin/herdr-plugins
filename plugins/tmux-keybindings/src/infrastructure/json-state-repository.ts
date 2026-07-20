import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import type { StateRepositoryPort } from '#tmux-keybindings/application/ports/state-repository-port';
import type { ConfigurationSnapshot } from '#tmux-keybindings/domain/models';

interface PaneState {
	readonly panes: Readonly<Record<string, string>>;
}

export class JsonStateRepository implements StateRepositoryPort {
	private readonly stateDirectory: string;

	constructor(stateDirectory: string) {
		this.stateDirectory = stateDirectory;
	}

	loadConfigurationSnapshot(configPath: string): ConfigurationSnapshot | undefined {
		return this.readJson<ConfigurationSnapshot>(this.snapshotPath(configPath));
	}

	saveConfigurationSnapshot(snapshot: ConfigurationSnapshot): void {
		this.writeJson(this.snapshotPath(snapshot.configPath), snapshot);
	}

	deleteConfigurationSnapshot(configPath: string): void {
		const path = this.snapshotPath(configPath);

		if (existsSync(path)) {
			this.writeJson(path, undefined);
		}
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
		if (!existsSync(path)) {
			return undefined;
		}

		const content = readFileSync(path, 'utf8').trim();

		if (content === '') {
			return undefined;
		}

		return JSON.parse(content) as T;
	}

	private writeJson(path: string, value: unknown): void {
		mkdirSync(
			dirname(path),
			{ recursive: true },
		);

		const temporaryPath = join(
			dirname(path),
			`.${basename(path)}.${process.pid}.tmp`,
		);

		const content = value === undefined ? '' : `${JSON.stringify(value, null, 2)}\n`;

		writeFileSync(
			temporaryPath,
			content,
			{ encoding: 'utf8', mode: 0o600 },
		);
		renameSync(temporaryPath, path);
	}
}
