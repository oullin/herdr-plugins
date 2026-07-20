import type { Tab, Workspace } from '../../domain/models.ts';

export interface HerdrClientPort {
	listWorkspaces(): readonly Workspace[];
	listTabs(workspaceId: string): readonly Tab[];
	getTab(tabId: string): Tab;
	renameTab(tabId: string, label: string): void;
}
