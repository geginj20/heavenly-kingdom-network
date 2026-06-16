import HeroSection from "./home/HeroSection";
import ScriptureSection from "./home/ScriptureSection";
import PrayerPreviewSection from "./home/PrayerPreviewSection";
import SermonPreviewSection from "./home/SermonPreviewSection";
import EventsPreviewSection from "./home/EventsPreviewSection";
import LiveStreamSection from "./home/LiveStreamSection";
import GiveSection from "./home/GiveSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ScriptureSection />
      <PrayerPreviewSection />
      <SermonPreviewSection />
      <EventsPreviewSection />
      <LiveStreamSection />
      <GiveSection />
    </>
  );
}
