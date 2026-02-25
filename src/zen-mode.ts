import { Notice } from "obsidian";

export class ZenModeManager {
	private zenToggleBtnEl: HTMLButtonElement | null = null;

	/**
	 * Ensures the Zen mode exit button is present in the document body
	 * If created, it attaches a click listener to disable Zen mode
	 */
	public ensureZenToggleButton() {
		if (this.zenToggleBtnEl?.isConnected) return;
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "obsidian-focus-zen-toggle";
		btn.setAttribute("aria-label", "Exit zen mode");
		btn.setAttribute("title", "Exit zen mode");
		btn.textContent = "×";
		btn.addEventListener("click", () => {
			if (document.body.classList.contains("obsidian-focus-zen")) {
				this.toggleZenMode();
				new Notice("Zen mode disabled");
			}
		});
		document.body.appendChild(btn);
		this.zenToggleBtnEl = btn;
	}

	/**
	 * Updates the button's accessibility state to match the current Zen mode
	 */
	public syncZenButtonState() {
		if (!this.zenToggleBtnEl) return;
		const zenOn = document.body.classList.contains("obsidian-focus-zen");
		this.zenToggleBtnEl.setAttribute(
			"aria-hidden",
			zenOn ? "false" : "true",
		);
	}

	/**
	 * Toggles Zen mode visibility and updates the exit button state
	 */
	public toggleZenMode() {
		this.ensureZenToggleButton();
		document.body.classList.toggle("obsidian-focus-zen");
		this.syncZenButtonState();
	}

	/**
	 * Cleans up the Zen mode toggle button and CSS class
	 */
	public cleanup() {
		document.body.classList.remove("obsidian-focus-zen");
		if (this.zenToggleBtnEl) {
			this.zenToggleBtnEl.remove();
			this.zenToggleBtnEl = null;
		}
	}
}
