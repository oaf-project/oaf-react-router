/* eslint-disable functional/no-expression-statement */
/* eslint-disable functional/no-return-void */
/* eslint-disable functional/functional-parameters */

import { Router, Location, RouterState } from "@remix-run/router";
import {
  createOafRouter,
  defaultSettings as oafRoutingDefaultSettings,
  RouterSettings,
} from "oaf-routing";
import { concatMap, delay, fromEventPattern, scan, tap, defer } from "rxjs";

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

  const initialState = router.state;

  // TODO: fold this into the RxJS observable below.
  // HACK: We use setTimeout to give React a chance to render before we repair focus.
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    oafRouter.handleFirstPageLoad(initialState.location);
  }, settings.renderTimeout);

  /**
   * The Typescript type of `fromEventPattern` is... not good.
   *
   * The implementation below _could_ simplify down to the following:
   *
   * ```
   * fromEventPattern<RouterState>(
   *   (handler) => router.subscribe(handler),
   *   (_, unsubscribe: () => void) => unsubscribe(),
   * )
   * ```
   *
   * but then we would be vulnerable to changes that affect either the `RouterState` type or the `() => void` type.
   * Those could change and we wouldn't know about it, because `fromEventPattern` doesn't attempt to derive those
   * types from its parameters, instead just resorting to `any`. By specifying the types we are in effect performing an (unsafe)
   * type assertion.
   *
   * To make the type assertion safer, we use the `Parameters` and `ReturnType` helpers to derive the types
   * from the type of the router parameter directly. The result is the same, but instead of being entirely decoupled from the actual
   * types defined by the `Router` type, we will pick up any changes.
   *
   * The tradeoff is that it's uglier and more verbose, but in exchange we get much more type safety.
   *
   * The real solution would be to fix the `any` typings in `fromEventPattern` upstream.
   */
  const routerObservable = (router: Router) =>
    fromEventPattern<
      Parameters<Parameters<(typeof router)["subscribe"]>[0]>[0]
    >(
      (handler) => router.subscribe(handler),
      (_, unsubscribe: ReturnType<(typeof router)["subscribe"]>) =>
        unsubscribe(),
    );

  /**
   * To make decisions about how to handle route changes, we want to know the
   * previous router state as well as the current/next router state.
   *
   * This type allows our router subscription to hang onto that little bit of state
   * (the previous router state) via RxJS's `scan`.
   */
  type StateAccumulator = {
    readonly previousState: RouterState;
    readonly state: RouterState;
  };

  // TODO: push this RxJS pipeline down into oaf-router and have consumer libs like oaf-react-router
  // be responsible only for creating and passing in the routerObservable?
  const subscription = routerObservable(router)
    .pipe(
      scan<RouterState, StateAccumulator, Pick<StateAccumulator, "state">>(
        (acc, nextState) => ({
          previousState: acc.state,
          state: nextState,
        }),
        { state: initialState },
      ),
      tap(({ previousState, state }) =>
        // We're the first subscribed listener, so the DOM won't have been updated yet.
        oafRouter.handleLocationWillChange(
          previousState.location.key,
          state.location.key,
          state.historyAction,
        ),
      ),
      // HACK: Give React a chance to render before we repair focus.
      // TODO: This will likely fall apart with suspense / async rendering.
      // At that point, we may have to tap into React (and React Router) more directly. Thus far, the trade-off
      // made by oaf-router has been to do everything via the DOM directly and remain framework agnostic.
      // That has maximized its reusability (check out https://github.com/oaf-project/oaf-routing#libraries-that-use-oaf-routing)
      // at the cost of not being able to intimately tie into specific framework / router life cycles.
      // When frameworks and routers are simple, we can get away with the delay/setTimeout hack. But if they're not...
      delay(settings.renderTimeout),
      concatMap(({ previousState, state }) =>
        defer(() =>
          oafRouter.handleLocationChanged(
            previousState.location,
            state.location,
            state.location.key,
            state.historyAction,
          ),
        ),
      ),
    )
    .subscribe();

  return (): void => {
    oafRouter.resetAutoScrollRestoration();
    subscription.unsubscribe();
  };
};
