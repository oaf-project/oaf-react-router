import { History, Location } from "history";
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

  const unlisten = history.listen((location, action) => {
    // We're the first subscribed listener, so the DOM won't have been updated yet.
    oafRouter.handleLocationWillChange(
      previousLocation.key,
      location.key,
      action,
    );

    // HACK: We use setTimeout to give React a chance to render before we repair focus.
    setTimeout(() => {
      oafRouter.handleLocationChanged(
        previousLocation,
        location,
        location.key,
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
