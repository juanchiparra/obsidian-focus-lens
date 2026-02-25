import type { FocusLensSettings } from "./types";

/**
 * Default settings applied when the plugin is first installed or reset
 */
export const DEFAULT_SETTINGS: FocusLensSettings = {
	enabled: true,
	focusBandVh: 22,
	focusIntensity: 2.2,
	focusEffect: "blur",
	focusMode: "center",
};

/**
 * CSS selector used to find blocks that can be focused.
 */
export const FOCUS_SELECTOR =
	"p, h1, h2, h3, h4, h5, h6, blockquote, li, table, pre, .callout";
