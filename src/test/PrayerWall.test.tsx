import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrayerWall from "../pages/PrayerWall";

vi.mock("../lib/api", () => ({
  api: {
    prayers: {
      getCategories: vi.fn().mockResolvedValue(["All Prayers", "Healing", "Guidance"]),
      list: vi.fn().mockResolvedValue([
        { id: "1", name: "John", category: "Healing", text: "Please pray for my mother.", prayers: 5, comments: 2, timestamp: "2023-01-01" },
        { id: "2", name: "Jane", category: "Guidance", text: "Need guidance for my new job.", prayers: 10, comments: 0, timestamp: "2023-01-02" },
      ]),
    },
  },
}));

describe("PrayerWall", () => {
  it("renders the prayer wall heading", async () => {
    render(<PrayerWall />);
    expect(await screen.findByText(/Community Prayer Wall|Prayer Wall/i)).toBeDefined();
  });

  it("displays prayer requests from the mock data", async () => {
    render(<PrayerWall />);
    expect(await screen.findByText(/Please pray for my mother./i)).toBeDefined();
    expect(await screen.findByText(/Need guidance for my new job./i)).toBeDefined();
  });
});
