import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { dailyScriptures, translations } from "../../data/demoData";

export default function ScriptureSection() {
  const [activeTranslation, setActiveTranslation] = useState("NIV");
  const todayScripture = dailyScriptures[0];

  const getScriptureText = () => {
    switch (activeTranslation) {
      case "ESV": return todayScripture.esv;
      case "KJV": return todayScripture.kjv;
      default: return todayScripture.niv;
    }
  };

  return (
    <section className="bg-[#f5f0e8] section-padding">
      <div className="container-main mx-auto text-center">
        <ScrollReveal>
          <p className="text-xs font-medium uppercase tracking-[0.8px] text-[#d4af37] mb-4">
            Daily Scripture
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <blockquote className="font-display text-2xl sm:text-3xl md:text-4xl italic text-[#0c1b33] max-w-3xl mx-auto leading-relaxed mb-4">
            &ldquo;{getScriptureText()}&rdquo;
          </blockquote>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-[#d4af37] font-display text-xl font-semibold mb-8">
            {todayScripture.reference}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="flex items-center justify-center gap-2 mb-8">
            {translations.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTranslation(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTranslation === t
                    ? "bg-[#d4af37] text-[#0c1b33]"
                    : "bg-[#0c1b33]/10 text-[#0c1b33] hover:bg-[#0c1b33]/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <Link
            to="/bible"
            className="inline-flex items-center gap-2 text-[#8b5e3c] font-medium hover:text-[#d4af37] transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Read Full Chapter
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
