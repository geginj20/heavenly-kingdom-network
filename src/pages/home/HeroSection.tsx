import { Link } from "react-router-dom";
import { Play, Users } from "lucide-react";
import AmbientParticles from "../../components/AmbientParticles";
import ScrollReveal from "../../components/ScrollReveal";

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c1b33] via-[#162a4a] to-[#1a3a5c]"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: "url(/images/hero-worship.jpg)" }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0c1b33]/60" />

      {/* Ambient Particles */}
      <AmbientParticles />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <ScrollReveal delay={200}>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6 tracking-tight living-water-text">
            Connecting Believers Worldwide
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <p className="text-lg sm:text-xl text-white/80 font-body mb-10 max-w-2xl mx-auto leading-relaxed">
            A global, open-source platform for prayer, scripture, and fellowship — built on a
            $0/month infrastructure that serves the Kingdom.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/prayer-wall"
              className="btn-gold inline-flex items-center gap-2 text-base font-semibold"
            >
              <Users className="w-5 h-5" />
              Join the Community
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-white/30 text-white font-medium hover:bg-white/10 transition-all duration-300"
            >
              <Play className="w-5 h-5" />
              Watch Live
            </Link>
          </div>
        </ScrollReveal>

        {/* Scripture Verse Bar */}
        <ScrollReveal delay={600}>
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="font-display text-lg sm:text-xl italic text-[#d4af37]">
              &ldquo;For where two or three gather in my name, there am I with them.&rdquo;
            </p>
            <p className="text-sm text-white/50 mt-2 font-medium uppercase tracking-wider">
              — Matthew 18:20
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#e6eef7] to-transparent" />
    </section>
  );
}
