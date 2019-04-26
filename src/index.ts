import {
  Action,
  History,
  Location,
  LocationKey,
  LocationState,
  UnregisterCallback,
} from "history";
import {
  createPageStateMemory,
  defaultSettings,
  disableAutoScrollRestoration,
  getPageState,
  PageState,
  RouterSettings,
  setPageState,
} from "oaf-routing";
import {
  announce,
  elementFromHash,
  focusAndScrollIntoViewIfRequired,
  resetFocus,
} from "oaf-side-effects";

// tslint:disable: no-expression-statement
// tslint:disable: no-if-statement
// tslint:disable: no-object-mutation

export { defaultSettings, RouterSettings } from "oaf-routing";

const handleFirstPageLoad = async <A = LocationState>(
  history: History<A>,
  settings: RouterSettings<Location<A>, Action>,
): Promise<void> => {
  if (settings.setPageTitle) {
    document.title = await settings.documentTitle(history.location);
  }
  setTimeout(() => {
    const focusTarget = elementFromHash(history.location.hash);
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
  history: History<A>,
  settingsOverrides?: Partial<RouterSettings<Location<A>, Action>>,
): UnregisterCallback => {
  const settings = {
    ...defaultSettings,
    ...settingsOverrides,
  };

  const resetAutoScrollRestoration = disableAutoScrollRestoration(
    settings.disableAutoScrollRestoration,
  );

  const pageStateMemory = createPageStateMemory<LocationKey, PageState>();
  // tslint:disable-next-line: no-let
  let previousLocation = history.location;

  const unlisten = history.listen(async (location, action) => {
    const title = await settings.documentTitle(location);

    if (settings.setPageTitle) {
      document.title = title;
    }

    const shouldHandleAction = settings.shouldHandleAction(
      previousLocation,
      location,
      action,
    );

    if (shouldHandleAction) {
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
        const previousPageState = pageStateMemory.pageState(
          keyFromLocation(location),
        );
        const pageStateToSet = {
          ...settings.defaultPageState,
          ...previousPageState,
        };

        setTimeout(
          () => setPageState(pageStateToSet, settings.primaryFocusTarget),
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

    previousLocation = location;
  });

  const unblock = history.block((location, action) => {
    const nextLocation = location;
    const previousLocationKey = keyFromLocation(previousLocation);
    const nextLocationKey = keyFromLocation(nextLocation);
    const previousPageState = getPageState();

    pageStateMemory.update(
      action,
      previousLocationKey,
      nextLocationKey,
      previousPageState,
    );
  });

  // First page load won't be picked up by `listen`.
  handleFirstPageLoad(history, settings);

  return () => {
    resetAutoScrollRestoration();
    unlisten();
    unblock();
  };
};
