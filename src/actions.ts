import type FocusLensPlugin from "./main";
import { findNearestBlock, clearLineStyles } from "./utils";
import { FOCUS_SELECTOR } from "./constants";

/**
 * Handles keyboard navigation (up/down) to move the focus to the previous or next block.
 */
export function navigateFocus(plugin: FocusLensPlugin, direction: 1 | -1) {
	const renderer = plugin.focusRenderer;
	const activeView = renderer.getActiveView();

	if (
		!plugin.settings.enabled ||
		!renderer.getActiveEls().length ||
		!activeView
	)
		return;

	// Filter out empty or very small elements
	const validEls = renderer.getActiveEls().filter((el) => {
		const r = el.getBoundingClientRect();
		return r.height > 6 && (el.textContent?.trim().length || 0) > 0;
	});

	if (!validEls.length) return;

	const lastClickEl = renderer.getLastClickEl();
	let currentIndex = lastClickEl ? validEls.indexOf(lastClickEl) : -1;

	// Fallback to the block nearest to the center
	if (currentIndex === -1) {
		const viewRect = activeView.getBoundingClientRect();
		const currentY =
			renderer.getSmoothedRefY() ?? viewRect.top + viewRect.height / 2;
		const nearest = findNearestBlock(validEls, currentY);
		currentIndex = nearest ? validEls.indexOf(nearest) : 0;
	}

	currentIndex = Math.max(0, currentIndex);
	const newIndex = Math.max(
		0,
		Math.min(validEls.length - 1, currentIndex + direction),
	);
	const newEl = validEls[newIndex];

	if (!newEl) return;

	const newY =
		plugin.settings.focusMode === "click"
			? newEl.getBoundingClientRect().top +
				newEl.getBoundingClientRect().height / 2
			: null;

	renderer.setLastClick(newEl, newY);
	newEl.scrollIntoView({ block: "center", behavior: "smooth" });
	renderer.triggerUpdate();
}

/**
 * Toggles the focus effect globally
 * Cleans up styles and listeners when disabled
 */
export function setFocusEnabled(plugin: FocusLensPlugin, enabled: boolean) {
	plugin.settings.enabled = enabled;
	if (enabled) {
		// Re-attach to active view if needed
		plugin.focusRenderer.checkActiveView();
		void plugin.saveSettings();
		plugin.focusRenderer.triggerUpdate();
		plugin.zenMode.syncZenButtonState();
		return;
	}

	// Cleanup when disabling
	try {
		plugin.focusRenderer.detachActiveView();
	} catch {
		/* ignore */
	}
	plugin.zenMode.cleanup();

	document.querySelectorAll(".cm-line, .cm-embed-block").forEach((n) => {
		clearLineStyles(n as HTMLElement);
	});
	document.querySelectorAll(FOCUS_SELECTOR).forEach((n) => {
		clearLineStyles(n as HTMLElement);
	});
	document.documentElement.style.removeProperty("--focus-band");
	void plugin.saveSettings();
}
