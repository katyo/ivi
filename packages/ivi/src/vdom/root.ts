import { checkNestingViolations } from "../debug/html_nesting_rules";
import { Op } from "./operations";
import { OpState } from "./state";
import { _mount, _update, _unmount, _dirtyCheck, _resetState } from "./reconciler";
import { enableContext, disableContext } from "./context";

/**
 * Root.
 */
export interface Root {
  /**
   * Container element.
   */
  container: Element | null;
  /**
   * Current state.
   */
  state: OpState | null;
  /**
   * Next operation.
   */
  next: Op | undefined;
}

/**
 * Root nodes.
 */
export const ROOTS = [] as Root[];

/**
 * Find root node of a container.
 *
 * @param predicate - Find predicate.
 * @returns root node or undefined when root node doesn't exist.
 */
export const findRoot = (predicate: (root: Root) => boolean) => ROOTS.find(predicate);

/**
 * Performs a dirty checking.
 */
export function dirtyCheck() {
  /* istanbul ignore else */
  if (__IVI_DEBUG__) {
    enableContext();
  }
  for (let i = 0; i < ROOTS.length; ++i) {
    const root = ROOTS[i];
    const { container, state, next } = root;
    _resetState();
    if (next !== void 0) {
      root.next = void 0;
      root.state = _update(container!, state, next, false, true);
    } else if (state !== null) {
      _dirtyCheck(container!, state, false, true);
    }

    /* istanbul ignore else */
    if (__IVI_DEBUG__) {
      if (root.state) {
        checkNestingViolations(container!, root.state);
      }
    }
  }
  /* istanbul ignore else */
  if (__IVI_DEBUG__) {
    disableContext();
  }
}
