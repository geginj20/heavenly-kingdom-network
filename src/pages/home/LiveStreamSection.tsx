import { Link } from "react-router-dom";
import { Play, Radio, Users, MessageCircle, Clock } from "lucide-react";
import ScrollReveal from "../../components/ScrollReveal";

const upcomingStreams = [
  {
    id: "1",
    title: "Morning Devotional",
    host: "Pastor Sarah Williams",
    time: "Tomorrow, 7:00 AM EST",
  },
  {
    id: "2",
    title: "Bible Study: Book of Romans",
    host: "Dr. Michael Johnson",
    time: "Wed, 6:30 PM EST",
  },
  {
    id: "3",
    title: "Youth Night Live",
    host: "Youth Ministry Team",
    time: "Fri, 7:00 PM PST",
  },
];

export default function LiveStreamSection() {
  return (
    <section
      className="section-padding bg-gradient-to-br from-[#0c1b33] via-[#162a4a] to-[#1a3a5c]"
    >
      <div className="container-main mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-red-400 text-sm font-medium uppercase tracking-wider">
                Live Now
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">
              Live Worship
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Join worship services and events streaming live from around the world.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Featured Stream */}
          <ScrollReveal className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
              <div className="aspect-video">
                <img
                  src="/images/event-worship-night.jpg"
                  alt="Sunday Worship"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#d4af37] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-[#0c1b33] ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-medium flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    LIVE
                  </span>
                  <span className="text-white/60 text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    1,247 watching
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-semibold text-white mb-1">
                  Sunday Worship — Living Faith Church
                </h3>
                <p className="text-white/60 text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Live chat active
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Upcoming Streams */}
          <div className="space-y-4">
            <ScrollReveal>
              <h3 className="font-display text-xl font-semibold text-white mb-4">
                Coming Up
              </h3>
            </ScrollReveal>
            {upcomingStreams.map((stream, index) => (
              <ScrollReveal key={stream.id} delay={index * 100}>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <h4 className="font-medium text-white mb-1">{stream.title}</h4>
                  <p className="text-sm text-white/50 mb-2">{stream.host}</p>
                  <p className="text-xs text-[#d4af37] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stream.time}
                  </p>
                </div>
              </ScrollReveal>
            ))}

            <ScrollReveal delay={300}>
              <Link
                to="/events"
                className="block text-center py-3 text-[#d4af37] text-sm font-medium hover:text-white transition-colors"
              >
                View All Scheduled Streams →
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
