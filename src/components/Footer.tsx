import { Link } from "react-router-dom";
import { Heart, Github, Twitter, Youtube, Mail } from "lucide-react";

const footerLinks = {
  about: {
    title: "About",
    links: [
      { label: "Our Mission", href: "/#" },
      { label: "Statement of Faith", href: "/#" },
      { label: "Leadership", href: "/#" },
      { label: "Contact Us", href: "/#" },
    ],
  },
  quickLinks: {
    title: "Quick Links",
    links: [
      { label: "Scriptures", href: "/bible" },
      { label: "Prayer Wall", href: "/prayer-wall" },
      { label: "Sermon Library", href: "/sermons" },
      { label: "Events Calendar", href: "/events" },
      { label: "Giving History", href: "/donations" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Bible API", href: "/bible" },
      { label: "Open Source", href: "https://github.com" },
      { label: "Documentation", href: "/#" },
      { label: "Developer API", href: "/#" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="bg-[#0c1b33] text-white">
      {/* Top gradient line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

      <div className="container-main mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="./logo.png" alt="Kingdom Mission Network" className="h-8 w-auto" />
              <span className="font-display text-xl font-bold">Kingdom Mission Network</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm mb-6">
              A global, open-source platform connecting Christian believers worldwide through
              prayer, scripture, and fellowship.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-display text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/60 hover:text-[#d4af37] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Open Source Badges */}
        <div className="mt-12 py-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Cloudflare Pages
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Neon PostgreSQL
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Cloudflare Workers
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Upstash Redis
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Cloudflare R2
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Resend Email
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40 flex items-center gap-1">
            &copy; 2026 Kingdom Mission Network.
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <Link to="#" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-white/60 transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
