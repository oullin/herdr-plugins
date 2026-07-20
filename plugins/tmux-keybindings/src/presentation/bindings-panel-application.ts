import type { BindingsPanelRenderer } from '#tmux-keybindings/presentation/bindings-panel-renderer';

export class BindingsPanelApplication {
	private readonly renderer: BindingsPanelRenderer;

	constructor(renderer: BindingsPanelRenderer) {
		this.renderer = renderer;
	}

	run(): void {
		const render = (): void => {
			const width = process.stdout.columns ?? 48;
			const height = process.stdout.rows ?? 24;

			process.stdout.write(`\u001B[2J\u001B[H\u001B[?25l${this.renderer.render(width, height)}`);
		};
		const finish = (): void => {
			process.stdout.write('\u001B[?25h');
			process.exit(0);
		};

		process.stdout.write('\u001B]0;Tmux keybindings\u0007');
		render();
		process.on('SIGWINCH', render);
		process.on('SIGINT', finish);
		process.on('SIGTERM', finish);
		process.stdin.resume();
	}
}
