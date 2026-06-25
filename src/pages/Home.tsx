import HeroSection from "./home/HeroSection";
import ScriptureSection from "./home/ScriptureSection";
import PrayerPreviewSection from "./home/PrayerPreviewSection";
import SermonPreviewSection from "./home/SermonPreviewSection";
import EventsPreviewSection from "./home/EventsPreviewSection";
import LiveStreamSection from "./home/LiveStreamSection";
import GiveSection from "./home/GiveSection";
import SEO from "../components/SEO";

export default function Home() {
  return (
    <>
      <SEO title="Kingdom Mission Network" description="Kingdom Mission Network - A global community of believers united in faith, prayer, and worship. Join us for sermons, events, and daily Bible study." />
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
