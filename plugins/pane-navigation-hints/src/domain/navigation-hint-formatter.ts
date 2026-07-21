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
		const usesSharedPrefix = this.usesSharedPrefix(bindings);
		const displayBindings = usesSharedPrefix ? this.withoutBindingPrefixes(bindings) : bindings;

		const segments = [this.focusSegment(displayBindings), displayBindings.lastPane === '' ? undefined : `Last ${this.renderBinding(displayBindings.lastPane, displayBindings.prefix)}`].filter(
			(segment): segment is string => segment !== undefined,
		);

		const legend = segments.join(separator);
		const title = segments.length === 0 ? 'Pane focus is unbound' : usesSharedPrefix ? `${this.renderPrefix(bindings.prefix)} then ${legend}` : legend;

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
			const directions = directional.map(({ direction }) => direction).join('/');

			const collapsed = this.renderBindingList(
				directional.map(({ binding }) => binding),
				bindings.prefix,
			);

			return collapsed === directions ? directions : `${directions} ${collapsed}`;
		}

		return directional.map(({ direction, binding }) => `${direction} ${this.renderBinding(binding, bindings.prefix)}`).join(' ');
	}

	private renderBindingList(bindings: readonly string[], prefix: string): string {
		return this.collapseBindings(bindings, prefix) ?? bindings.map((binding) => this.renderBinding(binding, prefix)).join('/');
	}

	private usesSharedPrefix(bindings: PaneNavigationBindings): boolean {
		const actions = [bindings.focusPaneLeft, bindings.focusPaneDown, bindings.focusPaneUp, bindings.focusPaneRight, bindings.lastPane].filter((binding) => binding !== '');

		return bindings.prefix !== '' && actions.length > 0 && actions.every((binding) => binding.startsWith('prefix+') && binding.length > 'prefix+'.length);
	}

	private withoutBindingPrefixes(bindings: PaneNavigationBindings): PaneNavigationBindings {
		const withoutPrefix = (binding: string): string => (binding === '' ? '' : binding.slice('prefix+'.length));

		return {
			prefix: '',
			focusPaneLeft: withoutPrefix(bindings.focusPaneLeft),
			focusPaneDown: withoutPrefix(bindings.focusPaneDown),
			focusPaneUp: withoutPrefix(bindings.focusPaneUp),
			focusPaneRight: withoutPrefix(bindings.focusPaneRight),
			cyclePaneNext: withoutPrefix(bindings.cyclePaneNext),
			cyclePanePrevious: withoutPrefix(bindings.cyclePanePrevious),
			lastPane: withoutPrefix(bindings.lastPane),
		};
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
