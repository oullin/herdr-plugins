import { PLUGIN_ID } from '#tmux-keybindings/domain/keybinding-profile';
import { PluginStateDirectoryResolver } from '@oullin/herdr-plugin-core';

export class StateDirectoryResolver extends PluginStateDirectoryResolver {
	constructor() {
		super(PLUGIN_ID);
	}
}
