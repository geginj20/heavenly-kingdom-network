import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Cross, Menu, X, Radio, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Scriptures", path: "/bible" },
  { label: "Prayer Wall", path: "/prayer-wall" },
  { label: "Sermons", path: "/sermons" },
  { label: "Events", path: "/events" },
  { label: "Give", path: "/#give" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/#give") return location.pathname === "/" && location.hash === "#give";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(12,27,51,0.95)] backdrop-blur-[12px] shadow-lg"
            : "bg-[rgba(12,27,51,0.85)] backdrop-blur-[8px]"
        } h-[72px]`}
      >
        <div className="container-main mx-auto h-full flex items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Cross className="w-6 h-6 text-[#d4af37] transition-transform group-hover:rotate-12" />
            <span className="font-display text-xl md:text-[22px] font-bold text-white tracking-tight">
              Heavenly Kingdom Network
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={(e) => {
                  if (link.path === "/#give") {
                    e.preventDefault();
                    if (location.pathname !== "/") {
                      window.location.hash = "#/";
                      setTimeout(() => {
                        document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                      }, 300);
                    } else {
                      document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }
                }}
                className={`relative text-sm font-medium uppercase tracking-[0.5px] transition-colors ${
                  isActive(link.path) ? "text-[#d4af37]" : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#d4af37]"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/events"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              Live
            </Link>

            <Link
              to="/admin"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <User className="w-4 h-4 text-white" />
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-[999] lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 w-[280px] bg-[#0c1b33] shadow-2xl"
            >
              <div className="p-6 pt-20">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={(e) => {
                      if (link.path === "/#give") {
                        e.preventDefault();
                        setMobileOpen(false);
                        if (location.pathname !== "/") {
                          window.location.hash = "#/";
                        }
                        setTimeout(() => {
                          document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                        }, 500);
                      }
                    }}
                    className={`block py-3 text-lg font-medium ${
                      isActive(link.path) ? "text-[#d4af37]" : "text-white/80"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 py-3 text-white/80"
                  >
                    <User className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                  <div className="flex items-center gap-2 py-3 text-red-400">
                    <Radio className="w-5 h-5" />
                    Live Stream
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
