import type { App, SliderComponent, ToggleComponent } from "obsidian";
import { PluginSettingTab, Setting, debounce } from "obsidian";
import type FocusLensPlugin from "./main";
import { setFocusEnabled } from "./actions";

/**
 * Manages the plugin's settings page
 */
export class FocusLensSettingTab extends PluginSettingTab {
	plugin: FocusLensPlugin;
	private saveSettingsDebounced = debounce(
		() => this.plugin.saveSettings(),
		500,
		true,
	);

	constructor(app: App, plugin: FocusLensPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Builds the user interface for the settings tab
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Master switch to enable or disable the focus effect
		new Setting(containerEl)
			.setName("Enable focus")
			.setDesc("Toggle the focus overlay on/off")
			.addToggle((toggle: ToggleComponent) =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (v) => {
						setFocusEnabled(this.plugin, v);
					}),
			);

		// Slider to adjust the height of the clear, focused area
		const bandSetting = new Setting(containerEl)
			.setName("Focus band (vh)")
			.setDesc(
				`Height of the bright band in viewport-height units (${this.plugin.settings.focusBandVh}vh)`,
			)
			.addSlider((s: SliderComponent) =>
				s
					.setLimits(6, 45, 1)
					.setValue(this.plugin.settings.focusBandVh)
					.onChange(async (v) => {
						this.plugin.settings.focusBandVh = v;
						this.saveSettingsDebounced();
						this.plugin.focusRenderer.updateCssVars();
						bandSetting.setDesc(
							`Height of the bright band in viewport-height units (${v}vh)`,
						);
						this.plugin.focusRenderer.refresh();
					}),
			);

		// Slider to adjust how aggressively the unfocused text fades or blurs
		const intensitySetting = new Setting(containerEl)
			.setName("Focus intensity")
			.setDesc(
				`How strong the focus effect is (${this.plugin.settings.focusIntensity.toFixed(1)})`,
			)
			.addSlider((s: SliderComponent) =>
				s
					.setLimits(1.0, 3.5, 0.1)
					.setValue(this.plugin.settings.focusIntensity)
					.onChange(async (v) => {
						this.plugin.settings.focusIntensity = v;
						this.saveSettingsDebounced();
						intensitySetting.setDesc(
							`How strong the focus effect is (${v.toFixed(1)})`,
						);
						this.plugin.focusRenderer.refresh();
					}),
			);

		// Dropdown to select how the focus target is determined (center vs click)
		new Setting(containerEl)
			.setName("Focus mode")
			.setDesc("Choose how the focus is determined")
			.addDropdown((d) =>
				d
					.addOption("center", "Viewport center (block)")
					.addOption("click", "Click to focus (block)")
					.setValue(this.plugin.settings.focusMode || "center")
					.onChange(async (v) => {
						this.plugin.settings.focusMode = v as
							| "center"
							| "click";
						await this.plugin.saveSettings();
						this.plugin.focusRenderer.refresh();
					}),
			);

		// Dropdown to select the visual effect applied to unfocused text (blur vs opacity)
		new Setting(containerEl)
			.setName("Focus effect")
			.setDesc("Blur the surroundings or dim them with opacity")
			.addDropdown((d) =>
				d
					.addOption("blur", "Blur surroundings")
					.addOption("opacity", "Dim surroundings")
					.setValue(this.plugin.settings.focusEffect || "blur")
					.onChange(async (v) => {
						this.plugin.settings.focusEffect = v as
							| "blur"
							| "opacity";
						await this.plugin.saveSettings();
						this.plugin.focusRenderer.refresh();
					}),
			);
	}
}
