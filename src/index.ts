/* eslint-disable functional/functional-parameters */
/* eslint-disable functional/no-return-void */
/* eslint-disable functional/no-expression-statement */

import { Router, Location } from "@remix-run/router";
import {
  createOafRouter,
  defaultSettings as oafRoutingDefaultSettings,
  RouterSettings,
} from "oaf-routing";

export { RouterSettings } from "oaf-routing";

export const defaultSettings: RouterSettings<Location> = {
  ...oafRoutingDefaultSettings,
};

export const wrapRouter = (
  router: Router,
  settingsOverrides?: Partial<RouterSettings<Location>>,
): (() => void) => {
  const settings: RouterSettings<Location> = {
    ...defaultSettings,
    ...settingsOverrides,
  };

  const oafRouter = createOafRouter(settings, (location) => location.hash);

  const initialLocation = router.state.location;

  // HACK: We use setTimeout to give React a chance to render before we repair focus.
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    oafRouter.handleFirstPageLoad(initialLocation);
  }, settings.renderTimeout);

  // eslint-disable-next-line functional/no-let
  let previousLocation = initialLocation;

  const unlisten = router.subscribe((update) => {
    // We're the first subscribed listener, so the DOM won't have been updated yet.
    oafRouter.handleLocationWillChange(
      previousLocation.key,
      update.location.key,
      update.historyAction,
    );

    // HACK: We use setTimeout to give React a chance to render before we repair focus.
    const stablePreviousLocation = previousLocation;
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      oafRouter.handleLocationChanged(
        stablePreviousLocation,
        update.location,
        update.location.key,
        update.historyAction,
      );
    }, settings.renderTimeout);

    previousLocation = update.location;
  });

  return (): void => {
    oafRouter.resetAutoScrollRestoration();
    unlisten();
  };
};
