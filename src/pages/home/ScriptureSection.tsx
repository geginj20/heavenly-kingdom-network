import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { api } from "../../lib/api";

interface Translation {
  code: string;
  name: string;
}

export default function ScriptureSection() {
  const [activeTranslation, setActiveTranslation] = useState("kjv");
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [scripture, setScripture] = useState<{ text: string; reference: string } | null>(null);

  useEffect(() => {
    api.bible.dailyVerse(activeTranslation).then((data) => {
      setScripture({ text: data.text, reference: data.reference });
    }).catch(() => {});
  }, [activeTranslation]);

  useEffect(() => {
    api.bible.books().then((data) => {
      const translationNames = data.translationNames || {};
      setTranslations(
        (data.translations || ["kjv", "web", "asv"]).map((code) => ({
          code,
          name: translationNames[code] || code.toUpperCase(),
        }))
      );
    }).catch(() => {});
  }, []);

  if (!scripture) {
    return (
      <section className="bg-[#f5f0e8] section-padding">
        <div className="container-main mx-auto text-center py-16">
          <BookOpen className="w-8 h-8 text-[#d4af37] mx-auto animate-spin" />
        </div>
      </section>
    );
  }

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
            &ldquo;{scripture.text}&rdquo;
          </blockquote>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-[#d4af37] font-display text-xl font-semibold mb-8">
            {scripture.reference}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {translations.map((t) => (
              <button
                key={t.code}
                onClick={() => setActiveTranslation(t.code)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTranslation === t.code
                    ? "bg-[#d4af37] text-[#0c1b33]"
                    : "bg-[#0c1b33]/10 text-[#0c1b33] hover:bg-[#0c1b33]/20"
                }`}
              >
                {t.name}
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