/* eslint-disable functional/no-return-void */
/* eslint-disable @typescript-eslint/no-empty-function */

/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable functional/functional-parameters */

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { wrapRouter } from ".";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import React from "react";

// Polyfill for fetch and global Request required by react-router.
import "whatwg-fetch";

beforeEach(() => {
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

  test("moves focus to the primary focus target", async () => {
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
          </main>
        ),
        // The presence of these loaders means that the router will emit loading states before it
        // emits idle states (at the completion of the overarching navigation event).
        // We only want to update document title, repair focus, announce navigation to screen reader users after
        // the final idle state, never in response to the intermediary loading state.
        loader: () => Promise.resolve(null),
      },
    ]);
    wrapRouter(router);

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

    // TODO assert that navigation screen reader announcements were made only for the `idle` states, not the `loading` states.
  });
});
