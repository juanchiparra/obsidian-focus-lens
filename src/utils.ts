/**
 * Finds the HTML element whose vertical center is closest to a given Y-coordinate
 */
export function findNearestBlock(
	els: HTMLElement[],
	refY: number,
): HTMLElement | null {
	let nearest: HTMLElement | null = null;
	let nearestDist = Number.POSITIVE_INFINITY;
	els.forEach((el) => {
		const r = el.getBoundingClientRect();
		const c = r.top + r.height / 2;
		const d = Math.abs(c - refY);
		if (d < nearestDist) {
			nearestDist = d;
			nearest = el;
		}
	});
	return nearest;
}

/**
 * Removes all inline CSS styles applied by the focus effect from an element and its children
 */
export function clearLineStyles(el: HTMLElement) {
	el.style.removeProperty("opacity");
	el.style.removeProperty("filter");
	el.style.removeProperty("transform");
	el.style.removeProperty("-webkit-mask-image");
	el.style.removeProperty("mask-image");

	const children = el.children;
	for (let i = 0; i < children.length; i++) {
		const child = children[i] as HTMLElement;
		child.style.removeProperty("opacity");
		child.style.removeProperty("filter");
		child.style.removeProperty("transform");
	}
}
