import type { PaneNavigationBindings } from '#pane-navigation-hints/domain/models';

const titleLimit = 80;
const separator = ' · ';

const keyLabels: Readonly<Record<string, string>> = {
	alt: 'Alt',
	cmd: 'Cmd',
	control: 'Ctrl',
	ctrl: 'Ctrl',
	down: '↓',
	enter: 'Enter',
	esc: 'Esc',
	left: '←',
	right: '→',
	shift: 'Shift',
	super: 'Super',
	tab: 'Tab',
	up: '↑',
};

export class NavigationHintFormatter {
	format(bindings: PaneNavigationBindings): string {
		const segments = [this.focusSegment(bindings), this.cycleSegment(bindings), bindings.lastPane === '' ? undefined : `Last ${this.renderBinding(bindings.lastPane, bindings.prefix)}`].filter(
			(segment): segment is string => segment !== undefined,
		);

		const title = segments.length === 0 ? 'Pane navigation is unbound' : segments.join(separator);

		return this.truncate(title);
	}

	private focusSegment(bindings: PaneNavigationBindings): string | undefined {
		const directional = [
			{ direction: '←', binding: bindings.focusPaneLeft },
			{ direction: '↓', binding: bindings.focusPaneDown },
			{ direction: '↑', binding: bindings.focusPaneUp },
			{ direction: '→', binding: bindings.focusPaneRight },
		].filter(({ binding }) => binding !== '');

		if (directional.length === 0) {
			return undefined;
		}

		if (directional.length === 4) {
			const collapsed = this.collapseBindings(
				directional.map(({ binding }) => binding),
				bindings.prefix,
			);

			if (collapsed !== undefined) {
				return `←↓↑→ ${collapsed}`;
			}
		}

		return directional.map(({ direction, binding }) => `${direction} ${this.renderBinding(binding, bindings.prefix)}`).join(' ');
	}

	private cycleSegment(bindings: PaneNavigationBindings): string | undefined {
		const cycleBindings = [bindings.cyclePaneNext, bindings.cyclePanePrevious].filter((binding) => binding !== '');

		if (cycleBindings.length === 0) {
			return undefined;
		}

		if (cycleBindings.length === 2) {
			const collapsed = this.collapseBindings(cycleBindings, bindings.prefix);

			if (collapsed !== undefined) {
				return `N/P ${collapsed}`;
			}
		}

		const labels = [
			bindings.cyclePaneNext === '' ? undefined : `N ${this.renderBinding(bindings.cyclePaneNext, bindings.prefix)}`,
			bindings.cyclePanePrevious === '' ? undefined : `P ${this.renderBinding(bindings.cyclePanePrevious, bindings.prefix)}`,
		].filter((label): label is string => label !== undefined);

		return labels.join(' ');
	}

	private collapseBindings(bindings: readonly string[], prefix: string): string | undefined {
		const parts = bindings.map((binding) => binding.split('+'));
		const sharedHead = parts[0]?.[0];

		if (!sharedHead || parts.some((bindingParts) => bindingParts.length < 2 || bindingParts[0] !== sharedHead)) {
			return undefined;
		}

		const renderedHead = sharedHead === 'prefix' ? this.renderPrefix(prefix) : this.renderKey(sharedHead);

		const tails = parts.map((bindingParts) =>
			bindingParts
				.slice(1)
				.map((part) => this.renderKey(part))
				.join('+'),
		);

		return [renderedHead, tails.join('/')].filter(Boolean).join('+');
	}

	private renderBinding(binding: string, prefix: string): string {
		const parts = binding.split('+');

		if (parts[0] === 'prefix') {
			return [this.renderPrefix(prefix), ...parts.slice(1).map((part) => this.renderKey(part))].filter(Boolean).join('+');
		}

		return parts.map((part) => this.renderKey(part)).join('+');
	}

	private renderPrefix(prefix: string): string {
		const parts = prefix.split('+').map((part) => this.renderKey(part));
		const final = parts.at(-1);

		if (final?.length === 1) {
			parts[parts.length - 1] = final.toUpperCase();
		}

		return parts.join('+');
	}

	private renderKey(key: string): string {
		return keyLabels[key.toLowerCase()] ?? key;
	}

	private truncate(title: string): string {
		const characters = Array.from(title);

		return characters.length <= titleLimit ? title : `${characters.slice(0, titleLimit - 1).join('')}…`;
	}
}
