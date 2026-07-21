const controlC = 0x03;
const escape = 0x1b;
const legacyAltT = 0x74;

export class PanelCloseShortcut {
	accept(input: Uint8Array): boolean {
		if (input.length === 1) {
			return input[0] === escape || input[0] === controlC;
		}

		return input.length === 2 && input[0] === escape && input[1] === legacyAltT;
	}
}
