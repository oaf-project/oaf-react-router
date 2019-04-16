import {
  Action,
  History,
  Location,
  LocationKey,
  LocationState,
  UnregisterCallback,
} from "history";
import {
  announce,
  elementFromHash,
  focusAndScrollIntoViewIfRequired,
  resetFocus,
  Selector,
} from "oaf-side-effects";
import { getPageState, PageState, setPageState } from "./page-state";

// tslint:disable: no-expression-statement
// tslint:disable: no-if-statement
// tslint:disable: interface-over-type-literal
// tslint:disable: interface-name
// tslint:disable: no-mixed-interface
// tslint:disable: object-literal-sort-keys
// tslint:disable: no-object-mutation

export interface RouterSettings {
  readonly announcementsDivId: string;
  readonly primaryFocusTarget: Selector;
  readonly documentTitle: (location: Location) => string;
  readonly navigationMessage: (
    title: string,
    location: Location,
    action: Action,
  ) => string;
  readonly shouldHandleAction: (
    previousLocation: Location,
    nextLocation: Location,
    action: Action,
  ) => boolean;
  readonly disableAutoScrollRestoration: boolean;
  readonly announcePageNavigation: boolean;
  readonly setPageTitle: boolean;
  readonly renderTimeout: number;
  readonly defaultPageState: PageState;
  readonly focusOptions?: FocusOptions;
  readonly scrollIntoViewOptions?: ScrollIntoViewOptions;
}

export const defaultSettings: RouterSettings = {
  announcementsDivId: "announcements",
  primaryFocusTarget: "main h1, [role=main] h1",
  documentTitle: (location: Location) => location.pathname.replace("/", " "),
  // TODO i18n
  navigationMessage: (title: string): string => `Navigated to ${title}.`,
  shouldHandleAction: () => true,
  disableAutoScrollRestoration: true,
  announcePageNavigation: true,
  setPageTitle: true,
  renderTimeout: 0,
  defaultPageState: { x: 0, y: 0 },
  focusOptions: undefined,
  scrollIntoViewOptions: undefined,
};

const disableAutoScrollRestoration = (
  settings: RouterSettings,
): UnregisterCallback => {
  // https://developer.mozilla.org/en-US/docs/Web/API/History#Browser_compatibility
  if (
    settings.disableAutoScrollRestoration &&
    "scrollRestoration" in window.history
  ) {
    const original = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => (window.history.scrollRestoration = original);
  } else {
    return () => {
      return;
    };
  }
};

const handleFirstPageLoad = <A = LocationState>(
  h: History<A>,
  settings: RouterSettings,
) => {
  if (settings.setPageTitle) {
    document.title = settings.documentTitle(h.location);
  }
  setTimeout(() => {
    const focusTarget = elementFromHash(h.location.hash);
    if (focusTarget !== undefined) {
      focusAndScrollIntoViewIfRequired(
        focusTarget,
        focusTarget,
        settings.focusOptions,
        settings.scrollIntoViewOptions,
      );
    }
  }, settings.renderTimeout);
};

// HACK we need a way to track where focus and scroll were left on the first loaded page
// but we won't have an entry in history for this initial page, so we just make up a key.
const keyFromLocation = (location: Location): LocationKey =>
  location.key !== undefined ? location.key : "initial";

export const wrapHistory = <A = LocationState>(
  h: History<A>,
  s?: Partial<RouterSettings>,
): UnregisterCallback => {
  const settings = {
    ...defaultSettings,
    ...s,
  };

  const resetAutoScrollRestoration = disableAutoScrollRestoration(settings);

  // TODO constrain the size of these collections?
  // TODO persist these?
  const locations = new Array<LocationKey>();
  const pageStateMap = new Map<LocationKey, PageState>();
  const shouldHandleActionMap = new Map<LocationKey, boolean>();

  const purgeStateForKey = (key: LocationKey | undefined): void => {
    if (key !== undefined) {
      pageStateMap.delete(key);
      shouldHandleActionMap.delete(key);
    }
  };

  const unlisten = h.listen((location, action) => {
    const title = settings.documentTitle(location);

    if (settings.setPageTitle) {
      document.title = title;
    }

    const locationKey = keyFromLocation(location);
    const shouldHandleAction = shouldHandleActionMap.get(locationKey);

    if (shouldHandleAction !== undefined ? shouldHandleAction : true) {
      if (settings.announcePageNavigation) {
        announce(
          settings.navigationMessage(title, location, action),
          settings.announcementsDivId,
        );
      }

      // HACK: We use setTimeout to give React a chance to render before we repair focus.
      // This may or may not be future proof. Revisit when React 17 is released.
      // We may have to tap into componentDidMount() on the individual react-router Route
      // components to know when we can safely repair focus.
      if (action === "POP") {
        const previousPageState = pageStateMap.get(locationKey);
        const pageState = {
          ...settings.defaultPageState,
          ...previousPageState,
        };

        setTimeout(
          () => setPageState(pageState, settings.primaryFocusTarget),
          settings.renderTimeout,
        );
      } else {
        setTimeout(() => {
          resetFocus(
            settings.primaryFocusTarget,
            elementFromHash(location.hash),
            settings.focusOptions,
            settings.scrollIntoViewOptions,
          );
        }, settings.renderTimeout);
      }
    }
  });

  // We use `block` because it conveniently gives us access to both the previous and
  // next locations, while we can only get at the next location in `listen`.
  const unblock = h.block((location, action) => {
    const previousLocation = h.location;
    const nextLocation = location;

    if (previousLocation.key !== undefined) {
      pageStateMap.set(previousLocation.key, getPageState());
    }

    const nextLocationKey = keyFromLocation(nextLocation);

    if (action === "PUSH") {
      const desiredLocationsLength =
        previousLocation.key !== undefined
          ? locations.indexOf(previousLocation.key) + 1
          : 0;

      while (locations.length > desiredLocationsLength) {
        const key = locations.pop();
        purgeStateForKey(key);
      }

      locations.push(nextLocationKey);
    } else if (action === "REPLACE" && previousLocation.key !== undefined) {
      const indexToReplace = locations.indexOf(previousLocation.key);
      if (indexToReplace !== -1) {
        locations[indexToReplace] = nextLocationKey;
      }
      purgeStateForKey(previousLocation.key);
    }

    shouldHandleActionMap.set(
      nextLocationKey,
      settings.shouldHandleAction(previousLocation, nextLocation, action),
    );
  });

  // First page load won't be picked up by `listen`.
  handleFirstPageLoad(h, settings);

  return () => {
    resetAutoScrollRestoration();
    unlisten();
    unblock();
  };
};
