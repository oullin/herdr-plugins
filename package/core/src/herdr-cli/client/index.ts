import type { CommandRunner } from '#herdr-plugin-core/command-runner';
import { HerdrConfigClient } from '#herdr-plugin-core/herdr-cli/config';
import { HerdrPaneClient } from '#herdr-plugin-core/herdr-cli/panes';
import { HerdrTabClient } from '#herdr-plugin-core/herdr-cli/tabs';
import { HerdrCliTransport } from '#herdr-plugin-core/herdr-cli/transport';
import { HerdrWorkspaceClient } from '#herdr-plugin-core/herdr-cli/workspaces';
import type { Environment, JsonObject, Pane, PluginPaneOptions, Tab, Workspace } from '#herdr-plugin-core/models';
import type { HerdrClient } from '#herdr-plugin-core/ports';

export class HerdrCliClient implements HerdrClient {
	readonly config: HerdrConfigClient;
	readonly panes: HerdrPaneClient;
	readonly tabs: HerdrTabClient;
	readonly transport: HerdrCliTransport;
	readonly workspaces: HerdrWorkspaceClient;

	constructor(binPath = process.env['HERDR_BIN_PATH'] ?? 'herdr', runner?: CommandRunner) {
		this.transport = new HerdrCliTransport(binPath, runner);
		this.config = new HerdrConfigClient(this.transport);
		this.panes = new HerdrPaneClient(this.transport);
		this.tabs = new HerdrTabClient(this.transport);
		this.workspaces = new HerdrWorkspaceClient(this.transport);
	}

	get binPath(): string {
		return this.transport.binPath;
	}

	get runner(): CommandRunner {
		return this.transport.runner;
	}

	listWorkspaces(): readonly Workspace[] {
		return this.workspaces.listWorkspaces();
	}

	listTabs(workspaceId: string): readonly Tab[] {
		return this.tabs.listTabs(workspaceId);
	}

	getTab(tabId: string): Tab {
		return this.tabs.getTab(tabId);
	}

	renameTab(tabId: string, label: string): void {
		this.tabs.renameTab(tabId, label);
	}

	validateConfig(configPath: string): void {
		this.config.validateConfig(configPath);
	}

	reloadConfig(): void {
		this.config.reloadConfig();
	}

	getPane(paneId: string): Pane | undefined {
		return this.panes.getPane(paneId);
	}

	openPluginPane(options: PluginPaneOptions): Pane {
		return this.panes.openPluginPane(options);
	}

	closePluginPane(paneId: string): boolean {
		return this.panes.closePluginPane(paneId);
	}

	call(args: readonly string[], environment?: Environment): JsonObject {
		return this.transport.call(args, environment);
	}

	run(args: readonly string[], environment?: Environment): string {
		return this.transport.run(args, environment);
	}
}
