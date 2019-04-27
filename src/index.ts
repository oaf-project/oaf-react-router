import { History, Location, LocationState } from "history";
import {
  createOafRouter,
  defaultSettings as oafRoutingDefaultSettings,
  RouterSettings,
} from "oaf-routing";

// tslint:disable: no-expression-statement

export { RouterSettings } from "oaf-routing";

export const defaultSettings = {
  ...oafRoutingDefaultSettings,
};

export const wrapHistory = <A = LocationState>(
  history: History<A>,
  settingsOverrides?: Partial<RouterSettings<Location<A>>>,
): (() => void) => {
  const settings = {
    ...defaultSettings,
    ...settingsOverrides,
  };

  const oafRouter = createOafRouter(settings, location => location.hash);

  oafRouter.handleFirstPageLoad(history.location);

  // tslint:disable-next-line: no-let
  let previousLocation = history.location;

  const unlisten = history.listen((location, action) => {
    oafRouter.handleLocationChanged(
      previousLocation,
      location,
      location.key,
      action,
    );
    previousLocation = location;
  });

  const unblock = history.block((location, action) => {
    oafRouter.handleLocationWillChange(
      previousLocation.key,
      location.key,
      action,
    );
  });

  return () => {
    oafRouter.resetAutoScrollRestoration();
    unlisten();
    unblock();
  };
};
