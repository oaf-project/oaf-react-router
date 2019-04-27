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
  // TODO
};

export const wrapHistory = <A = LocationState>(
  history: History<A>,
  settingsOverrides?: Partial<RouterSettings<Location<A>>>,
): (() => void) => {
  const settings = {
    ...defaultSettings,
    ...settingsOverrides,
  };

  const oafRouter = createOafRouter(
    settings,
    location => location.hash,
    // HACK we need a way to track where focus and scroll were left on the first loaded page
    // but we won't have an entry in history for this initial page, so we just make up a key.
    location => (location.key !== undefined ? location.key : "initial"),
  );

  oafRouter.handleFirstPageLoad(history.location);

  // tslint:disable-next-line: no-let
  let previousLocation = history.location;

  const unlisten = history.listen(async (location, action) => {
    oafRouter.handleLocationChanged(previousLocation, location, action);
    previousLocation = location;
  });

  const unblock = history.block((location, action) => {
    oafRouter.handleLocationWillChange(previousLocation, location, action);
  });

  return () => {
    oafRouter.resetAutoScrollRestoration();
    unlisten();
    unblock();
  };
};
