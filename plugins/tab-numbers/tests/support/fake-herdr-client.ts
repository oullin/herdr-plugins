import type { HerdrClientPort } from '#tab-numbers/application/ports/herdr-client-port';
import type { Tab, Workspace } from '#tab-numbers/domain/models';

export class FakeHerdrClient implements HerdrClientPort {
	readonly renameCalls: Array<readonly [string, string]> = [];
	readonly requestedTabs: string[] = [];
	readonly requestedWorkspaces: string[] = [];
	listWorkspaceCalls = 0;

	private readonly workspaces: readonly Workspace[];
	private readonly tabsByWorkspace: ReadonlyMap<string, readonly Tab[]>;
	private readonly selectedTab: Tab | undefined;

	constructor({
		workspaces = [],
		tabsByWorkspace = new Map(),
		selectedTab,
	}: {
		readonly workspaces?: readonly Workspace[];
		readonly tabsByWorkspace?: ReadonlyMap<string, readonly Tab[]>;
		readonly selectedTab?: Tab;
	} = {}) {
		this.workspaces = workspaces;
		this.tabsByWorkspace = tabsByWorkspace;
		this.selectedTab = selectedTab;
	}

	listWorkspaces(): readonly Workspace[] {
		this.listWorkspaceCalls += 1;

		return this.workspaces;
	}

	listTabs(workspaceId: string): readonly Tab[] {
		this.requestedWorkspaces.push(workspaceId);

		return this.tabsByWorkspace.get(workspaceId) ?? [];
	}

	getTab(tabId: string): Tab {
		this.requestedTabs.push(tabId);
		if (!this.selectedTab) {
			throw new Error(`No fake tab configured for ${tabId}`);
		}

		return this.selectedTab;
	}

	renameTab(tabId: string, label: string): void {
		this.renameCalls.push([tabId, label]);
	}
}
