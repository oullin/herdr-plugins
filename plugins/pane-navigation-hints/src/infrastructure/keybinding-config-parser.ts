import { DEFAULT_PANE_NAVIGATION_BINDINGS, PANE_NAVIGATION_CONFIG_KEYS } from '#pane-navigation-hints/domain/default-keybindings';
import type { PaneNavigationBindings } from '#pane-navigation-hints/domain/models';
import { PluginError } from '#pane-navigation-hints/errors/plugin-error';

const keysHeaderPattern = /^\s*\[keys\]\s*(?:#.*)?$/u;
const tableHeaderPattern = /^\s*\[.+\]\s*(?:#.*)?$/u;
const assignmentPattern = /^\s*([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$/u;

export class KeybindingConfigParser {
	parse(source: string): PaneNavigationBindings {
		const bindings = { ...DEFAULT_PANE_NAVIGATION_BINDINGS };
		const lines = source.split(/\r?\n/u);
		const start = lines.findIndex((line) => keysHeaderPattern.test(line));

		if (start < 0) {
			return bindings;
		}

		for (let index = start + 1; index < lines.length; index += 1) {
			const line = lines[index] ?? '';

			if (tableHeaderPattern.test(line)) {
				break;
			}

			const assignment = assignmentPattern.exec(this.withoutComment(line));

			if (!assignment?.[1] || assignment[2] === undefined) {
				continue;
			}

			const property = PANE_NAVIGATION_CONFIG_KEYS[assignment[1] as keyof typeof PANE_NAVIGATION_CONFIG_KEYS];

			if (property !== undefined) {
				bindings[property] = this.stringValue(assignment[2], assignment[1]);
			}
		}

		return bindings;
	}

	private stringValue(rawValue: string, key: string): string {
		const value = rawValue.trim();

		if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
			try {
				const parsed = JSON.parse(value) as unknown;

				if (typeof parsed === 'string') {
					return parsed;
				}
			} catch (error) {
				throw new PluginError(`Could not parse [keys].${key}`, { cause: error });
			}
		}

		if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
			return value.slice(1, -1);
		}

		throw new PluginError(`[keys].${key} must be a quoted string`);
	}

	private withoutComment(line: string): string {
		let quote: '"' | "'" | undefined;
		let escaped = false;

		for (let index = 0; index < line.length; index += 1) {
			const character = line[index];

			if (quote === '"' && character === '\\' && !escaped) {
				escaped = true;
				continue;
			}

			if ((character === '"' || character === "'") && !escaped) {
				quote = quote === character ? undefined : (quote ?? character);
			} else if (character === '#' && quote === undefined) {
				return line.slice(0, index);
			}

			escaped = false;
		}

		return line;
	}
}
