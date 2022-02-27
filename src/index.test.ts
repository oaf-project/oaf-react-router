/* eslint-disable functional/no-return-void */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-restricted-globals */
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/no-expression-statement */
/* eslint-disable functional/functional-parameters */

import { createBrowserHistory } from "history";
import { wrapHistory } from ".";

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
    const history = createBrowserHistory();
    const unwrap = wrapHistory(history);
    unwrap();
  });

  test("sets the document title after initial render", async () => {
    const history = createBrowserHistory();
    wrapHistory(history, {
      setPageTitle: true,
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    await waitForDomUpdate();

    expect(document.title).toBe("test title");
  });

  test("sets the document title after a navigation", async () => {
    const history = createBrowserHistory();
    wrapHistory(history, {
      setPageTitle: true,
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    history.push("/");

    await waitForDomUpdate();

    expect(document.title).toBe("test title");
  });

  test("does not set the document title when setPageTitle is false", async () => {
    const history = createBrowserHistory();
    wrapHistory(history, {
      setPageTitle: false,
      documentTitle: () => "test title",
    });

    expect(document.title).toBe("");

    history.push("/");

    await waitForDomUpdate();

    expect(document.title).toBe("");
  });

  test("leaves focus alone when repairFocus is false", async () => {
    const history = createBrowserHistory();
    wrapHistory(history, { repairFocus: false });

    const main = document.createElement("main");
    const mainH1 = document.createElement("h1");
    main.append(mainH1);
    const randomButton = document.createElement("button");
    main.append(randomButton);
    document.body.append(main);

    randomButton.focus();
    expect(document.activeElement).toBe(randomButton);

    history.push("/");

    await waitForDomUpdate();

    expect(document.activeElement).toBe(randomButton);
  });

  test("moves focus to body when primary focus target cannot be focused", async () => {
    const history = createBrowserHistory();
    wrapHistory(history);

    const main = document.createElement("main");
    const mainH1 = document.createElement("h1");
    mainH1.focus = () => {};
    main.append(mainH1);
    const randomButton = document.createElement("button");
    main.append(randomButton);
    document.body.append(main);

    randomButton.focus();
    expect(document.activeElement).toBe(randomButton);

    history.push("/");

    await waitForDomUpdate();

    expect([document.body, document.documentElement]).toContain(
      document.activeElement,
    );
  });

  test("moves focus to the primary focus target", async () => {
    const history = createBrowserHistory();
    wrapHistory(history);

    const main = document.createElement("main");
    const mainH1 = document.createElement("h1");
    main.append(mainH1);
    document.body.append(main);

    expect([document.body, document.documentElement]).toContain(
      document.activeElement,
    );

    history.push("/");

    await waitForDomUpdate();

    expect(document.activeElement).toBe(mainH1);
  });
});
