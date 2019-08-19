import { History, Location, LocationKey } from "history";
import {
  createOafRouter,
  defaultSettings as oafRoutingDefaultSettings,
  RouterSettings,
} from "oaf-routing";

// tslint:disable: no-expression-statement

export { RouterSettings } from "oaf-routing";

export const defaultSettings: RouterSettings<Location<unknown>> = {
  ...oafRoutingDefaultSettings,
};

// HACK we need a way to track where focus and scroll were left on the first loaded page
// but we won't have an entry in history for this initial page, so we just make up a key.
const orInitialKey = (key: LocationKey | undefined): LocationKey =>
  key !== undefined ? key : "initial";

export const wrapHistory = <A = unknown>(
  history: History<A>,
  settingsOverrides?: Partial<RouterSettings<Location<A>>>,
): (() => void) => {
  const settings: RouterSettings<Location<A>> = {
    ...defaultSettings,
    ...settingsOverrides,
  };

  const oafRouter = createOafRouter(settings, location => location.hash);

  const initialLocation = history.location;

  // HACK: We use setTimeout to give React a chance to render before we repair focus.
  setTimeout(() => {
    oafRouter.handleFirstPageLoad(initialLocation);
  }, settings.renderTimeout);

  // tslint:disable-next-line: no-let
  let previousLocation = initialLocation;

  const unlisten = history.listen((location: Location<A>, action) => {
    // We're the first subscribed listener, so the DOM won't have been updated yet.
    oafRouter.handleLocationWillChange(
      orInitialKey(previousLocation.key),
      orInitialKey(location.key),
      action,
    );

    // HACK: We use setTimeout to give React a chance to render before we repair focus.
    const stablePreviousLocation = previousLocation;
    setTimeout(() => {
      oafRouter.handleLocationChanged(
        stablePreviousLocation,
        location,
        orInitialKey(location.key),
        action,
      );
    }, settings.renderTimeout);

    previousLocation = location;
  });

  return () => {
    oafRouter.resetAutoScrollRestoration();
    unlisten();
  };
};
