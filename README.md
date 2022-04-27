[![Build Status](https://github.com/oaf-project/oaf-react-router/actions/workflows/main.yml/badge.svg)](https://github.com/oaf-project/oaf-react-router/actions/workflows/main.yml)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Foaf-project%2Foaf-react-router%2Fmaster%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![Codecov](https://img.shields.io/codecov/c/github/oaf-project/oaf-react-router.svg)](https://codecov.io/gh/oaf-project/oaf-react-router)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Foaf-project%2Foaf-react-router%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/oaf-project/oaf-react-router/master)
[![Known Vulnerabilities](https://snyk.io/test/github/oaf-project/oaf-react-router/badge.svg?targetFile=package.json)](https://snyk.io/test/github/oaf-project/oaf-react-router?targetFile=package.json)
[![npm](https://img.shields.io/npm/v/oaf-react-router.svg)](https://www.npmjs.com/package/oaf-react-router)

# Oaf React Router

An accessible wrapper for [React Router](https://github.com/remix-run/react-router).

## Compatibility

| React Router | [history](https://www.npmjs.com/package/history) | Oaf React Router |
|--------------|--------------------------------------------------|------------------|
| 6            | 5                                                | 3.0.0            |
| 5            | 4                                                | 2.1.1            |


* DOM-only (no React Native support)
* Supports [`BrowserRouter`](https://reacttraining.com/react-router/web/api/BrowserRouter) and [`HashRouter`](https://reacttraining.com/react-router/web/api/HashRouter)
* Works with [redux-first-history](https://www.npmjs.com/package/redux-first-history) and [Connected React Router](https://github.com/supasate/connected-react-router)
* Tested in modern browsers, IE 11, Edge
* For (full) IE support you will need to polyfill [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Browser_compatibility). Using [core-js](https://github.com/zloirock/core-js): `import "core-js/es6/map";`.

## Features

* Reset scroll and focus after PUSH and REPLACE navigation
* Restore scroll and focus after POP navigation
* Set the page title after navigation
* Announce navigation to users of screen readers
* Hash fragment support

### Reset scroll and focus after PUSH and REPLACE navigation

[React Router does not reset the window's scroll position or the focused element](https://reacttraining.com/react-router/web/guides/scroll-restoration) after page navigation.

The React Router documentation sketches a ["scroll to top" approach](https://reacttraining.com/react-router/web/guides/scroll-restoration/scroll-to-top) that scrolls the window back to the top of the page after navigation, emulating native browser behavior. There are also packages to do this for you, such as [trevorr/react-scroll-manager](https://github.com/trevorr/react-scroll-manager) or [react-router-scroll-top](https://github.com/bluframe/react-router-scroll-top/issues/10). Unfortunately, these approaches address only the scroll half of the question, [ignoring keyboard focus](http://simplyaccessible.com/article/spangular-accessibility/#acc-heading-3):

> One of the unique features of single page applications that can create challenges for people using screen readers is that there’s never a page refresh, only view refreshes. As a result, the focused element often disappears from the interface, and the person using the screen reader is left searching for clues as to what happened and what’s now showing in the application view. Places where focus is commonly lost include: page changes, item deleting, modal closing, and expanding and closing record details.

Oaf React Router fixes this by moving focus to something it calls the "primary focus target" after navigation, which by default is the first `h1` element inside the page's `main` element, but this is configurable. For advice on what this focus target should be, see [Marcy Sutton's recommendations](https://www.gatsbyjs.org/blog/2019-07-11-user-testing-accessible-client-routing/#recommendations-finding-common-ground).

In addition to moving focus, Oaf React Router will also scroll the primary focus target into view, so you don't need to worry about scrolling to the top of the page after a page navigation.

In a non-single page app website, a web browser will reset focus to the very top of the document after navigation (at the same time that it scrolls to top). You can emulate this with Oaf React Router by setting the primary focus target to `body` instead of the default `main h1`.

See:
* https://reacttraining.com/react-router/web/guides/scroll-restoration
* https://github.com/ReactTraining/react-router/issues/5210
* https://medium.com/@robdel12/single-page-apps-routers-are-broken-255daa310cf
* https://www.gatsbyjs.org/blog/2019-07-11-user-testing-accessible-client-routing

### Restore scroll and focus after POP navigation

After a POP navigation (i.e. after navigation back or forward through history) browsers typically restore focus and scroll position to where they were when the user last navigated away from that page.

[React Router does not emulate this](https://reacttraining.com/react-router/web/guides/scroll-restoration/generic-solution), so Oaf React Router takes care of it for you. Note that browsers such as Firefox and Safari will restore _both_ scroll position and the last focused element, but for some reason Chrome restores _only_ the scroll position, not the focused element. To imitate this, Oaf React Router will move focus to the _primary focus target_ (as described in the previous section) instead of to the last focused element when a POP navigation occurs in Chrome.

Note that there is a [proposed scroll restoration standard](https://majido.github.io/scroll-restoration-proposal/history-based-api.html) but it is not widely implemented and it only addresses scroll position, not focus (notice a theme emerging?) so it is of no use to us.

See:
* https://github.com/ReactTraining/react-router/issues/3950
* https://developer.mozilla.org/de/docs/Web/API/History#Browser_compatibility
* https://github.com/Fyrd/caniuse/issues/1889

### Set the page title after navigation

[Every page in your React app must have a unique and descriptive title](https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-title.html). Oaf React Router will set the page title for you using a function that maps from `location`s to page titles. You must supply this function. For how to provide this function, see the usage section below.

See:
* https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-title.html

### Announce navigation to users of screen readers

Oaf React Router will announce page navigation events to screen reader users via a [visually hidden](https://a11yproject.com/posts/how-to-hide-content/) [`aria-live`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions) element. [Announcing navigation is required](https://almerosteyn.com/2017/03/accessible-react-navigation) because:

<blockquote><p>Screen readers are clever enough to read a lot of information that the browser expose naturally, but if no information exists to read out, the screen reader will remain ominously silent, even if something very important has happened on screen.</p>

<p>Unfortunately, this is the case with many routed SPA applications today. Screen readers are able to recognise actual browser navigation very easily as the browser will tell the screen reader that it has navigated to another web page. In the case of SPAs, like those built with React or Angular, the router software will take over some of the navigation actions from the browser in order to control the application without constantly reloading the host HTML page.</p>

<p>The result: A totally silent page transition leading to a very confusing experience for these users. Imagine trying to navigate a web application if you could not even see that the navigation was successful!</p></blockquote>

By default, Oaf React Router will announce "navigated to foo" where "foo" is the page title returned by the function described in the previous section. You can override this to support localization, etc.

See:
* https://almerosteyn.com/2017/03/accessible-react-navigation

### Hash fragment support

Another native browser feature that React Router doesn't emulate is scrolling to the element identified by the hash fragment in a URL. For example, if you load https://en.wikipedia.org/wiki/Firefox#Performance, your browser will scroll down to the `<span id="Performance">` automatically.

There are other libraries that tackle this issue—for example [rafrex/react-router-hash-link](https://github.com/rafrex/react-router-hash-link)—but they typically only address scroll to the exclusion of focus (there's that theme again).

Oaf React Router implements this for you, taking care of both focus and scroll.

A [caveat](https://github.com/oaf-project/oaf-react-router/issues/8) here is that the identified element must exist in the DOM straight after the route is rendered. If the element won't exist for some time, e.g. until after an API response, then Oaf React Router won't focus or scroll to it, falling back on the primary focus target.

## Installation

```sh
# yarn
yarn add oaf-react-router

# npm
npm install oaf-react-router
```

## Basic Usage

### React Router 5

```diff
- import { BrowserRouter as Router } from "react-router-dom";
+ import { Router } from "react-router-dom";
+ import { createBrowserHistory } from "history";
+ import { wrapHistory } from "oaf-react-router";

+ const history = createBrowserHistory(); // or createHashHistory()
+ wrapHistory(history);

ReactDOM.render((
-  <Router>
+  <Router history={history}>
    ...
  </Router>
), document.getElementById("root"));
```

### React Router 6

```diff
- import { BrowserRouter } from "react-router-dom";
+ import { unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
+ import { createBrowserHistory } from "history";
+ import { wrapHistory } from "oaf-react-router";

+ const history = createBrowserHistory(); // or createHashHistory()
+ wrapHistory(history);

ReactDOM.render((
-  <BrowserRouter>
+  <HistoryRouter history={history}>
    ...
-  <BrowserRouter>
+  </HistoryRouter>
), document.getElementById("root"));
```

## Advanced Usage

```typescript
const history = createBrowserHistory();

const settings = {
  announcementsDivId: "announcements",
  primaryFocusTarget: "main h1, [role=main] h1",
  // This assumes you're setting the document title via some other means (e.g. React Helmet).
  // If you're not, you should return a unique and descriptive page title for each page
  // from this function and set `setPageTitle` to true.
  documentTitle: (location: Location) => document.title,
  // BYO localization
  navigationMessage: (title: string, location: Location, action: Action): string => `Navigated to ${title}.`,
  // Return false if you're handling focus yourself for a specific history action.
  shouldHandleAction: (previousLocation: Location, nextLocation: Location, action: Action) => true,
  disableAutoScrollRestoration: true,
  announcePageNavigation: true,
  setPageTitle: false,
  handleHashFragment: true,
  // Set this to false if you are using HashRouter or MemoryRouter.
  restorePageStateOnPop: true,
  // Set this to true for smooth scrolling.
  // For browser compatibility you might want iamdustan's smoothscroll polyfill https://github.com/iamdustan/smoothscroll
  smoothScroll: false,
};

wrapHistory(history, settings);
```

### A note on setting document title

You may already be using [React Helmet](https://github.com/nfl/react-helmet) or some other technique to set the document title on route change. That's fine, just be mindful of how you might announce page navigation to users of screen readers and other assistive technology.

In the case of React Helmet, you might do something like this:
1. Set both `setPageTitle` and `announcePageNavigation` to `false` in the config object you pass to Oaf React Router's `wrapHistory` function.
2. Add a handler function to [React Helmet's `onChangeClientState` callback](https://github.com/nfl/react-helmet#reference-guide).
3. Announce page navigation using something like [the `announce` function from Oaf Side Effects](https://oaf-project.github.io/oaf-side-effects/modules/_index_.html#announce) (which is what Oaf React Router itself uses).

### A note on focus outlines
You may see focus outlines around your `h1` elements (or elsewhere, per `primaryFocusTarget`) when using Oaf React Router.

You might be tempted to remove these focus outlines with something like the following:
```css
[tabindex="-1"]:focus {
  outline: 0 !important;
}
```

Don't do this! Focus outlines are important for accessibility. See for example:

* https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-focus-visible.html
* https://www.w3.org/TR/2016/NOTE-WCAG20-TECHS-20161007/F78
* http://www.outlinenone.com/
* https://github.com/twbs/bootstrap/issues/28425
* Although there is some debate: https://github.com/w3c/wcag/issues/1001

All that said, if you absolutely _must_ remove focus outlines (stubborn client, stubborn boss, stubborn designer, whatever), consider using [`:focus-visible`](https://caniuse.com/css-focus-visible) (and its [polyfill](https://github.com/WICG/focus-visible)) so focus outlines are only hidden from mouse users, _not_ keyboard users.

## Inspiration and prior art

* https://github.com/rafrex/react-router-hash-link
* https://github.com/trevorr/react-scroll-manager
* https://medium.com/@gajus/making-the-anchor-links-work-in-spa-applications-618ba2c6954a
* https://almerosteyn.com/2017/03/accessible-react-navigation
* https://reach.tech/router/accessibility
* https://medium.com/@robdel12/single-page-apps-routers-are-broken-255daa310cf

## Related issues

* https://github.com/alphagov/govuk-frontend/issues/2412
* https://github.com/remix-run/react-router/issues/5210

## See also
* [Oaf Routing](https://github.com/oaf-project/oaf-routing)
* [Oaf Side Effects](https://github.com/oaf-project/oaf-side-effects)
* [@axe-core/react](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react)
* [eslint-plugin-jsx-a11y](https://github.com/evcohen/eslint-plugin-jsx-a11y)
* [React Accessibility](https://reactjs.org/docs/accessibility.html)
