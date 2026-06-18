import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import App from "../App";

describe("App", () => {
  it("renders without crashing", async () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );
    const headings = await screen.findAllByText(/Kingdom Mission Network/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("renders navigation links in the nav", async () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );
    const scriptures = await screen.findAllByText(/Scriptures/i);
    expect(scriptures.length).toBeGreaterThanOrEqual(1);
    const prayerWall = await screen.findAllByText(/Prayer Wall/i);
    expect(prayerWall.length).toBeGreaterThanOrEqual(1);
  });
});
