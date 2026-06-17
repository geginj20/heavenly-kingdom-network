import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, Bookmark, Play } from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { api } from "../../lib/api";
import type { Sermon } from "../../data/demoData";

export default function SermonPreviewSection() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api.sermons.list().then((data) => {
      setSermons(data);
      setLoading(false);
    });
  }, []);

  const filteredSermons = sermons
    .filter((s) => activeCategory === "All" || s.category === activeCategory)
    .filter((s) =>
      searchQuery
        ? s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.speaker.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

  return (
    <section className="bg-white section-padding">
      <div className="container-main mx-auto">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#0c1b33] mb-3">
              Sermon Library
            </h2>
            <p className="text-[#6b7c93] text-lg max-w-xl mx-auto">
              Searchable teachings from ministries worldwide.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7c93]" />
              <input
                type="text"
                placeholder="Search sermons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#0c1b33]/10 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
              />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="flex flex-wrap gap-2 mb-8">
            {["All", "Worship", "Teaching", "Prophetic", "Healing", "Deliverance", "Faith", "Prayer"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-[#0c1b33] text-white"
                    : "bg-[#e6eef7] text-[#0c1b33] hover:bg-[#0c1b33]/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#0c1b33]/5">
                <div className="aspect-video bg-[#e6eef7] animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-16 bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-4 w-full bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-[#e6eef7] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="text-center py-12">
            <Play className="w-10 h-10 text-[#6b7c93]/30 mx-auto mb-3" />
            <p className="text-[#6b7c93]">No sermons found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSermons.slice(0, 6).map((sermon, index) => (
              <ScrollReveal key={sermon.id} delay={index * 100}>
                <div className="group bg-white rounded-2xl overflow-hidden border border-[#0c1b33]/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={sermon.thumbnail}
                      alt={sermon.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#d4af37] flex items-center justify-center">
                        <Play className="w-5 h-5 text-[#0c1b33] ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {sermon.duration}
                    </span>
                  </div>
                  <div className="p-5">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#d4af37]/10 text-[#8b5e3c] text-xs font-medium mb-2">
                      {sermon.category}
                    </span>
                    <h3 className="font-semibold text-[#0c1b33] mb-1 line-clamp-2 group-hover:text-[#d4af37] transition-colors">
                      {sermon.title}
                    </h3>
                    <p className="text-sm text-[#6b7c93]">{sermon.speaker}</p>
                    <p className="text-xs text-[#6b7c93]/70 mt-1">{sermon.ministry}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#0c1b33]/5">
                      <span className="text-xs text-[#6b7c93]">{sermon.date}</span>
                      <button className="p-1.5 rounded-full hover:bg-[#e6eef7] transition-colors">
                        <Bookmark className="w-4 h-4 text-[#6b7c93]" />
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        <ScrollReveal>
          <div className="text-center mt-10">
            <Link
              to="/sermons"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#0c1b33]/20 text-[#0c1b33] font-medium hover:bg-[#0c1b33] hover:text-white transition-all duration-300"
            >
              View All Sermons
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}