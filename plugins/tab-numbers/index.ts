import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

type JsonObject = Record<string, unknown>;

export type Environment = Readonly<Record<string, string | undefined>>;

export interface Workspace {
  readonly workspace_id: string;
}

export interface Tab {
  readonly tab_id: string;
  readonly label: string;
  readonly number: number;
}

export interface HerdrClientPort {
  listWorkspaces(): readonly Workspace[];
  listTabs(workspaceId: string): readonly Tab[];
  getTab(tabId: string): Tab;
  renameTab(tabId: string, label: string): void;
}

export interface SpawnResult {
  readonly error: Error | undefined;
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

export type SpawnCommand = (binPath: string, args: readonly string[]) => SpawnResult;

interface HerdrErrorOptions extends ErrorOptions {
  readonly code?: string | undefined;
}

interface ApiError {
  readonly code?: string;
  readonly message?: string;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toApiError(value: unknown): ApiError | undefined {
  if (!isJsonObject(value)) {
    return undefined;
  }

  const code = value['code'];
  const message = value['message'];

  return {
    ...(typeof code === 'string' ? { code } : {}),
    ...(typeof message === 'string' ? { message } : {}),
  };
}

const defaultSpawn: SpawnCommand = (binPath, args) => {
  const result = spawnSync(binPath, [...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    error: result.error,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
};

export class HerdrCommandError extends Error {
  readonly code: string | undefined;

  constructor(message: string, options: HerdrErrorOptions = {}) {
    super(message, options);
    this.name = 'HerdrCommandError';
    this.code = options.code;
  }
}

export class TabNumberFormatter {
  private static readonly managedSuffixPattern = /(?: · \d+)+$/u;
  private static readonly numericLabelPattern = /^\d+$/u;

  format(label: string, number: number): string {
    const baseLabel = label.replace(TabNumberFormatter.managedSuffixPattern, '');

    if (baseLabel.length === 0 || TabNumberFormatter.numericLabelPattern.test(baseLabel)) {
      return baseLabel;
    }

    return `${baseLabel} · ${number}`;
  }
}

export class HerdrClient implements HerdrClientPort {
  private readonly binPath: string;
  private readonly spawn: SpawnCommand;

  constructor(
    binPath = process.env['HERDR_BIN_PATH'] ?? 'herdr',
    spawn: SpawnCommand = defaultSpawn,
  ) {
    this.binPath = binPath;
    this.spawn = spawn;
  }

  listWorkspaces(): readonly Workspace[] {
    const result = this.call(['workspace', 'list']);
    const workspaces = result['workspaces'];

    if (!Array.isArray(workspaces)) {
      throw new HerdrCommandError('herdr workspace list returned no workspaces');
    }

    return workspaces.map((workspace) => HerdrClient.parseWorkspace(workspace));
  }

  listTabs(workspaceId: string): readonly Tab[] {
    const result = this.call(['tab', 'list', '--workspace', workspaceId]);
    const tabs = result['tabs'];

    if (!Array.isArray(tabs)) {
      throw new HerdrCommandError('herdr tab list returned no tabs');
    }

    return tabs.map((tab) => HerdrClient.parseTab(tab));
  }

  getTab(tabId: string): Tab {
    const result = this.call(['tab', 'get', tabId]);
    const tab = result['tab'];

    if (tab === undefined) {
      throw new HerdrCommandError(`herdr tab get returned no tab for ${tabId}`);
    }

    return HerdrClient.parseTab(tab);
  }

  renameTab(tabId: string, label: string): void {
    this.call(['tab', 'rename', tabId, label]);
  }

  private call(args: readonly string[]): JsonObject {
    const command = `${this.binPath} ${args.join(' ')}`;
    const result = this.spawn(this.binPath, args);

    if (result.error) {
      throw new HerdrCommandError(`Could not run ${command}: ${result.error.message}`, {
        cause: result.error,
      });
    }

    if (result.status !== 0) {
      const rawError = result.stderr.trim();
      const apiError = this.parseApiError(rawError);
      const detail = (apiError?.message ?? rawError) || `exit status ${result.status ?? 'unknown'}`;

      throw new HerdrCommandError(`${command} failed: ${detail}`, { code: apiError?.code });
    }

    const response = this.parseJson(result.stdout, `${command} returned malformed JSON`);
    if (!isJsonObject(response)) {
      throw new HerdrCommandError(`${command} returned an invalid response`);
    }

    if ('error' in response) {
      const apiError = toApiError(response['error']);
      const message = apiError?.message ?? JSON.stringify(response['error']);
      throw new HerdrCommandError(`${command} failed: ${message}`, { code: apiError?.code });
    }

    const commandResult = response['result'];
    if (!isJsonObject(commandResult)) {
      throw new HerdrCommandError(`${command} returned no result`);
    }

    return commandResult;
  }

  private parseApiError(rawError: string): ApiError | undefined {
    if (rawError.length === 0) {
      return undefined;
    }

    try {
      const response = JSON.parse(rawError) as unknown;
      return isJsonObject(response) ? toApiError(response['error']) : undefined;
    } catch {
      return undefined;
    }
  }

  private parseJson(value: string, errorMessage: string): unknown {
    try {
      return JSON.parse(value) as unknown;
    } catch (error) {
      throw new HerdrCommandError(errorMessage, { cause: error });
    }
  }

  private static parseWorkspace(value: unknown): Workspace {
    if (!isJsonObject(value) || typeof value['workspace_id'] !== 'string') {
      throw new HerdrCommandError('Herdr returned an invalid workspace');
    }

    return { workspace_id: value['workspace_id'] };
  }

  private static parseTab(value: unknown): Tab {
    if (
      !isJsonObject(value) ||
      typeof value['tab_id'] !== 'string' ||
      typeof value['label'] !== 'string' ||
      !Number.isInteger(value['number']) ||
      (value['number'] as number) < 1
    ) {
      throw new HerdrCommandError('Herdr returned an invalid tab');
    }

    return {
      tab_id: value['tab_id'],
      label: value['label'],
      number: value['number'] as number,
    };
  }
}

export class TabNumberSynchronizer {
  private readonly client: HerdrClientPort;
  private readonly formatter: TabNumberFormatter;

  constructor(client: HerdrClientPort, formatter = new TabNumberFormatter()) {
    this.client = client;
    this.formatter = formatter;
  }

  syncAll(): number {
    let changed = 0;

    for (const workspace of this.client.listWorkspaces()) {
      for (const tab of this.client.listTabs(workspace.workspace_id)) {
        changed += Number(this.syncTab(tab));
      }
    }

    return changed;
  }

  syncById(tabId: string): boolean {
    return this.syncTab(this.client.getTab(tabId));
  }

  syncTab(tab: Tab): boolean {
    const nextLabel = this.formatter.format(tab.label, tab.number);

    if (nextLabel === tab.label) {
      return false;
    }

    this.client.renameTab(tab.tab_id, nextLabel);
    return true;
  }
}

export class TabNumbersPlugin {
  private static readonly tabEvents: ReadonlySet<string> = new Set(['tab.created', 'tab.renamed']);

  private readonly synchronizer: TabNumberSynchronizer;

  constructor(synchronizer: TabNumberSynchronizer) {
    this.synchronizer = synchronizer;
  }

  run(environment: Environment = process.env): number {
    const event = environment['HERDR_PLUGIN_EVENT'];
    if (event === undefined || !TabNumbersPlugin.tabEvents.has(event)) {
      return this.synchronizer.syncAll();
    }

    const tabId =
      environment['HERDR_TAB_ID'] ??
      this.tabIdFromEventJson(environment['HERDR_PLUGIN_EVENT_JSON']);
    if (!tabId) {
      throw new HerdrCommandError(`${event} did not include a tab id`);
    }

    try {
      return Number(this.synchronizer.syncById(tabId));
    } catch (error) {
      if (error instanceof HerdrCommandError && error.code === 'tab_not_found') {
        return 0;
      }
      throw error;
    }
  }

  private tabIdFromEventJson(eventJson: string | undefined): string | undefined {
    if (!eventJson) {
      return undefined;
    }

    let event: unknown;
    try {
      event = JSON.parse(eventJson) as unknown;
    } catch (error) {
      throw new HerdrCommandError('HERDR_PLUGIN_EVENT_JSON contains malformed JSON', {
        cause: error,
      });
    }

    if (!isJsonObject(event) || !isJsonObject(event['data'])) {
      return undefined;
    }

    const data = event['data'];
    if (typeof data['tab_id'] === 'string') {
      return data['tab_id'];
    }

    const tab = data['tab'];
    return isJsonObject(tab) && typeof tab['tab_id'] === 'string' ? tab['tab_id'] : undefined;
  }
}

export class TabNumbersApplication {
  private readonly plugin: TabNumbersPlugin;

  constructor(plugin: TabNumbersPlugin) {
    this.plugin = plugin;
  }

  execute(environment: Environment = process.env): void {
    try {
      const changed = this.plugin.run(environment);
      process.stdout.write(`Tab numbers synchronized (${changed} changed)\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Tab number synchronization failed: ${message}\n`);
      process.exitCode = 1;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = new HerdrClient();
  const synchronizer = new TabNumberSynchronizer(client);
  const plugin = new TabNumbersPlugin(synchronizer);
  new TabNumbersApplication(plugin).execute();
}
