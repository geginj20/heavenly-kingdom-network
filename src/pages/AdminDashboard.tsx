import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  HandHeart,
  Headphones,
  Calendar,
  DollarSign,
  Settings,
  Search,
  Bell,
  CheckCircle,
  Flag,
  Trash2,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { adminStats, adminPrayers, demoEvents } from "../data/demoData";
import { useToast } from "../lib/toast";

type Tab = "overview" | "users" | "prayers" | "sermons" | "events" | "donations" | "settings";

const sidebarItems: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "prayers", label: "Prayer Requests", icon: HandHeart },
  { id: "sermons", label: "Sermons", icon: Headphones },
  { id: "events", label: "Events", icon: Calendar },
  { id: "donations", label: "Donations", icon: DollarSign },
  { id: "settings", label: "Settings", icon: Settings },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400",
  approved: "bg-green-500/20 text-green-400",
  flagged: "bg-red-500/20 text-red-400",
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [prayerFilter, setPrayerFilter] = useState("all");
  const [showEventModal, setShowEventModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  const filteredPrayers = adminPrayers.filter((p) => {
    if (prayerFilter === "all") return true;
    return p.status === prayerFilter;
  });

  const handlePrayerAction = (action: string) => {
    showToast(`Prayer request ${action}!`, "success");
  };

  return (
    <div className="pt-[72px] min-h-screen bg-[#0c1b33]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-[260px] min-h-[calc(100vh-72px)] bg-[#0f2240] border-r border-white/5">
          <div className="p-4">
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-white/40">Super Admin</p>
              </div>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                    activeTab === item.id
                      ? "bg-[#d4af37]/10 text-[#d4af37] font-medium"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.id === "prayers" && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                      {adminStats.pendingPrayers}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white capitalize">
              {activeTab}
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] w-48"
                />
              </div>
              <button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5 text-white/60" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#d4af37]" />
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Users",
                    value: adminStats.totalUsers.toLocaleString(),
                    icon: Users,
                    trend: "+12%",
                    up: true,
                  },
                  {
                    label: "Prayer Requests",
                    value: adminStats.totalPrayers.toLocaleString(),
                    icon: HandHeart,
                    trend: "+8%",
                    up: true,
                  },
                  {
                    label: "Sermons",
                    value: adminStats.totalSermons.toString(),
                    icon: Headphones,
                    trend: "+5%",
                    up: true,
                  },
                  {
                    label: "Monthly Giving",
                    value: `$${adminStats.monthlyGiving.toLocaleString()}`,
                    icon: DollarSign,
                    trend: "-3%",
                    up: false,
                  },
                ].map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#0f2240] rounded-xl p-5 border border-white/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                        <metric.icon className="w-5 h-5 text-[#d4af37]" />
                      </div>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${
                          metric.up ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {metric.up ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {metric.trend}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                    <p className="text-sm text-white/40">{metric.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-[#0f2240] rounded-xl p-5 border border-white/5">
                  <h3 className="font-display text-lg font-semibold text-white mb-4">
                    Recent Prayer Requests
                  </h3>
                  <div className="space-y-3">
                    {adminPrayers.slice(0, 5).map((prayer) => (
                      <div
                        key={prayer.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                      >
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[prayer.status]
                          }`}
                        >
                          {prayer.status}
                        </span>
                        <p className="text-sm text-white/70 flex-1 truncate">{prayer.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0f2240] rounded-xl p-5 border border-white/5">
                  <h3 className="font-display text-lg font-semibold text-white mb-4">
                    Upcoming Events
                  </h3>
                  <div className="space-y-3">
                    {demoEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-[#d4af37]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{event.title}</p>
                          <p className="text-xs text-white/40">
                            {event.month} {event.day} — {event.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prayer Moderation Tab */}
          {activeTab === "prayers" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {["all", "pending", "approved", "flagged"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPrayerFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      prayerFilter === filter
                        ? "bg-[#d4af37] text-[#0c1b33]"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              <div className="bg-[#0f2240] rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">
                          Request
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">
                          Category
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">
                          Author
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">
                          Date
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrayers.map((prayer) => (
                        <tr
                          key={prayer.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-white/70 max-w-xs truncate">
                            {prayer.text}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs">
                              {prayer.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-white/60">{prayer.author}</td>
                          <td className="px-4 py-3 text-sm text-white/60">{prayer.date}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                statusColors[prayer.status]
                              }`}
                            >
                              {prayer.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handlePrayerAction("approved")}
                                className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePrayerAction("flagged")}
                                className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"
                                title="Flag"
                              >
                                <Flag className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePrayerAction("deleted")}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="bg-[#0f2240] rounded-xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h3 className="font-display text-lg font-semibold text-white">
                  User Management
                </h3>
                <p className="text-sm text-white/40 mt-1">
                  {adminStats.totalUsers.toLocaleString()} total users
                </p>
              </div>
              <div className="p-5">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "Sarah Mitchell", email: "sarah@email.com", role: "Pastor", status: "active" },
                    { name: "James Cooper", email: "james@email.com", role: "Ministry Leader", status: "active" },
                    { name: "David Kim", email: "david@email.com", role: "Member", status: "active" },
                    { name: "Maria Lopez", email: "maria@email.com", role: "Member", status: "inactive" },
                    { name: "Pastor Robert", email: "robert@church.org", role: "Admin", status: "active" },
                    { name: "Amanda Foster", email: "amanda@email.com", role: "Ministry Leader", status: "active" },
                  ].map((user, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white/5 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#d4af37]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-xs">
                          {user.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            user.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {user.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-white">Events</h3>
                <button
                  onClick={() => setShowEventModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d4af37] text-[#0c1b33] text-sm font-medium hover:brightness-110 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#0f2240] rounded-xl overflow-hidden border border-white/5"
                  >
                    <div className="relative h-32">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-white mb-1">{event.title}</h4>
                      <p className="text-xs text-white/40 mb-3">
                        {event.month} {event.day}, 2026 — {event.time} {event.timezone}
                      </p>
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Eye className="w-3.5 h-3.5 text-white/60" />
                        </button>
                        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Sermons Tab */}
          {activeTab === "sermons" && (
            <div className="bg-[#0f2240] rounded-xl border border-white/5 p-6">
              <h3 className="font-display text-lg font-semibold text-white mb-4">
                Sermon Management
              </h3>
              <p className="text-white/40 text-sm">
                {adminStats.totalSermons} sermons published. Use the Sermons page to browse and manage content.
              </p>
              <div className="mt-6 grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Published", value: 142, color: "text-green-400" },
                  { label: "Drafts", value: 8, color: "text-amber-400" },
                  { label: "Scheduled", value: 6, color: "text-blue-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 rounded-lg p-4 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donations Tab */}
          {activeTab === "donations" && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "This Month", value: `$${adminStats.monthlyGiving.toLocaleString()}`, color: "text-[#d4af37]" },
                  { label: "Total YTD", value: "$142,380", color: "text-green-400" },
                  { label: "Donors", value: "234", color: "text-blue-400" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0f2240] rounded-xl p-5 border border-white/5 text-center"
                  >
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-white/40 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="bg-[#0f2240] rounded-xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h3 className="font-display text-lg font-semibold text-white">
                    Recent Donations
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { name: "Anonymous", amount: 100, date: "Jun 15, 2026", recurring: true },
                    { name: "Sarah M.", amount: 50, date: "Jun 14, 2026", recurring: false },
                    { name: "James K.", amount: 250, date: "Jun 13, 2026", recurring: true },
                    { name: "Living Faith Church", amount: 500, date: "Jun 12, 2026", recurring: false },
                    { name: "Maria L.", amount: 25, date: "Jun 11, 2026", recurring: true },
                  ].map((donation, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#d4af37]/10 flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <div>
                          <p className="text-sm text-white">{donation.name}</p>
                          <p className="text-xs text-white/40">{donation.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#d4af37]">${donation.amount}</p>
                        {donation.recurring && (
                          <p className="text-xs text-green-400">Monthly</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="bg-[#0f2240] rounded-xl border border-white/5 p-6 max-w-2xl">
              <h3 className="font-display text-lg font-semibold text-white mb-6">
                Platform Settings
              </h3>
              <div className="space-y-6">
                {[
                  { label: "Platform Name", value: "Heavenly Kingdom Network", type: "text" },
                  { label: "Contact Email", value: "admin@heavenlykingdom.network", type: "email" },
                  { label: "Default Language", value: "English", type: "select" },
                  { label: "Prayer Moderation", value: "AI-assisted", type: "select" },
                  { label: "Auto-approve prayers", value: false, type: "toggle" },
                  { label: "Enable live streaming", value: true, type: "toggle" },
                ].map((setting) => (
                  <div key={setting.label} className="flex items-center justify-between py-3 border-b border-white/5">
                    <div>
                      <p className="text-sm text-white">{setting.label}</p>
                    </div>
                    {setting.type === "toggle" ? (
                      <button
                        className={`w-11 h-6 rounded-full transition-colors ${
                          setting.value ? "bg-[#d4af37]" : "bg-white/20"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            setting.value ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    ) : setting.type === "select" ? (
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        {String(setting.value)}
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    ) : (
                      <input
                        type={setting.type}
                        defaultValue={String(setting.value)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] w-64"
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={() => showToast("Settings saved!", "success")}
                  className="w-full btn-gold"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f2240] rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-white/5"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-semibold text-white">Create Event</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast("Event created!", "success");
                  setShowEventModal(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm text-white/60 mb-1">Event Title</label>
                  <input
                    type="text"
                    placeholder="Enter event title"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Time</label>
                    <input
                      type="time"
                      className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Physical location or 'Online'"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Event description..."
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#d4af37] resize-none"
                  />
                </div>
                <button type="submit" className="w-full btn-gold">
                  Create Event
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
