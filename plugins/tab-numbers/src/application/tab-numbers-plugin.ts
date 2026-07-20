import { HerdrCommandError } from '../errors/herdr-command-error.ts';
import { TabNumberSynchronizer } from './tab-number-synchronizer.ts';

type JsonObject = Record<string, unknown>;

export type Environment = Readonly<Record<string, string | undefined>>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
