import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  HandHeart,
  MessageCircle,
  Send,
  User,
  Filter,
  Share2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import { demoPrayers, prayerCategories } from "../data/demoData";
import type { PrayerRequest } from "../data/demoData";
import { useToast } from "../lib/toast";

const prayerSchema = z.object({
  name: z.string().max(50, "Name must be under 50 characters").optional().or(z.literal("")),
  category: z.string().min(1, "Please select a category"),
  text: z.string().min(10, "Prayer request must be at least 10 characters").max(500, "Prayer request must be under 500 characters"),
});

type PrayerForm = z.infer<typeof prayerSchema>;

export default function PrayerWall() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>(demoPrayers);
  const [activeCategory, setActiveCategory] = useState("All Prayers");
  const [prayerCounts, setPrayerCounts] = useState<Record<string, number>>({});
  const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit: handleFormSubmit,
    reset,
    formState: { errors },
  } = useForm<PrayerForm>({
    resolver: zodResolver(prayerSchema),
    defaultValues: { name: "", category: "Guidance", text: "" },
  });

  // Sacred spotlight effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty("--x", `${x}px`);
      container.style.setProperty("--y", `${y}px`);
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const filteredPrayers =
    activeCategory === "All Prayers"
      ? prayers
      : prayers.filter((p) => p.category === activeCategory);

  const handlePray = (id: string) => {
    setPrayerCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    showToast("Your prayer has been counted!", "success");
  };

  const onSubmit = (data: PrayerForm) => {
    const newPrayer: PrayerRequest = {
      id: `new-${crypto.randomUUID()}`,
      name: data.name || "Anonymous",
      anonymous: !data.name,
      category: data.category,
      text: data.text,
      prayers: 0,
      timestamp: "Just now",
      comments: 0,
      isNew: true,
    };

    setPrayers((prev) => [newPrayer, ...prev]);
    reset({ name: "", category: "Guidance", text: "" });
    showToast("Prayer request submitted!", "success");

    setTimeout(() => {
      setPrayers((prev) =>
        prev.map((p) => (p.id === newPrayer.id ? { ...p, isNew: false } : p))
      );
    }, 3000);
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    setReplyText("");
    setExpandedPrayer(null);
    showToast("Reply posted!", "success");
  };

  return (
    <div className="pt-[72px] min-h-screen bg-[#e6eef7]">
      {/* Header */}
      <div className="bg-[#0c1b33] py-16 px-4">
        <div className="container-main mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">
            Prayer Wall
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Share your prayer requests and join a global community of believers praying for one
            another.
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="container-main mx-auto px-4 sm:px-6 py-10 relative"
      >
        {/* Sacred spotlight overlay */}
        <div
          className="absolute inset-0 sacred-spotlight pointer-events-none opacity-50 lg:opacity-100"
        />

        <div className="relative z-10 grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ScrollReveal>
              <div className="bg-white rounded-2xl p-5 shadow-sm lg:sticky lg:top-24">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-4 h-4 text-[#6b7c93]" />
                  <h3 className="font-display text-lg font-semibold text-[#0c1b33]">
                    Categories
                  </h3>
                </div>
                <div className="space-y-1">
                  {prayerCategories.map((cat) => {
                    const count =
                      cat === "All Prayers"
                        ? prayers.length
                        : prayers.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          activeCategory === cat
                            ? "bg-[#d4af37]/10 text-[#8b5e3c] font-medium"
                            : "text-[#6b7c93] hover:bg-[#e6eef7]"
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            activeCategory === cat
                              ? "bg-[#d4af37]/20 text-[#8b5e3c]"
                              : "bg-[#e6eef7] text-[#6b7c93]"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Submit Form */}
                <div className="mt-6 pt-6 border-t border-[#0c1b33]/5">
                  <h3 className="font-display text-lg font-semibold text-[#0c1b33] mb-4">
                    Submit Request
                  </h3>
                  <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name (optional)"
                      {...register("name")}
                      className="w-full px-3 py-2 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                    />
                    <select
                      {...register("category")}
                      className="w-full px-3 py-2 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                    >
                      {prayerCategories.slice(1).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div>
                      <textarea
                        placeholder="Your prayer request..."
                        rows={3}
                        {...register("text")}
                        className="w-full px-3 py-2 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm resize-none"
                      />
                      {errors.text && (
                        <p className="text-red-500 text-xs mt-1">{errors.text.message}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full btn-gold text-sm flex items-center justify-center gap-2 py-2.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit
                    </button>
                  </form>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Prayer Feed */}
          <div className="lg:col-span-3 space-y-5">
            <AnimatePresence>
              {filteredPrayers.map((prayer, index) => (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`bg-white rounded-2xl p-6 shadow-sm transition-shadow duration-300 hover:shadow-md ${
                    prayer.isNew ? "prayer-glow" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f5f0e8] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#8b5e3c]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0c1b33]">
                          {prayer.anonymous ? "Anonymous" : prayer.name}
                        </p>
                        <p className="text-xs text-[#6b7c93]">{prayer.timestamp}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#8b5e3c] text-xs font-medium">
                      {prayer.category}
                    </span>
                  </div>

                  <p className="text-[#0c1b33] leading-relaxed mb-5">{prayer.text}</p>

                  <div className="flex items-center gap-6 pt-4 border-t border-[#0c1b33]/5">
                    <button
                      onClick={() => handlePray(prayer.id)}
                      className="flex items-center gap-2 text-sm text-[#6b7c93] hover:text-[#d4af37] transition-colors group"
                    >
                      <HandHeart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>{prayer.prayers + (prayerCounts[prayer.id] || 0)} prayers</span>
                    </button>
                    <button
                      onClick={() =>
                        setExpandedPrayer(expandedPrayer === prayer.id ? null : prayer.id)
                      }
                      className="flex items-center gap-2 text-sm text-[#6b7c93] hover:text-[#d4af37] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{prayer.comments} comments</span>
                      {expandedPrayer === prayer.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                    <button className="flex items-center gap-2 text-sm text-[#6b7c93] hover:text-[#d4af37] transition-colors ml-auto">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedPrayer === prayer.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-[#0c1b33]/5">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-[#8b5e3c]" />
                            </div>
                            <div className="flex-1">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a prayerful reply..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm resize-none"
                              />
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={() => handleReply()}
                                  className="px-4 py-2 rounded-lg bg-[#0c1b33] text-white text-sm font-medium hover:bg-[#162a4a] transition-colors"
                                >
                                  Post Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
