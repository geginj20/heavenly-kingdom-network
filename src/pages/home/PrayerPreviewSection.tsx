import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HandHeart, MessageCircle, Send, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "../../components/ScrollReveal";
import { api } from "../../lib/api";
import type { PrayerRequest } from "../../data/demoData";
import { useToast } from "../../lib/toast";

export default function PrayerPreviewSection() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", category: "Guidance", text: "" });
  const { showToast } = useToast();

  useEffect(() => {
    api.prayers.list().then((data) => {
      setPrayers(data.slice(0, 4));
      setLoading(false);
    });
  }, []);

  const handlePray = async (id: string) => {
    await api.prayers.pray(id);
    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, prayers: (p.prayers || 0) + 1 } : p))
    );
    showToast("Your prayer has been counted!", "success");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) return;

    const created = await api.prayers.submit(form);
    setPrayers((prev) => [created, ...prev.slice(0, 3)]);
    setForm({ name: "", category: "Guidance", text: "" });
    showToast("Prayer request submitted!", "success");

    setTimeout(() => {
      setPrayers((prev) =>
        prev.map((p) => (p.id === created.id ? { ...p, isNew: false } : p))
      );
    }, 3000);
  };

  return (
    <section className="bg-[#e6eef7] section-padding">
      <div className="container-main mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#0c1b33] mb-3">
              Prayer Wall
            </h2>
            <p className="text-[#6b7c93] text-lg max-w-xl mx-auto">
              Share your prayer requests and pray for others around the world.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-5 gap-8">
          <ScrollReveal className="lg:col-span-2">
            <div className="bg-[#f5f0e8] rounded-2xl p-6 lg:sticky lg:top-24">
              <h3 className="font-display text-2xl font-semibold text-[#0c1b33] mb-4">
                Submit a Prayer Request
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0c1b33] mb-1">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0c1b33] mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                  >
                    {["Healing", "Family", "Ministry", "Finances", "Guidance", "Salvation", "Relationships", "Other"].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0c1b33] mb-1">
                    Prayer Request
                  </label>
                  <textarea
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    placeholder="Share your prayer request..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm resize-none"
                  />
                  <p className="text-xs text-[#6b7c93] mt-1 text-right">{form.text.length}/500</p>
                </div>
                <button type="submit" className="w-full btn-gold flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Prayer Request
                </button>
              </form>
            </div>
          </ScrollReveal>

          <div className="lg:col-span-3 space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
              </div>
            ) : prayers.length === 0 ? (
              <div className="text-center py-12">
                <HandHeart className="w-10 h-10 text-[#6b7c93]/30 mx-auto mb-3" />
                <p className="text-[#6b7c93]">No prayers yet</p>
              </div>
            ) : (
              prayers.map((prayer, index) => (
                <ScrollReveal key={prayer.id} delay={index * 80}>
                  <motion.div
                    initial={prayer.isNew ? { opacity: 0, y: 20, scale: 0.98 } : false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`bg-[#f5f0e8] rounded-2xl p-5 transition-shadow duration-300 hover:shadow-lg ${
                      prayer.isNew ? "prayer-glow" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0c1b33]/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#0c1b33]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0c1b33]">
                            {prayer.anonymous ? "Anonymous" : prayer.name}
                          </p>
                          <p className="text-xs text-[#6b7c93]">{prayer.timestamp}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#8b5e3c] text-xs font-medium">
                        {prayer.category}
                      </span>
                    </div>

                    <p className="text-[#0c1b33] leading-relaxed mb-4">{prayer.text}</p>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handlePray(prayer.id)}
                        className="flex items-center gap-2 text-sm text-[#6b7c93] hover:text-[#d4af37] transition-colors"
                      >
                        <HandHeart className="w-4 h-4" />
                        <span>{prayer.prayers || 0} prayers</span>
                      </button>
                      <span className="flex items-center gap-2 text-sm text-[#6b7c93]">
                        <MessageCircle className="w-4 h-4" />
                        <span>{prayer.comments || 0} comments</span>
                      </span>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))
            )}

            <ScrollReveal>
              <Link
                to="/prayer-wall"
                className="block text-center py-4 text-[#8b5e3c] font-medium hover:text-[#d4af37] transition-colors"
              >
                View All Prayer Requests →
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}