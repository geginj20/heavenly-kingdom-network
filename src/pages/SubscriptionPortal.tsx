import { useState, useEffect } from "react";
import {
  Crown,
  Check,
  Shield,
  Sparkles,
  Heart,
  Globe,

  Loader2,
  HelpCircle,
  Zap,
  Radio,
  BookOpen,
  Users,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import SEO from "../components/SEO";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

const benefits = [
  {
    icon: Radio,
    title: "Exclusive Live Stream Replays",
    desc: "Unlimited access to global prayer summits and archive sermons in high definition.",
  },
  {
    icon: BookOpen,
    title: "Monthly Digital Devotionals",
    desc: "Curated scripture reading plans and ministerial study notes delivered monthly.",
  },
  {
    icon: Heart,
    title: "Global Mission Partner Badge",
    desc: "Special recognition on the Prayer Wall and priority prayer intercession requests.",
  },
  {
    icon: Users,
    title: "Global Believers Community",
    desc: "Direct access to fellowship circles and worldwide ministerial outreach initiatives.",
  },
];

const faqs = [
  {
    q: "How is the 1,000 KES calculated in US Dollars?",
    a: "Our system fetches live exchange rates continuously from financial markets. 1,000 KES converts to approximately $7.50–$8.00 USD depending on current market rates.",
  },
  {
    q: "What payment methods are supported?",
    a: "In Kenya and East Africa, we support M-Pesa, Airtel Money, Visa, and Mastercard via Paystack. Internationally, you can subscribe using PayPal or credit/debit card in USD.",
  },
  {
    q: "Can I cancel or modify my partnership anytime?",
    a: "Yes! There are no long-term contracts. You can manage or cancel your subscription at any time with a single click.",
  },
  {
    q: "Where does my monthly contribution go?",
    a: "100% of your partnership goes toward server infrastructure, gospel broadcasting, scripture distribution, and humanitarian mission outreaches.",
  },
];

export default function SubscriptionPortal() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currencyView, setCurrencyView] = useState<"KES" | "USD">("KES");
  const [exchangeRate, setExchangeRate] = useState<number>(0.00772);
  const [usdPrice, setUsdPrice] = useState<number>(7.72);
  const [loadingRate, setLoadingRate] = useState<boolean>(true);
  const [subscriberName, setSubscriberName] = useState(user?.name || "");
  const [subscriberEmail, setSubscriberEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Load live pricing and exchange rates
  const loadPricing = async () => {
    setLoadingRate(true);
    try {
      const data = await api.subscriptions.getPricing();
      if (data.usdAmount && data.exchangeRate) {
        setUsdPrice(data.usdAmount);
        setExchangeRate(data.exchangeRate);
      }
    } catch {
      // Use standard fallback
      setUsdPrice(7.72);
      setExchangeRate(0.00772);
    } finally {
      setLoadingRate(false);
    }
  };

  useEffect(() => {
    loadPricing();
  }, []);

  // Check user subscription if logged in
  useEffect(() => {
    if (user?.email) {
      api.subscriptions.getStatus(user.email).then((res) => {
        if (res.hasActiveSubscription) {
          setIsSubscribed(true);
        }
      }).catch(() => {});
    }
  }, [user]);

  // Load Paystack script
  useEffect(() => {
    if (paystackKey && !window.PaystackPop) {
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.async = true;
      document.body.appendChild(s);
      return () => {
        if (document.body.contains(s)) document.body.removeChild(s);
      };
    }
  }, []);

  // Handle Paystack callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paystack_callback") === "1") {
      const ref = params.get("reference");
      if (ref) {
        api.subscriptions.verify(ref).then((res) => {
          if (res.status === "success") {
            setIsSubscribed(true);
            showToast("Welcome to the Kingdom Mission Network family! Subscription active.", "success");
          }
        }).catch(() => {
          showToast("Failed to verify subscription. Please reach out to support.", "error");
        });
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [showToast]);

  const handlePaystackSubscribe = async () => {
    if (!subscriberEmail) {
      showToast("Please enter your email address to continue", "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.subscriptions.initialize({
        email: subscriberEmail,
        name: subscriberName || "Kingdom Partner",
        currency: "KES",
      });

      if (data.authorization_url && window.PaystackPop) {
        const popup = window.PaystackPop.setup({
          key: paystackKey,
          email: subscriberEmail,
          amount: 1000 * 100, // 1000 KES in cents
          currency: "KES",
          ref: data.reference || `SUB-${Date.now()}`,
          callback: () => {
            setIsSubscribed(true);
            showToast("Thank you! Your Kingdom Partner subscription is active.", "success");
          },
          onClose: () => {
            showToast("Subscription checkout closed.", "info");
          },
          metadata: {
            name: subscriberName || "Kingdom Partner",
            subscriptionType: "kingdom_partner",
            kesAmount: 1000,
            usdAmount: usdPrice,
          },
        });
        popup.openIframe();
      } else if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      showToast("Failed to initialize subscription. Please check your details.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayPalSubscribe = async () => {
    if (!subscriberEmail) {
      showToast("Please enter your email address", "error");
      return;
    }
    if (!window.paypal) {
      showToast("PayPal is loading. Please try again shortly.", "info");
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.subscriptions.paypalCreate({
        name: subscriberName || "Kingdom Partner",
        email: subscriberEmail,
      });

      window.paypal.Buttons({
        createOrder: () => Promise.resolve(order.id),
        onApprove: async (data: { orderID: string }) => {
          const capture = await api.subscriptions.paypalCapture({
            orderId: data.orderID,
            subscriberName: subscriberName || "Kingdom Partner",
          });
          if (capture.status === "COMPLETED") {
            setIsSubscribed(true);
            showToast("Welcome! Your USD subscription is now active.", "success");
          }
        },
        onError: () => {
          showToast("PayPal subscription processing failed.", "error");
          setSubmitting(false);
        },
      }).render("#paypal-subscription-container");
    } catch {
      showToast("Failed to initialize PayPal order.", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-[72px] min-h-screen bg-[#0c1b33] text-white">
      <SEO
        title="Kingdom Partner Subscription — 1,000 KES"
        description="Become a monthly Kingdom Partner for 1,000 KES (computed live in USD). Support global gospel outreach, youth revivals, and biblical education."
      />

      {/* Hero Header */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-radial-gradient from-[#d4af37]/10 via-transparent to-transparent pointer-events-none" />
        <div className="container-main mx-auto text-center max-w-3xl relative z-10">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 text-sm font-semibold mb-6">
              <Crown className="w-4 h-4" />
              <span>Kingdom Partner Initiative</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6">
              Empower the Mission with <span className="text-[#d4af37]">1,000 KES</span> / Month
            </h1>
            <p className="text-white/70 text-lg md:text-xl leading-relaxed mb-8">
              Join a dedicated covenant of partners broadcasting truth, supporting local communities, and building the Heavenly Kingdom network worldwide.
            </p>

            {/* Live Exchange Rate Badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-3 p-2 px-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-sm text-white/80">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Currency Exchange:
              </span>
              <span className="font-semibold text-white">
                1,000 KES = ${usdPrice.toFixed(2)} USD
              </span>
              <span className="text-xs text-white/50">
                (1 USD ≈ {(1 / exchangeRate).toFixed(2)} KES)
              </span>
              <button
                onClick={loadPricing}
                disabled={loadingRate}
                title="Refresh live exchange rate"
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRate ? "animate-spin" : ""}`} />
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Main Pricing & Subscription Section */}
      <section className="py-16 px-4">
        <div className="container-main mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Benefits & Vision */}
            <div className="lg:col-span-6 space-y-8">
              <ScrollReveal>
                <div className="space-y-4">
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                    What Your Partnership Unlocks
                  </h2>
                  <p className="text-white/70 leading-relaxed">
                    Your continuous monthly support directly fuels gospel operations, broadcast studios, and humanitarian relief efforts across Africa and globally.
                  </p>
                </div>

                <div className="grid gap-4 mt-6">
                  {benefits.map((b, idx) => {
                    const Icon = b.icon;
                    return (
                      <motion.div
                        key={b.title}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#d4af37]/40 transition-all flex gap-4 items-start"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center shrink-0 text-[#d4af37]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-base">{b.title}</h3>
                          <p className="text-white/60 text-sm mt-0.5">{b.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Trust and Guarantee */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-4 text-sm text-white/70">
                  <Shield className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-medium text-white">100% Secure & Cancel Anytime</p>
                    <p className="text-xs text-white/50 mt-0.5">Encrypted payment gateways with zero hidden fees.</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Interactive Subscription Tier Card */}
            <div className="lg:col-span-6">
              <ScrollReveal delay={150}>
                <div className="relative rounded-3xl p-8 bg-gradient-to-b from-white/[0.08] to-white/[0.02] border-2 border-[#d4af37]/50 shadow-2xl backdrop-blur-xl">
                  <div className="absolute -top-3.5 right-6 px-4 py-1 rounded-full bg-[#d4af37] text-[#0c1b33] text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Standard Tier
                  </div>

                  {isSubscribed ? (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8" />
                      </div>
                      <h3 className="font-display text-2xl font-bold text-white">Active Kingdom Partner</h3>
                      <p className="text-white/70 text-sm max-w-sm mx-auto">
                        Your monthly subscription is active. Thank you for standing with the Kingdom Mission Network!
                      </p>
                      <button
                        onClick={() => setIsSubscribed(false)}
                        className="text-xs text-[#d4af37] hover:underline"
                      >
                        Subscribe on another account
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Currency switcher */}
                      <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                        <div>
                          <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Plan</span>
                          <h3 className="font-display text-xl font-bold text-white">Kingdom Partner</h3>
                        </div>

                        <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
                          <button
                            onClick={() => setCurrencyView("KES")}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                              currencyView === "KES"
                                ? "bg-[#d4af37] text-[#0c1b33] shadow"
                                : "text-white/70 hover:text-white"
                            }`}
                          >
                            KES
                          </button>
                          <button
                            onClick={() => setCurrencyView("USD")}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                              currencyView === "USD"
                                ? "bg-[#d4af37] text-[#0c1b33] shadow"
                                : "text-white/70 hover:text-white"
                            }`}
                          >
                            USD
                          </button>
                        </div>
                      </div>

                      {/* Pricing Display */}
                      <div className="mb-8">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-5xl font-bold text-white">
                            {currencyView === "KES" ? "1,000" : `$${usdPrice.toFixed(2)}`}
                          </span>
                          <span className="text-xl text-[#d4af37] font-semibold">
                            {currencyView === "KES" ? "KES" : "USD"}
                          </span>
                          <span className="text-white/50 text-sm">/ month</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          {currencyView === "KES"
                            ? `≈ $${usdPrice.toFixed(2)} USD calculated at live exchange rate`
                            : `Fixed baseline equivalent of 1,000 KES`}
                        </p>
                      </div>

                      {/* Subscriber details form */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                            Full Name
                          </label>
                          <input
                            type="text"
                            placeholder="Your full name"
                            value={subscriberName}
                            onChange={(e) => setSubscriberName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                            Email Address <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="your.email@example.com"
                            value={subscriberEmail}
                            onChange={(e) => setSubscriberEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                          />
                        </div>
                      </div>

                      {/* Payment Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={handlePaystackSubscribe}
                          disabled={submitting}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-[#0c1b33] font-bold text-base shadow-lg hover:shadow-[#d4af37]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Zap className="w-5 h-5" />
                          )}
                          <span>Subscribe with M-Pesa / Card (1,000 KES)</span>
                        </button>

                        <button
                          onClick={handlePayPalSubscribe}
                          disabled={submitting}
                          className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 transition-all flex items-center justify-center gap-2"
                        >
                          <Globe className="w-4 h-4 text-sky-400" />
                          <span>International Checkout via PayPal (${usdPrice.toFixed(2)} USD)</span>
                        </button>

                        <div id="paypal-subscription-container" className="mt-3" />
                      </div>

                      <p className="text-[11px] text-white/40 text-center mt-5 leading-relaxed">
                        Automatic monthly billing · Cancel anytime via email confirmation or dashboard.
                      </p>
                    </>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-16 px-4 border-t border-white/10 bg-black/20">
        <div className="container-main mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <HelpCircle className="w-10 h-10 text-[#d4af37] mx-auto mb-3" />
              <h2 className="font-display text-3xl font-bold text-white">Frequently Asked Questions</h2>
              <p className="text-white/60 text-sm mt-2">Everything you need to know about the 1,000 KES partner subscription.</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between font-semibold text-white text-base hover:bg-white/[0.02] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-[#d4af37] text-lg font-bold">
                      {activeFaq === idx ? "−" : "+"}
                    </span>
                  </button>
                  {activeFaq === idx && (
                    <div className="px-6 pb-4 text-sm text-white/70 leading-relaxed border-t border-white/[0.04] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
