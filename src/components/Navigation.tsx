import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Radio, User, Book, Heart, Headphones, Calendar, Gift, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Scriptures", path: "/bible", icon: Book },
  { label: "Prayer Wall", path: "/prayer-wall", icon: Heart },
  { label: "Sermons", path: "/sermons", icon: Headphones },
  { label: "Events", path: "/events", icon: Calendar },
  { label: "Give", path: "/#give", icon: Gift },
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
          <Link to="/" className="flex items-center gap-3 group">
            <img src="./logo.png" alt="Heavenly Kingdom Network" className="h-8 w-auto" />
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999] lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="absolute right-0 top-0 bottom-0 w-[280px] bg-[#0c1b33] shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>
              <nav className="p-4 pt-2">
                {navLinks.map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <Link
                        to={link.path}
                        onClick={(e) => {
                          setMobileOpen(false);
                          if (link.path === "/#give") {
                            e.preventDefault();
                            if (location.pathname !== "/") {
                              window.location.hash = "#/";
                            }
                            setTimeout(() => {
                              document.getElementById("give")?.scrollIntoView({ behavior: "smooth" });
                            }, 500);
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive(link.path)
                            ? "bg-[#d4af37]/10 text-[#d4af37]"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {link.label}
                        {link.label === "Events" && (
                          <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Live
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
              <div className="p-4 pt-2 border-t border-white/10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link
                    to="/donations"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <DollarSign className="w-5 h-5" />
                    Giving History
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.27 }}
                >
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
                  >
                    <User className="w-5 h-5" />
                    Admin Dashboard
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400"
                >
                  <Radio className="w-5 h-5" />
                  <span className="flex items-center gap-2">
                    Live Stream
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
