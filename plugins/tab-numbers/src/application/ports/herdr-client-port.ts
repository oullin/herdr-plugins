import type { Tab, Workspace } from '#tab-numbers/domain/models';

export interface HerdrClientPort {
	listWorkspaces(): readonly Workspace[];
	listTabs(workspaceId: string): readonly Tab[];
	getTab(tabId: string): Tab;
	renameTab(tabId: string, label: string): void;
}
