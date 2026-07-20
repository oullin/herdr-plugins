import { HerdrCommandError } from '#herdr-plugin-core/errors';
import type { HerdrCliTransport } from '#herdr-plugin-core/herdr-cli/transport';
import { isJsonObject } from '#herdr-plugin-core/json';
import type { Workspace } from '#herdr-plugin-core/models';
import type { WorkspaceClient } from '#herdr-plugin-core/ports';

export class HerdrWorkspaceClient implements WorkspaceClient {
	private readonly transport: HerdrCliTransport;

	constructor(transport: HerdrCliTransport) {
		this.transport = transport;
	}

	listWorkspaces(): readonly Workspace[] {
		const workspaces = this.transport.call(['workspace', 'list'])['workspaces'];

		if (!Array.isArray(workspaces)) {
			throw new HerdrCommandError('herdr workspace list returned no workspaces');
		}

		return workspaces.map((workspace) => this.parse(workspace));
	}

	private parse(value: unknown): Workspace {
		if (!isJsonObject(value) || typeof value['workspace_id'] !== 'string') {
			throw new HerdrCommandError('Herdr returned an invalid workspace');
		}

		return { workspace_id: value['workspace_id'] };
	}
}
