import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Copy,
  Bookmark,
  Share2,
  BookOpen,
  X,
  Highlighter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import { bibleBooks, sampleVerses, translations } from "../data/demoData";
import { useLocalStorage } from "../hooks/use-local-storage";
import { useToast } from "../lib/toast";

export default function BibleReader() {
  const { book: paramBook, chapter: paramChapter } = useParams<{ book?: string; chapter?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedBook, setSelectedBook] = useState(paramBook || "Psalm 23");
  const [selectedChapter, setSelectedChapter] = useState(Number(paramChapter) || 1);
  const [activeTranslation, setActiveTranslation] = useState("NIV");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [bookmarkedVerses, setBookmarkedVerses] = useLocalStorage<Set<string>>("bible-bookmarks", new Set());
  const [noteText, setNoteText] = useState("");
  const [savedNotes, setSavedNotes] = useLocalStorage<Record<string, string>>("bible-notes", {});
  const [expandedSection, setExpandedSection] = useState<"old" | "new" | null>("old");

  const currentVerses = sampleVerses[selectedBook];
  const currentBook = bibleBooks.find((b) => b.name === selectedBook.split(" ")[0]) || bibleBooks[0];
  const hasVerses = currentVerses && currentVerses.length > 0;

  useEffect(() => {
    if (paramBook) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedBook(paramBook);
      if (paramChapter) setSelectedChapter(Number(paramChapter));
    }
  }, [paramBook, paramChapter]);

  const handleBookSelect = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setSelectedVerse(null);
    navigate(`/bible/${bookName}/1`);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setSelectedVerse(null);
    navigate(`/bible/${selectedBook}/${chapter}`);
  };

  const handleCopy = (verse: number, text: string) => {
    navigator.clipboard.writeText(`${selectedBook}:${verse} (${activeTranslation}) — ${text}`);
    showToast("Verse copied!", "success");
  };

  const handleBookmark = (verse: number) => {
    const key = `${selectedBook}-${verse}`;
    setBookmarkedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        showToast("Bookmark removed", "info");
      } else {
        next.add(key);
        showToast("Verse bookmarked!", "success");
      }
      return next;
    });
  };

  const handleSaveNote = () => {
    if (!selectedVerse || !noteText.trim()) return;
    const key = `${selectedBook}-${selectedVerse}`;
    setSavedNotes((prev) => ({ ...prev, [key]: noteText }));
    showToast("Note saved!", "success");
  };

  const searchResults = searchQuery
    ? Object.entries(sampleVerses).flatMap(([book, verses]) =>
        verses
          .filter((v) => v.text.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((v) => ({ book, ...v }))
      )
    : [];

  const oldTestament = bibleBooks.filter((b) => b.testament === "old");
  const newTestament = bibleBooks.filter((b) => b.testament === "new");

  return (
    <div className="pt-[72px] min-h-screen bg-[#e6eef7]">
      {/* Header */}
      <div className="bg-[#0c1b33] py-6 px-4">
        <div className="container-main mx-auto flex items-center justify-between">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
            Holy Bible
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg p-1">
              {translations.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    console.log('Translation selected:', t);
                    setActiveTranslation(t);
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTranslation === t
                      ? "bg-[#d4af37] text-[#0c1b33]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="container-main mx-auto mt-4">
                <div className="relative max-w-lg">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7c93]" />
                  <input
                    type="text"
                    placeholder="Search scripture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-white/50" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="mt-3 max-h-48 overflow-y-auto bg-[#162a4a] rounded-lg p-3">
                    {searchResults.length > 0 ? (
                      <p className="text-xs text-white/50 mb-2">
                        {searchResults.length} results
                      </p>
                    ) : (
                      <p className="text-sm text-white/50">No results found</p>
                    )}
                    {searchResults.slice(0, 10).map((result, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          handleBookSelect(result.book);
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                        className="block w-full text-left px-3 py-2 rounded hover:bg-white/10 text-sm text-white/80 hover:text-white transition-colors"
                      >
                        <span className="text-[#d4af37]">{result.book}:{result.verse}</span>{" "}
                        {result.text.slice(0, 80)}...
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bible Reader Layout */}
      <div className="container-main mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Book Navigation */}
          <div className="lg:col-span-3">
            <ScrollReveal>
              <div className="bg-white rounded-2xl p-5 shadow-sm lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                {/* Old Testament */}
                <button
                  onClick={() => setExpandedSection(expandedSection === "old" ? null : "old")}
                  className="flex items-center justify-between w-full mb-2"
                >
                  <h3 className="font-display text-lg font-semibold text-[#0c1b33]">
                    Old Testament
                  </h3>
                  <ChevronLeft
                    className={`w-4 h-4 text-[#6b7c93] transition-transform ${
                      expandedSection === "old" ? "-rotate-90" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedSection === "old" && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 mb-4">
                        {oldTestament.map((book) => (
                          <button
                            key={book.name}
                            onClick={() => handleBookSelect(book.name)}
                            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              selectedBook.startsWith(book.name)
                                ? "bg-[#d4af37]/10 text-[#8b5e3c] font-medium border-l-2 border-[#d4af37]"
                                : "text-[#6b7c93] hover:bg-[#e6eef7]"
                            }`}
                          >
                            {book.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* New Testament */}
                <button
                  onClick={() => setExpandedSection(expandedSection === "new" ? null : "new")}
                  className="flex items-center justify-between w-full mb-2 mt-2"
                >
                  <h3 className="font-display text-lg font-semibold text-[#0c1b33]">
                    New Testament
                  </h3>
                  <ChevronLeft
                    className={`w-4 h-4 text-[#6b7c93] transition-transform ${
                      expandedSection === "new" ? "-rotate-90" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedSection === "new" && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5">
                        {newTestament.map((book) => (
                          <button
                            key={book.name}
                            onClick={() => handleBookSelect(book.name)}
                            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              selectedBook.startsWith(book.name)
                                ? "bg-[#d4af37]/10 text-[#8b5e3c] font-medium border-l-2 border-[#d4af37]"
                                : "text-[#6b7c93] hover:bg-[#e6eef7]"
                            }`}
                          >
                            {book.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chapter Grid */}
                {currentBook && (
                  <div className="mt-6 pt-4 border-t border-[#0c1b33]/5">
                    <h4 className="text-sm font-medium text-[#0c1b33] mb-3">
                      {currentBook.name} — Chapters
                    </h4>
                    <div className="grid grid-cols-5 gap-1.5">
                      {Array.from({ length: Math.min(currentBook.chapters, 50) }, (_, i) => i + 1).map(
                        (ch) => (
                          <button
                            key={ch}
                            onClick={() => handleChapterSelect(ch)}
                            className={`py-1.5 rounded-lg text-sm font-medium transition-all ${
                              selectedChapter === ch
                                ? "bg-[#d4af37] text-[#0c1b33]"
                                : "bg-[#f8f6f3] text-[#6b7c93] hover:bg-[#e6eef7]"
                            }`}
                          >
                            {ch}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Center - Scripture Display */}
          <div className="lg:col-span-6">
            <ScrollReveal>
              <div className="bg-[#f5f0e8] rounded-2xl p-6 sm:p-10 shadow-sm">
                {/* Chapter Header */}
                <div className="text-center mb-8 pb-6 border-b border-[#0c1b33]/10">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0c1b33]">
                    {selectedBook}
                  </h2>
                  <p className="text-sm text-[#6b7c93] mt-1">
                    {activeTranslation} Translation
                  </p>

                  {/* Chapter Navigation */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                      onClick={() => selectedChapter > 1 && handleChapterSelect(selectedChapter - 1)}
                      disabled={selectedChapter <= 1}
                      className="p-2 rounded-lg hover:bg-[#0c1b33]/5 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[#0c1b33]" />
                    </button>
                    <span className="font-display text-xl font-semibold text-[#0c1b33]">
                      Chapter {selectedChapter}
                    </span>
                    <button
                      onClick={() =>
                        currentBook && selectedChapter < currentBook.chapters && handleChapterSelect(selectedChapter + 1)
                      }
                      disabled={!currentBook || selectedChapter >= currentBook.chapters}
                      className="p-2 rounded-lg hover:bg-[#0c1b33]/5 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-[#0c1b33]" />
                    </button>
                  </div>
                </div>

                {/* Verses */}
                <div className="space-y-4">
                  {hasVerses ? (
                    currentVerses.map((verse) => (
                      <motion.div
                        key={verse.verse}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setSelectedVerse(verse.verse)}
                        className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                          selectedVerse === verse.verse
                            ? "bg-[#d4af37]/10"
                            : "hover:bg-white/50"
                        }`}
                      >
                        <p className="font-display text-lg sm:text-xl text-[#0c1b33] leading-relaxed">
                          <sup className="text-xs text-[#8b5e3c] font-medium mr-1">
                            {verse.verse}
                          </sup>
                          {verse.text}
                        </p>

                        {/* Verse Actions */}
                        <AnimatePresence>
                          {selectedVerse === verse.verse && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="flex items-center gap-2 mt-3"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(verse.verse, verse.text);
                                }}
                                className="p-1.5 rounded-lg bg-white shadow-sm hover:shadow text-[#6b7c93] hover:text-[#d4af37] transition-all"
                                title="Copy"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookmark(verse.verse);
                                }}
                                className={`p-1.5 rounded-lg bg-white shadow-sm hover:shadow transition-all ${
                                  bookmarkedVerses.has(`${selectedBook}-${verse.verse}`)
                                    ? "text-[#d4af37]"
                                    : "text-[#6b7c93] hover:text-[#d4af37]"
                                }`}
                                title="Bookmark"
                              >
                                <Bookmark className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showToast("Verse shared!", "success");
                                }}
                                className="p-1.5 rounded-lg bg-white shadow-sm hover:shadow text-[#6b7c93] hover:text-[#d4af37] transition-all"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-[#6b7c93]">No verses available for {selectedBook} Chapter {selectedChapter}</p>
                      <p className="text-sm text-[#6b7c93]/70 mt-2">Try selecting a different book or chapter</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Sidebar - Study Tools */}
          <div className="lg:col-span-3">
            <ScrollReveal>
              <div className="space-y-6 lg:sticky lg:top-24">
                {/* Translation Selector (Mobile) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm sm:hidden">
                  <h3 className="font-display text-lg font-semibold text-[#0c1b33] mb-3">
                    Translation
                  </h3>
                  <div className="flex gap-2">
                    {translations.map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTranslation(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTranslation === t
                            ? "bg-[#d4af37] text-[#0c1b33]"
                            : "bg-[#f8f6f3] text-[#6b7c93]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* My Notes */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Highlighter className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="font-display text-lg font-semibold text-[#0c1b33]">
                      Study Notes
                    </h3>
                  </div>
                  {selectedVerse ? (
                    <div>
                      <p className="text-xs text-[#6b7c93] mb-2">
                        Note for {selectedBook}:{selectedVerse}
                      </p>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write your thoughts..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-[#0c1b33]/10 bg-[#f8f6f3] focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm resize-none"
                      />
                      <button
                        onClick={handleSaveNote}
                        className="mt-2 w-full py-2 rounded-lg bg-[#0c1b33] text-white text-sm font-medium hover:bg-[#162a4a] transition-colors"
                      >
                        Save Note
                      </button>
                      {savedNotes[`${selectedBook}-${selectedVerse}`] && (
                        <div className="mt-3 p-3 bg-[#f5f0e8] rounded-lg">
                          <p className="text-xs text-[#6b7c93] mb-1">Saved note:</p>
                          <p className="text-sm text-[#0c1b33]">
                            {savedNotes[`${selectedBook}-${selectedVerse}`]}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6b7c93]">
                      Select a verse to add a study note.
                    </p>
                  )}
                </div>

                {/* Bookmarks */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Bookmark className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="font-display text-lg font-semibold text-[#0c1b33]">
                      My Bookmarks
                    </h3>
                  </div>
                  {bookmarkedVerses.size > 0 ? (
                    <div className="space-y-2">
                      {Array.from(bookmarkedVerses).map((key) => {
                        const [book, verse] = key.split("-");
                        return (
                          <button
                            key={key}
                            onClick={() => handleBookSelect(book)}
                            className="block w-full text-left px-3 py-2 rounded-lg bg-[#f8f6f3] hover:bg-[#e6eef7] text-sm transition-colors"
                          >
                            <span className="text-[#d4af37] font-medium">{book}:{verse}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6b7c93]">
                      No bookmarks yet. Select a verse to bookmark it.
                    </p>
                  )}
                </div>

                {/* Quick Links */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-4 h-4 text-[#d4af37]" />
                    <h3 className="font-display text-lg font-semibold text-[#0c1b33]">
                      Quick Access
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {["Psalm 23", "John 3", "Philippians 4", "Romans 8"].map((ref) => (
                      <button
                        key={ref}
                        onClick={() => handleBookSelect(ref)}
                        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#f8f6f3] text-sm text-[#6b7c93] hover:text-[#0c1b33] transition-colors"
                      >
                        {ref}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
