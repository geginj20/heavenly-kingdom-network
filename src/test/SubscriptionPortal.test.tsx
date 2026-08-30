import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SubscriptionPortal from "../pages/SubscriptionPortal";
import { HelmetProvider } from "react-helmet-async";

vi.mock("../lib/api", () => ({
  api: {
    subscriptions: {
      getPricing: vi.fn().mockResolvedValue({
        planName: "Kingdom Partner",
        kesAmount: 1000,
        usdAmount: 7.72,
        exchangeRate: 0.00772,
        interval: "monthly",
        provider: "exchangerate-api",
        description: "Monthly partnership subscription",
      }),
      getStatus: vi.fn().mockResolvedValue({ hasActiveSubscription: false }),
    },
  },
}));

vi.mock("../lib/auth", () => ({
  useAuth: () => ({ user: null }),
}));

describe("SubscriptionPortal", () => {
  it("renders 1000 KES pricing and partner heading", async () => {
    render(
      <HelmetProvider>
        <SubscriptionPortal />
      </HelmetProvider>
    );
    const elements = await screen.findAllByText(/1,000 KES/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(await screen.findByText(/Kingdom Partner Initiative/i)).toBeDefined();
  });

  it("renders live currency exchange calculation", async () => {
    render(
      <HelmetProvider>
        <SubscriptionPortal />
      </HelmetProvider>
    );
    const badges = await screen.findAllByText(/1,000 KES = \$7.72 USD/i);
    expect(badges.length).toBeGreaterThan(0);
  });
});
