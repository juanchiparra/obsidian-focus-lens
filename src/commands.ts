import { Notice } from "obsidian";
import type FocusLensPlugin from "./main";
import { navigateFocus, setFocusEnabled } from "./actions";

/**
 * Registers ribbon icons and command palette actions for the plugin.
 */
export function registerUIAndCommands(plugin: FocusLensPlugin) {
	plugin.addRibbonIcon("eye", "Toggle focus mode", () => {
		setFocusEnabled(plugin, !plugin.settings.enabled);
		new Notice(
			plugin.settings.enabled
				? "Focus mode enabled"
				: "Focus mode disabled",
		);
	});

	plugin.addRibbonIcon("maximize", "Toggle zen mode", () => {
		plugin.zenMode.toggleZenMode();
		new Notice(
			document.body.classList.contains("obsidian-focus-zen")
				? "Zen mode enabled"
				: "Zen mode disabled",
		);
	});

	plugin.addCommand({
		id: "toggle-overlay",
		name: "Toggle overlay",
		callback: () => {
			setFocusEnabled(plugin, !plugin.settings.enabled);
			new Notice(
				plugin.settings.enabled
					? "Focus mode enabled"
					: "Focus mode disabled",
			);
		},
	});

	plugin.addCommand({
		id: "toggle-zen",
		name: "Toggle zen mode",
		callback: () => {
			plugin.zenMode.toggleZenMode();
			new Notice(
				document.body.classList.contains("obsidian-focus-zen")
					? "Zen mode enabled"
					: "Zen mode disabled",
			);
		},
	});

	plugin.addCommand({
		id: "next-block",
		name: "Next line/block",
		callback: () => navigateFocus(plugin, 1),
	});

	plugin.addCommand({
		id: "previous-block",
		name: "Previous line/block",
		callback: () => navigateFocus(plugin, -1),
	});
}
