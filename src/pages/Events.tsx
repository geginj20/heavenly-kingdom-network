import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  ChevronDown,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import { demoEvents } from "../data/demoData";
import type { Event } from "../data/demoData";
import { useToast } from "../lib/toast";

export default function Events() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpForm, setRsvpForm] = useState({ name: "", email: "" });
  const { showToast } = useToast();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const eventsForDate = (date: Date) =>
    demoEvents.filter((e) => isSameDay(new Date(e.date), date));

  const handleRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpForm.name || !rsvpForm.email) {
      showToast("Please fill in all fields", "error");
      return;
    }
    showToast(`RSVP confirmed for ${selectedEvent?.title}!`, "success");
    setRsvpForm({ name: "", email: "" });
    setSelectedEvent(null);
  };

  return (
    <div className="pt-[72px] min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#0c1b33] py-12 px-4">
        <div className="container-main mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">
            Kingdom Events
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Global gatherings, conferences, and worship nights.
          </p>
        </div>
      </div>

      <div className="container-main mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <ScrollReveal className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-[#0c1b33]/5 p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-lg hover:bg-[#e6eef7] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#0c1b33]" />
                </button>
                <h2 className="font-display text-2xl font-semibold text-[#0c1b33]">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-lg hover:bg-[#e6eef7] transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[#0c1b33]" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium text-[#6b7c93] uppercase tracking-wider py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                  const isCurrentMonth = isSameMonth(d, monthStart);
                  const isToday = isSameDay(d, new Date(2026, 5, 15));
                  const isSelected = selectedDate && isSameDay(d, selectedDate);
                  const dayEvents = eventsForDate(d);

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(d)}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-start pt-2 transition-all ${
                        isSelected
                          ? "bg-[#d4af37]/10 ring-2 ring-[#d4af37]"
                          : isToday
                          ? "bg-[#0c1b33] text-white"
                          : isCurrentMonth
                          ? "hover:bg-[#f8f6f3] text-[#0c1b33]"
                          : "text-[#6b7c93]/40"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isToday && !isSelected ? "text-white" : ""
                        }`}
                      >
                        {format(d, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {dayEvents.slice(0, 3).map((_, j) => (
                            <span
                              key={j}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isToday && !isSelected ? "bg-[#d4af37]" : "bg-[#d4af37]"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Events Panel */}
          <div>
            <ScrollReveal>
              <h3 className="font-display text-xl font-semibold text-[#0c1b33] mb-4">
                {selectedDate
                  ? `Events — ${format(selectedDate, "MMM d, yyyy")}`
                  : "Upcoming Events"}
              </h3>
            </ScrollReveal>

            <div className="space-y-4">
              {(selectedDate ? eventsForDate(selectedDate) : demoEvents).map((event, index) => (
                <ScrollReveal key={event.id} delay={index * 100}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-[#f8f6f3] rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="relative h-32">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      {event.isOnline && (
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-[#d4af37] text-[#0c1b33] text-xs font-medium flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Online
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-white rounded-lg px-3 py-2 text-center flex-shrink-0">
                          <p className="text-xs font-medium text-[#6b7c93]">{event.month}</p>
                          <p className="text-xl font-bold text-[#0c1b33] font-display">
                            {event.day}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0c1b33] mb-1">{event.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7c93]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.time} {event.timezone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}

              {selectedDate && eventsForDate(selectedDate).length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-[#6b7c93] mx-auto mb-3" />
                  <p className="text-[#6b7c93]">No events on this day.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="relative h-40">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4">
                  <h3 className="font-display text-xl font-semibold text-white">
                    {selectedEvent.title}
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-[#6b7c93]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {selectedEvent.month} {selectedEvent.day}, 2026
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedEvent.time} {selectedEvent.timezone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedEvent.location}
                  </span>
                </div>
                <p className="text-sm text-[#0c1b33] mb-6">{selectedEvent.description}</p>

                <form onSubmit={handleRsvp} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={rsvpForm.name}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={rsvpForm.email}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                  />
                  <button type="submit" className="w-full btn-gold flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    RSVP Now
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
