import { createBrowserHistory, History } from "history";
import { wrapHistory } from ".";

// tslint:disable-next-line: no-commented-code
// tslint:disable: no-expression-statement
// tslint:disable: object-literal-sort-keys
// tslint:disable: no-duplicate-string
// tslint:disable: no-object-mutation

// HACK: wait for history wrapper to update DOM.
const waitForDomUpdate = () => new Promise(resolve => setTimeout(resolve));

beforeEach(() => {
  // Clear previous test's DOM.
  window.document.body.innerHTML = "";
  window.document.title = "";
});

describe("oaf-react-router", () => {
  test("doesn't throw when wrapping and unwrapping history", () => {
    const history: History<unknown> = createBrowserHistory();
    const unwrap = wrapHistory(history);
    unwrap();
  });

  test("sets the document title", async () => {
    const history: History<unknown> = createBrowserHistory();
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
    const history: History<unknown> = createBrowserHistory();
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
    const history: History<unknown> = createBrowserHistory();
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
    const history: History<unknown> = createBrowserHistory();
    wrapHistory(history);

    const main = document.createElement("main");
    const mainH1 = document.createElement("h1");
    // tslint:disable-next-line: no-empty
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
    const history: History<unknown> = createBrowserHistory();
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
