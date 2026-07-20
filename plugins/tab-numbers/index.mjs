import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const managedSuffixPattern = /(?: · \d+)+$/u;
const numericLabelPattern = /^\d+$/u;
const tabEvents = new Set(['tab.created', 'tab.renamed']);

export class HerdrCommandError extends Error {
  constructor(message, { cause, code } = {}) {
    super(message, { cause });
    this.name = 'HerdrCommandError';
    this.code = code;
  }
}

export function formatTabLabel(label, number) {
  const baseLabel = label.replace(managedSuffixPattern, '');

  if (baseLabel.length === 0 || numericLabelPattern.test(baseLabel)) {
    return baseLabel;
  }

  return `${baseLabel} · ${number}`;
}

export function createHerdrClient({
  binPath = process.env.HERDR_BIN_PATH ?? 'herdr',
  spawn = spawnSync,
} = {}) {
  function call(args) {
    const command = `${binPath} ${args.join(' ')}`;
    const result = spawn(binPath, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.error) {
      throw new HerdrCommandError(`Could not run ${command}: ${result.error.message}`, {
        cause: result.error,
      });
    }

    if (result.status !== 0) {
      const rawError = result.stderr?.trim();
      let apiError;

      try {
        apiError = rawError ? JSON.parse(rawError).error : undefined;
      } catch {
        apiError = undefined;
      }

      const detail = apiError?.message ?? rawError ?? `exit status ${result.status ?? 'unknown'}`;
      throw new HerdrCommandError(`${command} failed: ${detail}`, { code: apiError?.code });
    }

    let response;
    try {
      response = JSON.parse(result.stdout);
    } catch (error) {
      throw new HerdrCommandError(`${command} returned malformed JSON`, { cause: error });
    }

    if (response === null || typeof response !== 'object') {
      throw new HerdrCommandError(`${command} returned an invalid response`);
    }

    if ('error' in response) {
      const message = response.error?.message ?? JSON.stringify(response.error);
      throw new HerdrCommandError(`${command} failed: ${message}`);
    }

    if (
      !('result' in response) ||
      response.result === null ||
      typeof response.result !== 'object'
    ) {
      throw new HerdrCommandError(`${command} returned no result`);
    }

    return response.result;
  }

  return {
    listWorkspaces() {
      const result = call(['workspace', 'list']);
      if (!Array.isArray(result.workspaces)) {
        throw new HerdrCommandError('herdr workspace list returned no workspaces');
      }
      return result.workspaces;
    },

    listTabs(workspaceId) {
      const result = call(['tab', 'list', '--workspace', workspaceId]);
      if (!Array.isArray(result.tabs)) {
        throw new HerdrCommandError('herdr tab list returned no tabs');
      }
      return result.tabs;
    },

    getTab(tabId) {
      const result = call(['tab', 'get', tabId]);
      if (result.tab === null || typeof result.tab !== 'object') {
        throw new HerdrCommandError(`herdr tab get returned no tab for ${tabId}`);
      }
      return result.tab;
    },

    renameTab(tabId, label) {
      call(['tab', 'rename', tabId, label]);
    },
  };
}

function assertTab(tab) {
  if (
    tab === null ||
    typeof tab !== 'object' ||
    typeof tab.tab_id !== 'string' ||
    typeof tab.label !== 'string' ||
    !Number.isInteger(tab.number) ||
    tab.number < 1
  ) {
    throw new HerdrCommandError('Herdr returned an invalid tab');
  }
}

export function syncTab(tab, client) {
  assertTab(tab);
  const nextLabel = formatTabLabel(tab.label, tab.number);

  if (nextLabel === tab.label) {
    return false;
  }

  client.renameTab(tab.tab_id, nextLabel);
  return true;
}

export function syncAllTabs(client) {
  let changed = 0;

  for (const workspace of client.listWorkspaces()) {
    if (
      workspace === null ||
      typeof workspace !== 'object' ||
      typeof workspace.workspace_id !== 'string'
    ) {
      throw new HerdrCommandError('Herdr returned an invalid workspace');
    }

    for (const tab of client.listTabs(workspace.workspace_id)) {
      changed += Number(syncTab(tab, client));
    }
  }

  return changed;
}

function tabIdFromEventJson(eventJson) {
  if (!eventJson) {
    return undefined;
  }

  let event;
  try {
    event = JSON.parse(eventJson);
  } catch (error) {
    throw new HerdrCommandError('HERDR_PLUGIN_EVENT_JSON contains malformed JSON', {
      cause: error,
    });
  }

  const data = event?.data;
  return data?.tab_id ?? data?.tab?.tab_id;
}

export function runPlugin(env = process.env, { client = createHerdrClient() } = {}) {
  if (!tabEvents.has(env.HERDR_PLUGIN_EVENT)) {
    return syncAllTabs(client);
  }

  const tabId = env.HERDR_TAB_ID ?? tabIdFromEventJson(env.HERDR_PLUGIN_EVENT_JSON);
  if (!tabId) {
    throw new HerdrCommandError(`${env.HERDR_PLUGIN_EVENT} did not include a tab id`);
  }

  try {
    return Number(syncTab(client.getTab(tabId), client));
  } catch (error) {
    if (error instanceof HerdrCommandError && error.code === 'tab_not_found') {
      return 0;
    }
    throw error;
  }
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  try {
    const changed = runPlugin();
    process.stdout.write(`Tab numbers synchronized (${changed} changed)\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Tab number synchronization failed: ${message}\n`);
    process.exitCode = 1;
  }
}
