import Yoga from 'yoga-layout';
import { getScrollLeft, getScrollTop } from './scroll.js';
/**
Measure the dimensions of a particular `<Box>` element.
*/
const measureElement = (node) => ({
    width: node.yogaNode?.getComputedWidth() ?? 0,
    height: node.yogaNode?.getComputedHeight() ?? 0,
});
/**
 * Get an element's inner width.
 */
export const getInnerWidth = (node) => {
    const { yogaNode } = node;
    if (!yogaNode) {
        return 0;
    }
    const width = yogaNode.getComputedWidth() ?? 0;
    const borderLeft = yogaNode.getComputedBorder(Yoga.EDGE_LEFT);
    const borderRight = yogaNode.getComputedBorder(Yoga.EDGE_RIGHT);
    return width - borderLeft - borderRight;
};
/*
 * Get an element's inner height.
 */
export const getInnerHeight = (node) => {
    const { yogaNode } = node;
    if (!yogaNode) {
        return 0;
    }
    const height = yogaNode.getComputedHeight() ?? 0;
    const borderTop = yogaNode.getComputedBorder(Yoga.EDGE_TOP);
    const borderBottom = yogaNode.getComputedBorder(Yoga.EDGE_BOTTOM);
    return height - borderTop - borderBottom;
};
/**
 * Get an element's position and dimensions relative to the root.
 */
export const getBoundingBox = (node) => {
    const { yogaNode } = node;
    if (!yogaNode) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    const width = yogaNode.getComputedWidth() ?? 0;
    const height = yogaNode.getComputedHeight() ?? 0;
    let x = yogaNode.getComputedLeft();
    let y = yogaNode.getComputedTop();
    let parent = node.parentNode;
    while (parent?.yogaNode) {
        x += parent.yogaNode.getComputedLeft();
        y += parent.yogaNode.getComputedTop();
        if (parent.nodeName === 'ink-box') {
            const overflow = parent.style.overflow ?? 'visible';
            const overflowX = parent.style.overflowX ?? overflow;
            const overflowY = parent.style.overflowY ?? overflow;
            if (overflowY === 'scroll') {
                y -= getScrollTop(parent);
            }
            if (overflowX === 'scroll') {
                x -= getScrollLeft(parent);
            }
        }
        parent = parent.parentNode;
    }
    return { x, y, width, height };
};
export default measureElement;
//# sourceMappingURL=measure-element.js.map