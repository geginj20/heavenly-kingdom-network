import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Video, ChevronRight } from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";
import { api } from "../../lib/api";
import type { Event } from "../../data/demoData";

export default function EventsPreviewSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events.list().then((data) => {
      setEvents(data.slice(0, 4));
      setLoading(false);
    });
  }, []);

  return (
    <section className="bg-[#f8f6f3] section-padding">
      <div className="container-main mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-[#0c1b33] mb-3">
              Kingdom Events
            </h2>
            <p className="text-[#6b7c93] text-lg max-w-xl mx-auto">
              Global gatherings, conferences, and worship nights.
            </p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#0c1b33]/5">
                <div className="h-48 bg-[#e6eef7] animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-16 bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-5 w-3/4 bg-[#e6eef7] rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-[#e6eef7] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-[#6b7c93]/30 mx-auto mb-3" />
            <p className="text-[#6b7c93]">No upcoming events</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map((event, index) => (
              <ScrollReveal key={event.id} delay={index * 100}>
                <div className="bg-white rounded-2xl overflow-hidden border border-[#0c1b33]/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white rounded-xl px-4 py-2 text-center shadow-lg">
                      <p className="text-xs font-medium text-[#6b7c93] uppercase">{event.month}</p>
                      <p className="text-2xl font-bold text-[#0c1b33] font-display">{event.day}</p>
                    </div>
                    {event.isOnline && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#d4af37] text-[#0c1b33] text-xs font-medium flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Online
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-semibold text-[#0c1b33] mb-2 group-hover:text-[#d4af37] transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#6b7c93] mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {event.time} {event.timezone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                    </div>
                    <p className="text-sm text-[#6b7c93] line-clamp-2 mb-4">{event.description}</p>
                    <Link
                      to="/events"
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#8b5e3c] hover:text-[#d4af37] transition-colors"
                    >
                      RSVP Now
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        <ScrollReveal>
          <div className="text-center mt-10">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#0c1b33]/20 text-[#0c1b33] font-medium hover:bg-[#0c1b33] hover:text-white transition-all duration-300"
            >
              <Calendar className="w-4 h-4" />
              View Full Calendar
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}