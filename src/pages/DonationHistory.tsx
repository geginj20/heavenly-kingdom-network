import { useState, useEffect, useCallback } from "react";
import { DollarSign, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { api } from "../lib/api";

export default function DonationHistory() {
  const [donations, setDonations] = useState<{ amount: number; donor_name: string; donor_email: string; recurring: boolean; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const fetchHistory = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;
    setLoading(true);
    const data = await api.donations.history(email);
    setDonations(data);
    setLoading(false);
    localStorage.setItem("hkn-donation-email", email);
  }, [email]);

  useEffect(() => {
    const saved = localStorage.getItem("hkn-donation-email");
    if (saved) {
      setEmail(saved);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (email) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return (
    <div className="pt-[72px] min-h-screen bg-[#e6eef7]">
      <SEO title="Giving History" description="View your donation history." />
      <div className="bg-[#0c1b33] py-12 px-4">
        <div className="container-main mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white">Giving History</h1>
          <p className="text-white/60 mt-2">View your past donations to Heavenly Kingdom Network.</p>
        </div>
      </div>

      <div className="container-main mx-auto px-4 sm:px-6 py-10">
        {!email ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#0c1b33]/5 p-8 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-7 h-7 text-[#d4af37]" />
            </div>
            <h2 className="font-display text-xl font-semibold text-[#0c1b33] text-center mb-2">Find Your Donations</h2>
            <p className="text-sm text-[#6b7c93] text-center mb-6">Enter the email you used when donating.</p>
            <form onSubmit={fetchHistory} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
              />
              <button type="submit" className="w-full btn-gold flex items-center justify-center gap-2">
                View History
              </button>
            </form>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#0c1b33]/5 p-8 max-w-md mx-auto text-center">
            <DollarSign className="w-12 h-12 text-[#6b7c93]/30 mx-auto mb-3" />
            <p className="text-[#6b7c93]">No donations found</p>
            <p className="text-sm text-[#6b7c93]/70 mt-1">Donations made with {email} will appear here.</p>
            <Link to="/#give" className="mt-4 inline-block text-[#d4af37] font-medium text-sm hover:underline">
              Make a donation
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#6b7c93]">{donations.length} donation{donations.length !== 1 ? "s" : ""} found</p>
            </div>
            {donations.map((d, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-[#0c1b33]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#d4af37]" />
                  </div>
                  <div>
                    <p className="text-[#0c1b33] font-medium">${d.amount.toFixed(2)}</p>
                    <p className="text-xs text-[#6b7c93]">{new Date(d.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                {d.recurring && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Monthly</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
