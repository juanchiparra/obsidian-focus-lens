import { MarkdownView } from "obsidian";
import type FocusLensPlugin from "./main";
import { FOCUS_SELECTOR } from "./constants";
import { findNearestBlock, clearLineStyles } from "./utils";

export class FocusRenderer {
	private plugin: FocusLensPlugin;

	// View state
	private activeView: HTMLElement | null = null;
	private activeScrollEl: HTMLElement | null = null;
	private activeEls: HTMLElement[] = [];
	private activeMode: "preview" | "editor" | null = null;
	private viewObserver: MutationObserver | null = null;

	// Click mode state
	private lastClickY: number | null = null;
	private lastClickEl: HTMLElement | null = null;

	// Render state
	private ticking = false;
	private introMode = true;
	private smoothedRefY: number | null = null;
	private forceSnapRef = false;
	private elementsDirty = true;

	// Event handlers
	private onScrollHandler: ((e: Event) => void) | null = null;
	private onClickHandler: ((e: MouseEvent) => void) | null = null;

	constructor(plugin: FocusLensPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Sets initial focus to the first visible block in click mode
	 */
	private seedClickFocus() {
		if (this.plugin.settings.focusMode !== "click") return;
		if (this.lastClickEl?.isConnected) return;
		const first = this.activeEls.find((el) => {
			const r = el.getBoundingClientRect();
			return r.height > 6;
		});
		if (first) {
			const fr = first.getBoundingClientRect();
			this.lastClickEl = first;
			this.lastClickY = fr.top + fr.height / 2;
		}
	}

	public getActiveEls(): HTMLElement[] {
		return this.activeEls;
	}

	public getActiveView(): HTMLElement | null {
		return this.activeView;
	}

	public getLastClickEl(): HTMLElement | null {
		return this.lastClickEl;
	}

	public getSmoothedRefY(): number | null {
		return this.smoothedRefY;
	}

	public setLastClick(el: HTMLElement, y: number | null) {
		this.lastClickEl = el;
		this.lastClickY = y;
	}

	public triggerUpdate() {
		this.schedule();
	}

	/**
	 * Updates CSS variables based on current settings
	 */
	public updateCssVars() {
		document.documentElement.style.setProperty(
			"--focus-band",
			`${this.plugin.settings.focusBandVh}vh`,
		);
	}

	/**
	 * Re-attaches the plugin if the active workspace leaf changes
	 */
	public checkActiveView() {
		if (!this.plugin.settings.enabled) return;

		// Find the active markdown view
		const activeView =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView);

		let target: HTMLElement | null = null;

		if (activeView) {
			const contentEl = activeView.contentEl;
			const preview = contentEl.querySelector(".markdown-preview-view");
			const editorRoot = contentEl.querySelector(".markdown-source-view");
			const editorScroller = editorRoot?.querySelector(".cm-scroller");
			const editorFallback = contentEl.querySelector(
				".cm-editor, .cm-content",
			);

			// Check visibility simply by checking if it has offsetParent
			if (preview && (preview as HTMLElement).offsetParent !== null)
				target = preview as HTMLElement;
			else if (
				editorScroller &&
				(editorScroller as HTMLElement).offsetParent !== null
			)
				target = editorScroller as HTMLElement;
			else if (
				editorRoot &&
				(editorRoot as HTMLElement).offsetParent !== null
			)
				target = editorRoot as HTMLElement;
			else if (
				editorFallback &&
				(editorFallback as HTMLElement).offsetParent !== null
			)
				target = editorFallback as HTMLElement;
		}

		// If the newly active leaf is NOT a markdown view (e.g., user clicked the sidebar)
		if (!target) {
			// Keep the current view active if it's still visible
			if (this.activeView && this.activeView.offsetParent !== null) {
				return;
			}
			this.detachActiveView();
			return;
		}

		if (target !== this.activeView) {
			this.detachActiveView();
			this.attachToView(target);
		}
	}

	/**
	 * Sets up listeners and observers for the active view
	 */
	private attachToView(view: HTMLElement) {
		this.activeView = view;
		this.introMode = true;
		this.smoothedRefY = null;
		this.forceSnapRef = false;

		// Determine mode: preview vs editor
		if (
			view.classList.contains("markdown-preview-view") ||
			view.querySelector(".markdown-preview-view")
		) {
			this.activeMode = "preview";
			this.activeEls = Array.from(view.querySelectorAll(FOCUS_SELECTOR));
		} else {
			this.activeMode = "editor";
			// Prefer CodeMirror line elements and widgets
			this.activeEls = Array.from(
				view.querySelectorAll(".cm-line, .cm-embed-block"),
			);
			if (this.activeEls.length === 0) {
				// Fallback to lines inside .cm-content
				this.activeEls = Array.from(
					view.querySelectorAll(
						".cm-content .cm-line, .cm-content .cm-embed-block",
					),
				);
			}
		}

		// Seed focus from first visible block if in click mode
		this.seedClickFocus();

		// Scroll listener
		const scrollEl =
			this.activeMode === "editor"
				? (view.querySelector(".cm-scroller") as HTMLElement | null) ||
					view
				: view;
		this.activeScrollEl = scrollEl;
		const onScroll = () => {
			if (this.activeScrollEl && this.activeScrollEl.scrollTop > 30) {
				this.introMode = false;
			}
			this.elementsDirty = true;
			this.schedule();
		};
		scrollEl.addEventListener("scroll", onScroll, { passive: true });

		// Click listener to set focus reference
		const onClick = (e: MouseEvent) => {
			this.lastClickY = e.clientY;
			const target = e.target as HTMLElement | null;
			if (this.activeMode === "preview") {
				this.lastClickEl = target?.closest(
					FOCUS_SELECTOR,
				) as HTMLElement | null;
			} else {
				this.lastClickEl = target?.closest(
					".cm-line, .cm-embed-block",
				) as HTMLElement | null;
			}
			// Fallback: snap to nearest block at click position
			if (!this.lastClickEl && this.activeEls.length) {
				const nearest = findNearestBlock(this.activeEls, e.clientY);
				if (nearest) this.lastClickEl = nearest;
			}

			this.schedule();
		};
		view.addEventListener("mousedown", onClick);

		// Mutation observer to refresh elements
		this.viewObserver = new MutationObserver(() => {
			this.elementsDirty = true;
			this.seedClickFocus();
			this.schedule();
		});
		this.viewObserver.observe(view, { childList: true, subtree: true });

		this.onScrollHandler = onScroll;
		this.onClickHandler = onClick;

		this.schedule();
	}

	/**
	 * Cleans up listeners and styles from the active view
	 */
	public detachActiveView() {
		if (!this.activeView) return;
		try {
			if (this.onScrollHandler)
				(this.activeScrollEl || this.activeView).removeEventListener(
					"scroll",
					this.onScrollHandler,
				);
			if (this.onClickHandler)
				this.activeView.removeEventListener(
					"mousedown",
					this.onClickHandler,
				);
		} catch {
			/* ignore */
		}
		this.onScrollHandler = null;
		this.onClickHandler = null;
		if (this.viewObserver) {
			this.viewObserver.disconnect();
			this.viewObserver = null;
		}
		// Cleanup inline styles
		if (this.activeEls.length) {
			this.activeEls.forEach((el) => {
				clearLineStyles(el);
			});
		}
		this.activeView = null;
		this.activeScrollEl = null;
		this.activeEls = [];
		this.activeMode = null;
		this.smoothedRefY = null;
		this.forceSnapRef = false;
		// Keep lastClickY across view switches, but clear the DOM element
		this.lastClickEl = null;
	}

	/**
	 * Repositions the focus overlay on window resize
	 */
	public onWindowChange() {
		this.schedule();
	}

	/**
	 * Refreshes the user interface and focus effect
	 */
	public refresh() {
		if (this.plugin.settings.focusMode === "click") {
			this.seedClickFocus();
		}
		this.schedule();
	}

	/**
	 * Schedules a new animation frame for the render loop
	 */
	private schedule() {
		if (!this.plugin.settings.enabled) return;
		if (!this.ticking) {
			this.ticking = true;
			requestAnimationFrame(() => this.update());
		}
	}

	/**
	 * Core render loop. Calculates distances and applies CSS styles
	 */
	private update() {
		this.ticking = false;
		if (!this.activeView) return;
		const viewRect = this.activeView.getBoundingClientRect();
		const center = viewRect.top + viewRect.height / 2;

		// Re-query visible lines if dirty
		if (this.elementsDirty) {
			if (this.activeMode === "editor" && this.activeView) {
				this.activeEls = Array.from(
					this.activeView.querySelectorAll(
						".cm-line, .cm-embed-block, .cm-content .cm-line, .cm-content .cm-embed-block",
					),
				);
			} else if (this.activeMode === "preview" && this.activeView) {
				this.activeEls = Array.from(
					this.activeView.querySelectorAll(FOCUS_SELECTOR),
				);
			}
			this.elementsDirty = false;
		}
		const els = this.activeEls;

		// Compute band in pixels
		const rootStyle = getComputedStyle(document.documentElement);
		const bandVal =
			rootStyle.getPropertyValue("--focus-band").trim() ||
			`${this.plugin.settings.focusBandVh}vh`;
		let bandPx: number | null = null;
		if (bandVal.endsWith("vh")) {
			const num =
				parseFloat(bandVal.replace("vh", "")) ||
				this.plugin.settings.focusBandVh;
			bandPx = window.innerHeight * (num / 100);
		} else if (bandVal.endsWith("px")) {
			bandPx = parseFloat(bandVal.replace("px", "")) || null;
		} else {
			const n = parseFloat(bandVal);
			if (!Number.isNaN(n)) bandPx = n;
		}
		const maxD = Math.max(bandPx || window.innerHeight * 0.45, 40);
		let refY = center;
		if (this.plugin.settings.focusMode === "click") {
			if (this.lastClickEl?.isConnected) {
				const cr = this.lastClickEl.getBoundingClientRect();
				refY = cr.top + cr.height / 2;
			} else if (this.lastClickY !== null) {
				// Find nearest block to Y coordinate if element is lost
				const nearest = findNearestBlock(els, this.lastClickY);
				if (nearest) {
					this.lastClickEl = nearest;
					const cr = nearest.getBoundingClientRect();
					refY = cr.top + cr.height / 2;
				} else {
					refY = this.lastClickY;
				}
			} else {
				return; // Wait for click
			}
		} else if (this.plugin.settings.focusMode === "center") {
			const scrollTop = this.activeScrollEl?.scrollTop ?? 0;
			// Blend from first block to center on scroll
			const first = els.find((el) => {
				const r = el.getBoundingClientRect();
				return r.height > 6;
			});
			if (first) {
				const fr = first.getBoundingClientRect();
				const firstY = fr.top + fr.height / 2;
				const t = Math.min(1, Math.max(0, scrollTop / 320));
				refY = firstY * (1 - t) + center * t;
			}
		}

		// Snap to nearest block
		if (els.length) {
			// Ignore empty lines
			const validEls = els.filter((el) => {
				const r = el.getBoundingClientRect();
				const hasText = el.textContent?.trim().length || 0;
				return r.height > 6 && hasText > 0;
			});

			const nearest = findNearestBlock(
				validEls.length ? validEls : els,
				refY,
			);
			if (nearest) {
				const nr = nearest.getBoundingClientRect();
				refY = nr.top + nr.height / 2;
			}
		}

		// Smooth reference position
		if (this.forceSnapRef || this.smoothedRefY === null) {
			this.smoothedRefY = refY;
			this.forceSnapRef = false;
		} else {
			const alpha =
				this.plugin.settings.focusMode === "click" ? 0.25 : 0.15;
			this.smoothedRefY =
				this.smoothedRefY + (refY - this.smoothedRefY) * alpha;
		}

		// Continue animating if needed
		if (Math.abs(this.smoothedRefY - refY) > 0.5) {
			this.schedule();
		}

		const renderRefY = this.smoothedRefY;

		const effect = this.plugin.settings.focusEffect || "blur";

		// Define a clear core band
		const coreBand = maxD * 0.15;

		els.forEach((el) => {
			const rect = el.getBoundingClientRect();
			const elCenter = rect.top + rect.height / 2;

			const d = Math.abs(elCenter - renderRefY);

			// Calculate normalized distance
			let n = 0;
			if (d > coreBand) {
				n = Math.min(1, (d - coreBand) / (maxD - coreBand));
			}

			const intensity = Math.max(
				1,
				Math.min(3.5, this.plugin.settings.focusIntensity || 2.2),
			);

			let weight = (1 - n) ** intensity;
			if (rect.height < 6) weight = 0;

			const opacity = String(0.15 + 0.85 * weight);
			const blur =
				effect === "blur" ? `blur(${1.5 * (1 - weight)}px)` : "";
			const transform = `translateY(${4 * (1 - weight)}px)`;

			try {
				el.style.setProperty("opacity", opacity);
				if (blur) {
					el.style.setProperty("filter", blur);
				} else {
					el.style.removeProperty("filter");
				}
				el.style.setProperty("transform", transform);
				el.style.removeProperty("-webkit-mask-image");
				el.style.removeProperty("mask-image");
			} catch {
				/* ignore */
			}

			// Apply to children
			if (this.activeMode === "editor") {
				Array.from(el.children).forEach((child) => {
					try {
						(child as HTMLElement).style.setProperty(
							"opacity",
							opacity,
						);
						if (blur) {
							(child as HTMLElement).style.setProperty(
								"filter",
								blur,
							);
						} else {
							(child as HTMLElement).style.removeProperty(
								"filter",
							);
						}
						(child as HTMLElement).style.setProperty(
							"transform",
							transform,
						);
					} catch {
						/* ignore */
					}
				});
			}
		});
	}
}
