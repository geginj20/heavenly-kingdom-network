import { useState, useEffect } from "react";
import { Heart, Shield, Receipt, Check, Loader2, Globe } from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { useToast } from "../../lib/toast";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const presetAmounts = [10, 25, 50, 100, 250];

const currencies = [
  { code: "KES", label: "KES - Kenyan Shilling", symbol: "KSh", countries: ["KE"] },
  { code: "USD", label: "USD - US Dollar", symbol: "$", countries: ["US", "GB", "CA", "AU", "DE", "FR", "NL", "others"] },
  { code: "EUR", label: "EUR - Euro", symbol: "€", countries: ["DE", "FR", "NL", "IT", "ES", "BE"] },
  { code: "GBP", label: "GBP - British Pound", symbol: "£", countries: ["GB"] },
  { code: "NGN", label: "NGN - Nigerian Naira", symbol: "₦", countries: ["NG"] },
  { code: "GHS", label: "GHS - Ghana Cedi", symbol: "GH₵", countries: ["GH"] },
  { code: "ZAR", label: "ZAR - South African Rand", symbol: "R", countries: ["ZA"] },
  { code: "TZS", label: "TZS - Tanzanian Shilling", symbol: "TSh", countries: ["TZ"] },
  { code: "UGX", label: "UGX - Ugandan Shilling", symbol: "USh", countries: ["UG"] },
  { code: "RWF", label: "RWF - Rwandan Franc", symbol: "FRw", countries: ["RW"] },
];

declare global {
  interface Window {
    PaystackPop: { setup: (config: { key: string; email: string; amount: number; currency: string; ref: string; callback: (response: { reference: string }) => void; onClose: () => void; metadata?: Record<string, unknown> }) => { openIframe: () => void } };
    paypal: { Buttons: (config: { createOrder: () => Promise<string>; onApprove: (data: { orderID: string }) => Promise<void>; onError: (err: unknown) => void; style?: Record<string, string> }) => { render: (el: string) => void } };
  }
}

const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

function generateRef() {
  return `KMN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function GiveSection() {
  const [amount, setAmount] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState("");
  const [recurring, setRecurring] = useState<"one-time" | "monthly">("one-time");
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState("KES");
  const [paymentMethod, setPaymentMethod] = useState<"auto" | "paypal">("auto");
  const { user } = useAuth();
  const [donorName, setDonorName] = useState(user?.name || "");
  const [donorEmail, setDonorEmail] = useState(user?.email || "");
  const [showSuccess, setShowSuccess] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (paystackKey) {
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.async = true;
      document.body.appendChild(s);
      return () => { document.body.removeChild(s); };
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paystack_callback") === "1") {
      const ref = params.get("reference");
      if (ref) {
        api.payments.verify(ref).then((res) => {
          const r = res as { status: string };
          if (r.status === "success") {
            setShowSuccess(true);
            showToast("Payment successful! Thank you!", "success");
          }
        });
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [showToast]);

  const handlePaystack = async () => {
    const finalAmount = amount === "custom" ? customAmount : String(amount);
    if (!finalAmount || Number(finalAmount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    if (!donorEmail) {
      showToast("Please enter your email", "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.payments.initialize({
        email: donorEmail,
        amount: Number(finalAmount),
        currency,
        metadata: { name: donorName || "Anonymous" },
      }) as { authorization_url?: string; reference?: string; access_code?: string };

      if (data.authorization_url && window.PaystackPop) {
        const popup = window.PaystackPop.setup({
          key: paystackKey,
          email: donorEmail,
          amount: Number(finalAmount) * 100,
          currency,
          ref: data.reference || generateRef(),
          callback: () => {
            setShowSuccess(true);
            showToast("Thank you for your gift!", "success");
            setAmount(50);
            setCustomAmount("");
          },
          onClose: () => {
            showToast("Payment cancelled.", "info");
          },
          metadata: { name: donorName || "Anonymous" },
        });
        popup.openIframe();
      } else if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      showToast("Failed to process payment. Please try again.", "error");
    }
    setSubmitting(false);
  };

  const handleGive = async () => {
    if (paymentMethod === "paypal") {
      if (!window.paypal) {
        showToast("PayPal is loading. Please try again.", "info");
        return;
      }
      setSubmitting(true);
      const finalAmount = amount === "custom" ? customAmount : String(amount);
      if (!finalAmount || Number(finalAmount) <= 0) {
        showToast("Please enter a valid amount", "error");
        setSubmitting(false);
        return;
      }
      try {
        const order = await api.payments.paypalCreate({ amount: Number(finalAmount), currency: "USD" }) as { id: string };
        window.paypal.Buttons({
          createOrder: () => Promise.resolve(order.id),
          onApprove: async (data) => {
            const capture = await api.payments.paypalCapture({ orderId: data.orderID }) as { status: string };
            if (capture.status === "COMPLETED") {
              setShowSuccess(true);
              showToast("Thank you for your gift!", "success");
              setAmount(50);
              setCustomAmount("");
            }
          },
          onError: () => {
            showToast("PayPal payment failed.", "error");
            setSubmitting(false);
          },
        }).render("#paypal-button-container");
      } catch {
        showToast("Failed to create PayPal order.", "error");
        setSubmitting(false);
      }
      return;
    }
    await handlePaystack();
  };

  if (!paystackKey) {
    return (
      <section id="give" className="bg-white section-padding">
        <div className="container-main mx-auto text-center max-w-lg">
          <ScrollReveal>
            <div className="w-20 h-20 rounded-full bg-[#f8f6f3] flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-[#d4af37]" />
            </div>
            <h2 className="font-display text-3xl font-bold text-[#0c1b33] mb-3">Support the Mission</h2>
            <p className="text-[#6b7c93] mb-4">Online giving is coming soon. Until then, you can support us through:</p>
            <div className="bg-[#f8f6f3] rounded-xl p-6 text-left space-y-3 mb-8">
              <p><strong className="text-[#0c1b33]">Bank Transfer</strong><br /><span className="text-sm text-[#6b7c93]">Contact us for bank details</span></p>
              <p><strong className="text-[#0c1b33]">M-Pesa Paybill</strong><br /><span className="text-sm text-[#6b7c93]">Business Number: TBD · Account: KMN</span></p>
              <p><strong className="text-[#0c1b33]">Email</strong><br /><span className="text-sm text-[#6b7c93]">giving@heavenlykingdom.network</span></p>
            </div>
            <p className="text-sm text-[#6b7c93]">We'll notify you when online payments are live!</p>
          </ScrollReveal>
        </div>
      </section>
    );
  }

  if (showSuccess) {
    return (
      <section id="give" className="bg-white section-padding">
        <div className="container-main mx-auto text-center max-w-lg">
          <ScrollReveal>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-[#0c1b33] mb-3">Thank You!</h2>
            <p className="text-[#6b7c93] mb-8">Your generous gift makes a difference. A receipt will be sent to your email.</p>
            <button onClick={() => setShowSuccess(false)} className="btn-gold">Give Again</button>
          </ScrollReveal>
        </div>
      </section>
    );
  }

  return (
    <section id="give" className="bg-white section-padding">
      <div className="container-main mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#0c1b33] mb-3">
              Support the Mission
            </h2>
            <p className="text-[#6b7c93] text-lg max-w-xl mx-auto">
              Your giving helps us maintain this free platform and extend the Gospel worldwide.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="max-w-lg mx-auto">
            {/* Currency Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0c1b33] mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  setPaymentMethod(e.target.value === "KES" ? "auto" : "paypal");
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-center gap-2 p-1 bg-[#e6eef7] rounded-full mb-8">
              <button
                onClick={() => setRecurring("one-time")}
                className={`flex-1 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  recurring === "one-time"
                    ? "bg-white text-[#0c1b33] shadow-sm"
                    : "text-[#6b7c93] hover:text-[#0c1b33]"
                }`}
              >
                One-time
              </button>
              <button
                onClick={() => setRecurring("monthly")}
                className={`flex-1 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  recurring === "monthly"
                    ? "bg-white text-[#0c1b33] shadow-sm"
                    : "text-[#6b7c93] hover:text-[#0c1b33]"
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Amount Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
              {presetAmounts.map((preset) => {
                const sym = currencies.find(c => c.code === currency)?.symbol || "$";
                return (
                  <button
                    key={preset}
                    onClick={() => { setAmount(preset); setCustomAmount(""); }}
                    className={`py-3 rounded-xl text-lg font-semibold transition-all duration-300 ${
                      amount === preset
                        ? "bg-[#d4af37] text-[#0c1b33] shadow-md"
                        : "bg-[#f8f6f3] text-[#0c1b33] hover:bg-[#e6eef7]"
                    }`}
                  >
                    {sym}{preset}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7c93] text-lg font-medium">
                  {currencies.find(c => c.code === currency)?.symbol || "$"}
                </span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setAmount("custom"); }}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-lg font-semibold"
                />
              </div>
            </div>

            {/* Donor Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                />
              </div>
            </div>

            {/* Payment Method Indicator */}
            {currency !== "KES" && (
              <div className="mb-4 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs text-center">
                International donations processed via PayPal · No account needed
              </div>
            )}

            {/* PayPal Button Container */}
            <div id="paypal-button-container" className="mb-4" />

            {/* Give Button */}
            <button
              onClick={handleGive}
              disabled={submitting}
              className="w-full btn-gold text-lg font-semibold py-4 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className="w-5 h-5" />
              )}
              {submitting ? "Processing..." : recurring === "monthly" ? "Give Monthly" : "Give with Love"}
            </button>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t border-[#0c1b33]/5">
              <div className="flex items-center gap-2 text-sm text-[#6b7c93]">
                <Shield className="w-4 h-4 text-green-600" />
                Secure SSL
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6b7c93]">
                <Receipt className="w-4 h-4 text-[#d4af37]" />
                Tax Deductible
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6b7c93]">
                <Check className="w-4 h-4 text-green-600" />
                100% to Ministry
              </div>
            </div>

            <p className="text-xs text-[#6b7c93]/60 text-center mt-4">
              {currency === "KES"
                ? "Payments processed securely by Paystack · M-Pesa & cards accepted"
                : "Payments processed securely by PayPal"
              }
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
