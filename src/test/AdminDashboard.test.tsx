import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminDashboard from "../pages/AdminDashboard";

vi.mock("../lib/auth", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Admin", email: "admin@test.com", role: "admin" },
    loading: false,
  }),
}));

vi.mock("../hooks/use-async", () => ({
  useAsync: () => ({
    data: {
      totalUsers: 10,
      totalPrayers: 20,
      pendingPrayers: 5,
      totalSermons: 15,
      monthlyGiving: 1000,
      activeEvents: 3,
      totalYtd: 12000,
      donorCount: 50,
    },
    loading: false,
    error: null,
  }),
}));

describe("AdminDashboard", () => {
  it("renders without crashing", () => {
    render(<AdminDashboard />);
    expect(screen.getAllByText(/overview/i).length).toBeGreaterThan(0);
  });

  it("displays key statistics", () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/Total Users/i)).toBeDefined();
    expect(screen.getAllByText(/Prayer Requests/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Monthly Giving/i)).toBeDefined();
  });
});
