import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import type { StateRepositoryPort } from '#tmux-keybindings/application/ports/state-repository-port';
import type { ConfigurationSnapshot } from '#tmux-keybindings/domain/models';

export class FakeHerdrClient implements HerdrClientPort {
	readonly validatedPaths: string[] = [];
	popupOpenCalls = 0;
	reloadCalls = 0;
	validationError: Error | undefined;

	validateConfig(configPath: string): void {
		this.validatedPaths.push(configPath);

		if (this.validationError) {
			throw this.validationError;
		}
	}

	reloadConfig(): void {
		this.reloadCalls += 1;
	}

	openBindingsPopup(): void {
		this.popupOpenCalls += 1;
	}
}

export class FakeStateRepository implements StateRepositoryPort {
	automaticApplyDisabled = false;
	readonly snapshots = new Map<string, ConfigurationSnapshot>();

	loadConfigurationSnapshot(configPath: string): ConfigurationSnapshot | undefined {
		return this.snapshots.get(configPath);
	}

	saveConfigurationSnapshot(snapshot: ConfigurationSnapshot): void {
		this.snapshots.set(snapshot.configPath, snapshot);
	}

	deleteConfigurationSnapshot(configPath: string): void {
		this.snapshots.delete(configPath);
	}

	isAutomaticApplyDisabled(): boolean {
		return this.automaticApplyDisabled;
	}

	setAutomaticApplyDisabled(disabled: boolean): void {
		this.automaticApplyDisabled = disabled;
	}
}
