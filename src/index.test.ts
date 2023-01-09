/* eslint-disable functional/no-return-void */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable functional/functional-parameters */

import { createBrowserRouter } from "react-router-dom";
import { wrapRouter } from ".";

// HACK: wait for history wrapper to update DOM.
const waitForDomUpdate = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve));

beforeEach(() => {
  // Clear previous test's DOM.
  window.document.body.innerHTML = "";
  window.document.title = "";
});

describe("oaf-react-router", () => {
  // eslint-disable-next-line jest/expect-expect
  test("doesn't throw when wrapping and unwrapping history", () => {
    const router = createBrowserRouter([{}]);
    const unwrap = wrapRouter(router);
    unwrap();
  });

  test("sets the document title after initial render", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, {
      setPageTitle: true,
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    await waitForDomUpdate();

    expect(document.title).toBe("test title");
  });

  test("sets the document title after a navigation", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, {
      setPageTitle: true,
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    router.navigate("/");

    await waitForDomUpdate();

    expect(document.title).toBe("test title");
  });

  test("does not set the document title when setPageTitle is false", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, {
      setPageTitle: false,
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    router.navigate("/");

    await waitForDomUpdate();

    expect(document.title).toBe("");
  });

  test("leaves focus alone when repairFocus is false", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router, { repairFocus: false });

    const main = document.createElement("main");
    const mainH1 = document.createElement("h1");
    main.append(mainH1);
    const randomButton = document.createElement("button");
    main.append(randomButton);
    document.body.append(main);

    randomButton.focus();
    expect(document.activeElement).toBe(randomButton);

    router.navigate("/");

    await waitForDomUpdate();

    expect(document.activeElement).toBe(randomButton);
  });

  test("moves focus to body when primary focus target cannot be focused", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router);

    const main = document.createElement("main");
    const mainH1 = document.createElement("h1");
    mainH1.focus = () => {};
    main.append(mainH1);
    const randomButton = document.createElement("button");
    main.append(randomButton);
    document.body.append(main);

    randomButton.focus();
    expect(document.activeElement).toBe(randomButton);

    router.navigate("/");

    await waitForDomUpdate();

    expect([document.body, document.documentElement]).toContain(
      document.activeElement,
    );
  });

  test("moves focus to the primary focus target", async () => {
    const router = createBrowserRouter([{}]);
    wrapRouter(router);

    const main = document.createElement("main");
    const mainH1 = document.createElement("h1");
    main.append(mainH1);
    document.body.append(main);

    expect([document.body, document.documentElement]).toContain(
      document.activeElement,
    );

    router.navigate("/");

    await waitForDomUpdate();

    expect(document.activeElement).toBe(mainH1);
  });
});
