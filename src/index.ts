/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */

import { History, Location } from "history";
import {
  createOafRouter,
  defaultSettings as oafRoutingDefaultSettings,
  RouterSettings,
} from "oaf-routing";

export { RouterSettings } from "oaf-routing";

export const defaultSettings: RouterSettings<Location> = {
  ...oafRoutingDefaultSettings,
};

export const wrapHistory = (
  history: History,
  settingsOverrides?: Partial<RouterSettings<Location>>,
): (() => void) => {
  const settings: RouterSettings<Location> = {
    ...defaultSettings,
    ...settingsOverrides,
  };

  const oafRouter = createOafRouter(settings, (location) => location.hash);

  const initialLocation = history.location;

  // HACK: We use setTimeout to give React a chance to render before we repair focus.
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    oafRouter.handleFirstPageLoad(initialLocation);
  }, settings.renderTimeout);

  // eslint-disable-next-line functional/no-let
  let previousLocation = initialLocation;

  const unlisten = history.listen((update) => {
    // We're the first subscribed listener, so the DOM won't have been updated yet.
    oafRouter.handleLocationWillChange(
      previousLocation.key,
      update.location.key,
      update.action,
    );

    // HACK: We use setTimeout to give React a chance to render before we repair focus.
    const stablePreviousLocation = previousLocation;
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      oafRouter.handleLocationChanged(
        stablePreviousLocation,
        update.location,
        update.location.key,
        update.action,
      );
    }, settings.renderTimeout);

    previousLocation = update.location;
  });

  return (): void => {
    oafRouter.resetAutoScrollRestoration();
    unlisten();
  };
};
