import { Plugin } from "obsidian";
import { FocusLensSettingTab } from "./settings";
import type { FocusLensSettings } from "./types";
import { DEFAULT_SETTINGS } from "./constants";
import { registerUIAndCommands } from "./commands";
import { FocusRenderer } from "./focus-renderer";
import { ZenModeManager } from "./zen-mode";
import { setFocusEnabled } from "./actions";

export default class FocusLensPlugin extends Plugin {
	settings: FocusLensSettings;
	focusRenderer: FocusRenderer;
	zenMode: ZenModeManager;

	/**
	 * Runs when the plugin is activated
	 * Sets up the user interface, commands, and event listeners
	 */
	async onload() {
		await this.loadSettings();

		this.zenMode = new ZenModeManager();
		this.focusRenderer = new FocusRenderer(this);

		this.zenMode.ensureZenToggleButton();
		this.zenMode.syncZenButtonState();

		// Register user interface elements and Command Palette commands
		registerUIAndCommands(this);

		this.addSettingTab(new FocusLensSettingTab(this.app, this));

		// Use Obsidian's registerDomEvent to ensure cleanup on unload
		this.registerDomEvent(window, "resize", () =>
			this.focusRenderer.onWindowChange(),
		);

		// Observe workspace to detect active view changes
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () =>
				this.focusRenderer.checkActiveView(),
			),
		);
		this.registerEvent(
			this.app.workspace.on("layout-change", () =>
				this.focusRenderer.checkActiveView(),
			),
		);

		this.focusRenderer.checkActiveView();

		setFocusEnabled(this, this.settings.enabled);
		this.focusRenderer.updateCssVars();
	}

	/**
	 * Runs when the plugin is disabled
	 * Cleans up all DOM modifications and event listeners
	 */
	onunload() {
		this.focusRenderer.detachActiveView();
		this.zenMode.cleanup();
	}

	/**
	 * Loads the plugin settings from Obsidian's data store
	 */
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<FocusLensSettings>,
		);
	}

	/**
	 * Saves the current plugin settings to Obsidian's data store
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
