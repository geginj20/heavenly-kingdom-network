import { useState } from "react";
import { Heart, Shield, Receipt, Check } from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { useToast } from "../../lib/toast";

const presetAmounts = [10, 25, 50, 100, 250];

export default function GiveSection() {
  const [amount, setAmount] = useState<number | "custom">(50);
  const [customAmount, setCustomAmount] = useState("");
  const [recurring, setRecurring] = useState<"one-time" | "monthly">("one-time");
  const { showToast } = useToast();

  const handleGive = () => {
    const finalAmount = amount === "custom" ? customAmount : String(amount);
    if (!finalAmount || Number(finalAmount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    showToast(`Thank you for your $${finalAmount} gift! Processing...`, "success");
  };

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
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount("");
                  }}
                  className={`py-3 rounded-xl text-lg font-semibold transition-all duration-300 ${
                    amount === preset
                      ? "bg-[#d4af37] text-[#0c1b33] shadow-md"
                      : "bg-[#f8f6f3] text-[#0c1b33] hover:bg-[#e6eef7]"
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-8">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7c93] text-lg font-medium">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setAmount("custom");
                  }}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-lg font-semibold"
                />
              </div>
            </div>

            {/* Give Button */}
            <button
              onClick={handleGive}
              className="w-full btn-gold text-lg font-semibold py-4 flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              {recurring === "monthly" ? "Give Monthly" : "Give with Love"}
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
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
