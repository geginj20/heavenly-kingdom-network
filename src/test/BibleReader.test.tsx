import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HashRouter } from "react-router-dom";
import BibleReader from "../pages/BibleReader";

vi.mock("../lib/api", () => ({
  api: {
    bible: {
      books: vi.fn().mockResolvedValue({
        books: [{ name: "Genesis", testament: "old", chapters: 50 }],
        translations: ["kjv"],
        translationNames: { kjv: "King James Version" },
      }),
      verses: vi.fn().mockResolvedValue({
        verses: [
          { verse: 1, text: "In the beginning God created the heavens and the earth." },
        ],
        book: "Genesis",
        chapter: 1,
        translation: "kjv",
        translationName: "King James Version",
      }),
    },
  },
}));

describe("BibleReader", () => {
  it("renders the bible reader layout", async () => {
    render(
      <HashRouter>
        <BibleReader />
      </HashRouter>
    );
    expect(await screen.findByText(/Holy Bible/i)).toBeDefined();
  });

  it("displays the scripture content", async () => {
    render(
      <HashRouter>
        <BibleReader />
      </HashRouter>
    );
    expect(await screen.findByText(/In the beginning God created the heavens and the earth/i)).toBeDefined();
  });
});
