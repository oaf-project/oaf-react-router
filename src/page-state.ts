import {
  elementFromTarget,
  focusElement,
  getScrollPosition,
  ScrollPosition,
  setScrollPosition,
} from "oaf-side-effects";
import unique, { Selector } from "unique-selector";
import { is } from "./is";

// tslint:disable: interface-over-type-literal
// tslint:disable: no-expression-statement
// tslint:disable: no-if-statement

/**
 * Aspects of page state that should be restored after POP history
 * actions (i.e. after the user navigates back or forward in their browser).
 */
export type PageState = ScrollPosition & {
  /**
   * A CSS selector that uniquely specifies the element that has keyboard focus (if any).
   */
  readonly focusSelector?: Selector;
};

/**
 * Get the current page state.
 */
export const getPageState = (): PageState => {
  const focusSelector =
    document.activeElement !== null
      ? unique(document.activeElement)
      : undefined;

  return {
    ...getScrollPosition(),
    focusSelector,
  };
};

// Chrome doesn't restore the previously focused element when
// navigating back and forward (history POP), but Safari and Firefox do.
// TODO test more browsers here (Chromium, Opera, etc).
const shouldRestoreFocusAfterPop = !is.chrome();

/**
 * Set the page state.
 * @param pageState the page state to set
 * @param primaryFocusTarget a CSS selector for your primary focus target, e.g. `[main h1]`
 */
export const setPageState = async (
  pageState: PageState,
  primaryFocusTarget: Selector,
): Promise<void> => {
  const previouslyFocusedElement =
    shouldRestoreFocusAfterPop && pageState.focusSelector !== undefined
      ? elementFromTarget(pageState.focusSelector)
      : undefined;
  const elementToFocus =
    previouslyFocusedElement ||
    elementFromTarget(primaryFocusTarget) ||
    document.body;

  await focusElement(elementToFocus, { preventScroll: true });

  setScrollPosition(pageState);
};
