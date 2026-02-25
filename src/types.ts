/**
 * Defines the structure of the plugin's settings
 *
 * - enabled: Whether the focus effect is currently active
 * - focusBandVh: The height of the clear, focused area in viewport-height units (vh)
 * - focusIntensity: How aggressively the unfocused text fades or blurs
 * - focusEffect: The visual effect applied to unfocused text
 * - focusMode: How the focus target is determined
 */
export interface FocusLensSettings {
	enabled: boolean;
	focusBandVh: number;
	focusIntensity: number;
	focusEffect?: "blur" | "opacity";
	focusMode?: "center" | "click";
}
