/* eslint-disable functional/no-return-void */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable functional/functional-parameters */

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { wrapRouter } from ".";
import { cleanup, render, waitFor } from "@testing-library/react";
import React from "react";

beforeEach(() => {
  // Clear previous test's DOM.
  window.document.body.innerHTML = "";
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
    const unwrap = wrapRouter(router, { documentTitle: () => "test title" });

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
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    await waitFor(() => expect(document.title).toBe("test title"));
  });

  test("sets the document title after a navigation", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, {
      setPageTitle: true,
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    await router.navigate("/");

    // Prove that `delay(settings.renderTimeout)` is putting the title update on the end of the event loop.
    expect(document.title).toBe("");

    // Now, after waiting, we should have updated the page title.
    await waitFor(() => expect(document.title).toBe("test title"));
  });

  test("does not set the document title when setPageTitle is false", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, {
      setPageTitle: false,
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    await router.navigate("/");

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
    document.querySelector("button")!.focus();
    expect(document.activeElement).toBe(document.querySelector("button"));

    // When we navigate using a wrapped router.
    await router.navigate("/");

    // Then focus remains on the previously focused element.
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector("button")),
    );
  });

  test("moves focus to body when primary focus target cannot be focused", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router);

    // Given a default focus target (an h1 element within main)...
    render(
      <React.StrictMode>
        <main>
          <h1></h1>
          <button></button>
        </main>
      </React.StrictMode>,
    );

    // ...that cannot receive focus (because we sabotaged it)
    document.querySelector("h1")!.focus = () => {};

    // And another arbitrary element that happens to currently have focus.
    document.querySelector("button")!.focus();
    expect(document.activeElement).toBe(document.querySelector("button"));

    // When we navigate using a wrapped router.
    await router.navigate("/");

    // Then the wrapper falls back on focusing the body or document
    // element when it fails to focus the (sabotaged) H1.
    await waitFor(() =>
      expect([document.body, document.documentElement]).toContain(
        document.activeElement,
      ),
    );
  });

  test("moves focus to the primary focus target", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router);

    // Given a default focus target (an h1 element within main).
    render(
      <React.StrictMode>
        <main>
          <h1></h1>
        </main>
      </React.StrictMode>,
    );

    // And given focus is currently on the body or the document.
    expect([document.body, document.documentElement]).toContain(
      document.activeElement,
    );

    // When we navigate using a wrapped router.
    await router.navigate("/");

    // Then the wrapper causes focus to move to that default focus target.
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector("h1")),
    );
  });
});
