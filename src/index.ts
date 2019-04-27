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

  const initialRoute = history.location;
  oafRouter.handleFirstPageLoad(initialRoute);

  // tslint:disable-next-line: no-let
  let previousLocation = initialRoute;

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
