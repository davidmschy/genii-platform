import Hero from "./components/Hero";
import Features from "./components/Features";
import RoiDashboard from "./components/RoiDashboard";
import MarketplacePricing from "./components/MarketplacePricing";
import Sidebar from "./components/Sidebar";
import AssistantChat from "./components/AssistantChat";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 selection:bg-purple-500/30">
        <Hero />
        <Features />
        <MarketplacePricing />
        <RoiDashboard />

        {/* Footer / CTA Section */}
        <section className="py-20 border-t border-neutral-800 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Automate?</h2>
          <p className="text-neutral-400 mb-8">
            Limited availability. Application required.
          </p>
          <button className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-colors">
            Apply Now
          </button>
        </section>
      </main>
      <AssistantChat />
    </div>
  );
}
