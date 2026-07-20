import { KEYBINDING_PROFILE, TOGGLE_ACTION_ID } from '#tmux-keybindings/domain/keybinding-profile';
import type { ConfigurationEdit, ConfigurationSnapshot } from '#tmux-keybindings/domain/models';

interface CommandBlock {
	readonly start: number;
	readonly end: number;
	readonly text: string;
	readonly key: string | undefined;
	readonly command: string | undefined;
}

const tableHeaderPattern = /^\s*\[.+\]\s*(?:#.*)?$/u;
const keysHeaderPattern = /^\s*\[keys\]\s*(?:#.*)?$/u;
const commandHeaderPattern = /^\s*\[\[keys\.command\]\]\s*(?:#.*)?$/u;
const toggleChord = 'prefix+/';

export class KeybindingConfigEditor {
	apply(source: string, configPath: string): ConfigurationEdit {
		const sourceLines = source.split('\n');
		const keysSection = this.keysSection(sourceLines);
		const assignments: Record<string, string | null> = {};

		for (const binding of KEYBINDING_PROFILE) {
			assignments[binding.key] = this.assignmentLine(sourceLines, keysSection, binding.key) ?? null;
		}

		const commandBlocks = this.commandBlocks(sourceLines);
		const managedCommandBlocks = commandBlocks.filter((block) => block.key === toggleChord || block.command === TOGGLE_ACTION_ID);

		const displacedCommands = managedCommandBlocks.filter((block) => block.key === toggleChord && block.command !== TOGGLE_ACTION_ID).map((block) => ({ line: block.start, text: block.text }));

		let lines = this.removeCommandBlocks(sourceLines, managedCommandBlocks);

		lines = this.applyAssignments(lines);
		lines = this.appendManagedCommand(lines);

		return {
			content: lines.join('\n'),
			snapshot: {
				version: 2,
				configPath,
				keysSectionExisted: keysSection !== undefined,
				assignments,
				displacedCommands,
			},
		};
	}

	mergeSnapshots(saved: ConfigurationSnapshot | undefined, discovered: ConfigurationSnapshot): ConfigurationSnapshot {
		if (!saved) {
			return discovered;
		}

		return {
			version: 2,
			configPath: saved.configPath,
			keysSectionExisted: saved.keysSectionExisted,
			assignments: saved.assignments,
			displacedCommands: [...saved.displacedCommands.filter((command) => !this.isPluginCommand(command.text)), ...discovered.displacedCommands],
		};
	}

	restore(source: string, snapshot: ConfigurationSnapshot): string {
		let lines = source.split('\n');

		const commandBlocks = this.commandBlocks(lines);

		lines = this.removeCommandBlocks(
			lines,
			commandBlocks.filter((block) => block.command === TOGGLE_ACTION_ID),
		);
		lines = this.restoreAssignments(lines, snapshot);

		if (!snapshot.keysSectionExisted) {
			lines = this.removeEmptyKeysSection(lines);
		}

		for (const command of snapshot.displacedCommands.filter((candidate) => !this.isPluginCommand(candidate.text)).sort((left, right) => left.line - right.line)) {
			const insertion = Math.min(command.line, lines.length);
			const commandLines = command.text.split('\n');
			const replaceSeparator = commandLines.at(-1) === '' && lines[insertion]?.trim() === '' ? 1 : 0;

			lines.splice(insertion, replaceSeparator, ...commandLines);
		}

		return lines.join('\n');
	}

	private applyAssignments(sourceLines: readonly string[]): string[] {
		const lines = [...sourceLines];

		let section = this.keysSection(lines);

		if (!section) {
			while (lines.at(-1)?.trim() === '') {
				lines.pop();
			}

			if (lines.length > 0) {
				lines.push('');
			}

			lines.push('[keys]');
			section = { start: lines.length - 1, end: lines.length };
		}

		const missing: string[] = [];

		for (const binding of KEYBINDING_PROFILE) {
			const index = this.assignmentIndex(lines, section, binding.key);

			if (index === undefined) {
				missing.push(this.canonicalAssignment(binding.key, binding.value));
				continue;
			}

			lines[index] = this.replaceAssignment(lines[index] ?? '', binding.key, binding.value);
		}

		lines.splice(section.end, 0, ...missing);

		return lines;
	}

	private restoreAssignments(sourceLines: readonly string[], snapshot: ConfigurationSnapshot): string[] {
		const lines = [...sourceLines];

		let section = this.keysSection(lines);

		if (!section) {
			const originals = KEYBINDING_PROFILE.flatMap((binding) => {
				const assignment = snapshot.assignments[binding.key];

				return assignment === null || assignment === undefined ? [] : [assignment];
			});

			if (originals.length === 0) {
				return lines;
			}

			lines.push(...(lines.at(-1)?.trim() === '' ? [] : ['']), '[keys]', ...originals);
			section = this.keysSection(lines);
		}

		if (!section) {
			return lines;
		}

		const missing: string[] = [];

		for (const binding of KEYBINDING_PROFILE) {
			const index = this.assignmentIndex(lines, section, binding.key);
			const original = snapshot.assignments[binding.key];

			if (original === null || original === undefined) {
				if (index !== undefined) {
					lines.splice(index, 1);
					section = { start: section.start, end: section.end - 1 };
				}

				continue;
			}

			if (index === undefined) {
				missing.push(original);
			} else {
				lines[index] = original;
			}
		}

		lines.splice(section.end, 0, ...missing);

		return lines;
	}

	private removeEmptyKeysSection(sourceLines: readonly string[]): string[] {
		const lines = [...sourceLines];
		const section = this.keysSection(lines);

		if (!section) {
			return lines;
		}

		const hasContent = lines.slice(section.start + 1, section.end).some((line) => {
			const trimmed = line?.trim() ?? '';

			return trimmed !== '' && !trimmed.startsWith('#');
		});

		if (!hasContent) {
			lines.splice(section.start, section.end - section.start);
		}

		return lines;
	}

	private appendManagedCommand(sourceLines: readonly string[]): string[] {
		return this.appendBlock(sourceLines, [
			'[[keys.command]]',
			`key = "${toggleChord}"`,
			'type = "plugin_action"',
			`command = "${TOGGLE_ACTION_ID}"`,
			'description = "toggle tmux keybinding panel"',
		]);
	}

	private isPluginCommand(text: string): boolean {
		return this.stringValue(text.split('\n'), 'command') === TOGGLE_ACTION_ID;
	}

	private appendBlock(sourceLines: readonly string[], block: readonly string[]): string[] {
		const lines = this.finish(sourceLines);

		if (lines.length > 0) {
			lines.push('');
		}

		lines.push(...block, '');

		return lines;
	}

	private finish(sourceLines: readonly string[]): string[] {
		const lines = [...sourceLines];

		while (lines.at(-1)?.trim() === '') {
			lines.pop();
		}

		return lines;
	}

	private removeCommandBlocks(sourceLines: readonly string[], blocks: readonly CommandBlock[]): string[] {
		const lines = [...sourceLines];

		for (const block of [...blocks].sort((left, right) => right.start - left.start)) {
			lines.splice(block.start, block.end - block.start);
		}

		return lines;
	}

	private commandBlocks(lines: readonly string[]): readonly CommandBlock[] {
		const blocks: CommandBlock[] = [];

		for (let index = 0; index < lines.length; index += 1) {
			if (!commandHeaderPattern.test(lines[index] ?? '')) {
				continue;
			}

			let end = index + 1;

			while (end < lines.length && !tableHeaderPattern.test(lines[end] ?? '')) {
				end += 1;
			}

			const blockLines = lines.slice(index, end);

			blocks.push({
				start: index,
				end,
				text: blockLines.join('\n'),
				key: this.stringValue(blockLines, 'key'),
				command: this.stringValue(blockLines, 'command'),
			});
			index = end - 1;
		}

		return blocks;
	}

	private stringValue(lines: readonly string[], key: string): string | undefined {
		const pattern = new RegExp(`^\\s*${key}\\s*=\\s*(["'])(.*?)\\1(?:\\s*#.*)?$`, 'u');

		for (const line of lines) {
			const match = pattern.exec(line ?? '');

			if (match?.[2] !== undefined) {
				return match[2];
			}
		}

		return undefined;
	}

	private keysSection(lines: readonly string[]): { readonly start: number; readonly end: number } | undefined {
		const start = lines.findIndex((line) => keysHeaderPattern.test(line ?? ''));

		if (start < 0) {
			return undefined;
		}

		let end = start + 1;

		while (end < lines.length && !tableHeaderPattern.test(lines[end] ?? '')) {
			end += 1;
		}

		return { start, end };
	}

	private assignmentLine(lines: readonly string[], section: { readonly start: number; readonly end: number } | undefined, key: string): string | undefined {
		if (!section) {
			return undefined;
		}

		const index = this.assignmentIndex(lines, section, key);

		return index === undefined ? undefined : lines[index];
	}

	private assignmentIndex(lines: readonly string[], section: { readonly start: number; readonly end: number }, key: string): number | undefined {
		const pattern = new RegExp(`^\\s*${key}\\s*=`, 'u');

		for (let index = section.start + 1; index < section.end; index += 1) {
			if (pattern.test(lines[index] ?? '')) {
				return index;
			}
		}

		return undefined;
	}

	private replaceAssignment(line: string, key: string, value: string): string {
		const indentation = /^\s*/u.exec(line)?.[0] ?? '';
		const commentIndex = this.commentIndex(line);
		const comment = commentIndex === undefined ? '' : ` ${line.slice(commentIndex).trimStart()}`;

		return `${indentation}${this.canonicalAssignment(key, value)}${comment}`;
	}

	private canonicalAssignment(key: string, value: string): string {
		return `${key} = ${JSON.stringify(value)}`;
	}

	private commentIndex(line: string): number | undefined {
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
				return index;
			}

			escaped = false;
		}

		return undefined;
	}
}
