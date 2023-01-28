/* eslint-disable functional/no-return-void */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable functional/functional-parameters */

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { defaultSettings, wrapRouter } from ".";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import React from "react";

// Polyfill for fetch and global Request required by react-router.
import "whatwg-fetch";

beforeEach(() => {
  // Avoid `Error: Not implemented: window.scrollTo`
  window.scrollTo = () => {};
  // oaf-react-router has a side-effect of manipulating document title (i.e. global mutable state).
  window.document.title = "";
});

afterEach(cleanup);

describe("oaf-react-router", () => {
  test("doesn't throw when wrapping and unwrapping a browser router", () => {
    const router = createBrowserRouter([
      {
        path: "/",
        element: <div>Hello world!</div>,
      },
    ]);
    const unwrap = wrapRouter(router, { documentTitle: () => "test title c" });

    render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    );

    expect(() => unwrap()).not.toThrow();
  });

  test("disables native scroll restoration", () => {
    const router = createBrowserRouter([{}]);

    expect(window.history.scrollRestoration).toBeUndefined();

    const unwrap = wrapRouter(router, { disableAutoScrollRestoration: true });

    expect(window.history.scrollRestoration).toEqual("manual");

    unwrap();

    expect(window.history.scrollRestoration).toBeUndefined();
  });

  test("sets the document title after initial render", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, {
      setPageTitle: true,
      documentTitle: () => "test title b",
    });

    expect(document.title).toBe("");

    await waitFor(() => expect(document.title).toBe("test title b"));
  });

  test("sets the document title after a navigation", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, {
      setPageTitle: true,
      documentTitle: () => "test title a",
    });

    expect(document.title).toBe("");

    await router.navigate("/");

    // Prove that `delay(settings.renderTimeout)` is putting the title update on the end of the event loop.
    expect(document.title).toBe("");

    await new Promise((resolve) => setTimeout(() => resolve(undefined)));

    // Now, after waiting, we should have updated the page title.
    await waitFor(() => expect(document.title).toBe("test title a"));
  });

  test("does not set the document title when setPageTitle is false", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, {
      setPageTitle: false,
      documentTitle: () => "shouldn't happen",
    });

    expect(document.title).toBe("");

    await router.navigate("/");

    // We can't just use waitFor with a negative condition that we expect to _remain_ negative after setTimeouts have been allowed to run.
    await new Promise((resolve) => setTimeout(() => resolve(undefined)));

    await waitFor(() => expect(document.title).toBe(""));
  });

  test("leaves focus alone when repairFocus is false", async () => {
    const router = createBrowserRouter([{}]);

    // Given a router wrapper that is set to NOT repair focus.
    wrapRouter(router, { repairFocus: false });

    // and given a default focus target (an h1 element within main).
    render(
      <React.StrictMode>
        <main>
          <h1></h1>
          <button></button>
        </main>
      </React.StrictMode>,
    );

    // And another arbitrary element that happens to currently have focus.
    document.querySelector("button")?.focus();
    expect(document.activeElement).toBe(document.querySelector("button"));

    // When we navigate using a wrapped router.
    await router.navigate("/");

    // Then focus remains on the previously focused element.
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector("button")),
    );
  });

  test("moves focus to body when primary focus target cannot be focused", async () => {
    const router = createBrowserRouter([
      {
        path: "/",
        element: (
          <main>
            <h1></h1>
            <button></button>
          </main>
        ),
      },
    ]);
    wrapRouter(router);

    // Given a default focus target (an h1 element within main)...
    render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    );

    // ...that cannot receive focus (because we sabotaged it)
    const h1 = document.querySelector("h1");
    expect(h1).toBeDefined();
    // eslint-disable-next-line functional/no-conditional-statement
    if (h1 !== null) {
      h1.focus = () => {};
    }

    // And another arbitrary element that happens to currently have focus.
    document.querySelector("button")?.focus();
    expect(document.activeElement).toBe(document.querySelector("button"));

    // When we navigate using a wrapped router.
    await act(() => router.navigate("/"));

    // Then the wrapper falls back on focusing the body or document
    // element when it fails to focus the (sabotaged) H1.
    await waitFor(() =>
      expect([document.body, document.documentElement]).toContain(
        document.activeElement,
      ),
    );
  });

  test("moves focus to the primary focus target and announce navigation to screen readers", async () => {
    // Given a default focus target (an h1 element within main).
    const router = createBrowserRouter([
      {
        path: "/",
        element: <div />,
        loader: () => Promise.resolve(null),
      },
      {
        path: "/hello",
        element: (
          <main>
            <h1></h1>
            <button></button>
          </main>
        ),
        // The presence of these loaders means that the router will emit loading states before it
        // emits idle states (at the completion of the overarching navigation event).
        // We only want to update document title, repair focus, announce navigation to screen reader users after
        // the final idle state, never in response to the intermediary loading state.
        loader: () => Promise.resolve(null),
      },
    ]);

    // And a mocked announce function.
    const mockAnnounce = jest.fn(defaultSettings.announce);
    wrapRouter(router, {
      announce: mockAnnounce,
    });

    render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    );

    // And given focus is currently on the body or the document.
    expect(document.activeElement).toBe(document.documentElement);

    // When we navigate using a wrapped router.
    await act(() => router.navigate({ pathname: "/hello" }));

    // Then the wrapper causes focus to move to that default focus target.
    await waitFor(() => expect(document.activeElement).not.toBeNull());
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector("h1")),
    );

    // And a screen reader announcement was made only for the `idle` state, not the `loading` state.
    expect(mockAnnounce.mock.calls).toHaveLength(1);
  });

  test("restores focus after a POP navigation", async () => {
    // Given a route.
    const router = createBrowserRouter([
      {
        path: "/one",
        element: (
          <main>
            <h1>Page one</h1>
            <button></button>
          </main>
        ),
      },
      {
        path: "/two",
        element: (
          <main>
            <h1>Page two</h1>
          </main>
        ),
      },
      {
        path: "*",
        element: <div>Not found</div>,
      },
    ]);

    // And a wrapped router that restores page state on pop.
    wrapRouter(router, { restorePageStateOnPop: true });

    render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    );

    // And given we have previously focused the button.
    await act(() => router.navigate({ pathname: "/one" }));
    const button = document.querySelector("button");
    // eslint-disable-next-line functional/no-conditional-statement
    if (button === null) {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error("Expected button not found in DOM");
    }
    button.focus();
    expect(document.activeElement).toBe(button);

    // And then navigated away.
    await act(() => router.navigate({ pathname: "/two" }));
    await new Promise((resolve) => setTimeout(() => resolve(undefined)));
    const h1 = document.querySelector("h1");
    // eslint-disable-next-line functional/no-conditional-statement
    if (h1 === null) {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error("Expected h1 not found in DOM");
    }
    expect(document.activeElement).toBe(h1);

    // When we navigate back (POP).
    await act(() => router.navigate(-1));

    // TODO: avoid having to jump on the event of the event queue thrice in succession...
    await act(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined))),
    );
    await act(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined))),
    );
    await act(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined))),
    );

    // Then focus is placed back on the button, where it was when we navigated away.
    const button2 = document.querySelector("button");
    // eslint-disable-next-line functional/no-conditional-statement
    if (button2 === null) {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error("Expected button2 not found in DOM");
    }
    await waitFor(() => expect(document.activeElement).toBe(button2));
  });
});
