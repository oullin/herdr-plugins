const controlC = 0x03;
const escape = 0x1b;

export class PanelCloseShortcut {
	accept(input: Uint8Array): boolean {
		for (const byte of input) {
			if (byte === escape || byte === controlC) {
				return true;
			}
		}

		return false;
	}
}
