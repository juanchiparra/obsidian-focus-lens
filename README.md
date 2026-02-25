# Obsidian Focus Lens

A distraction-free reading and writing experience for Obsidian. Focus Lens highlights the active paragraph or block you are currently reading/writing and gently fades or blurs the rest of the document.

## Features

- **Dynamic focus**: Automatically tracks your scroll position or cursor to keep the active block in focus
- **Live Preview & Reading Mode support**: Works with standard text, tables, callouts, and other widgets in both editing and reading views
- **Two focus modes**:
    - **Viewport center**: The focus is always locked to the center of your screen
    - **Click to focus**: The focus follows the paragraph you click on or navigate to with your keyboard
- **Customizable effects**: Choose between a smooth blur effect or a simple opacity dimming for the unfocused text
- **Zen Mode**: Toggle a completely distraction-free user interface (hides sidebars and ribbons) with a single command

## Installation (Beta)

_Note: The plugin is currently in beta and not yet available in the community store or releases page._

To test it locally:

1. Clone or download this repository
2. Run `pnpm install` and `pnpm run build`
3. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/obsidian-focus-lens/` folder
4. Reload Obsidian and enable **Focus Lens** in **Settings → Community plugins**

## Pre-Release Checklist

Pending tasks before the first official release:

- [ ] Test across different operating systems and devices (desktop/mobile)
- [ ] Verify compatibility with popular themes and other plugins
- [ ] Hunt for edge-case bugs in Live Preview and Reading Mode
- [ ] Monitor CPU/Performance impact during fast scrolling or in very large notes
- [ ] Add screenshots or a GIF demonstrating the plugin in action
- [ ] Finalize versioning and release assets

## Usage

- Use the **eye icon** in the left ribbon to quickly toggle the focus overlay on or off
- Use the **maximize icon** in the left ribbon to toggle Zen mode
- Open the Command Palette (`Ctrl/Cmd + P`) to access:
    - `Toggle overlay`: Turns the focus effect on/off
    - `Toggle zen mode`: Hides the Obsidian UI for maximum focus. When active, a floating '×' button appears to easily exit the mode
    - `Next line/block` & `Previous line/block`: Navigate focus manually (great for "Click to focus" mode)

## Settings

- **Enable focus**: Master switch for the plugin
- **Focus band (vh)**: Adjusts the height of the clear, focused area in the center
- **Focus intensity**: Controls how aggressively the unfocused text fades or blurs
- **Focus mode**: Choose between "Viewport center" and "Click to focus"
- **Focus effect**: Choose between "Blur surroundings" and "Dim surroundings" (opacity only)
