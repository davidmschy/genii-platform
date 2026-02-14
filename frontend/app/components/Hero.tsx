"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] w-full overflow-hidden bg-black text-white flex items-center justify-center pt-20">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800/40 via-black to-black opacity-60" />

      <div className="container relative z-10 px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <div className="flex justify-center">
            <span className="px-4 py-1.5 rounded-full border border-white/10 glass text-xs tracking-widest uppercase text-white/50">
              Phase 7: Sovereign Marketplace Live
            </span>
          </div>

          <h1 className="text-6xl md:text-9xl font-extrabold tracking-tighter leading-[0.9] gradient-text italic">
            DELEGATE <br /> EVERYTHING.
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-xl md:text-3xl text-neutral-400 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Genii is the first autonomous operating system designed for the $100M enterprise.
            Pure scale, no overhead.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mt-12"
          >
            <button className="group relative luxury-card !p-0 h-16 w-64 inline-flex items-center justify-center overflow-hidden bg-white !rounded-full text-black font-bold transition-transform hover:scale-105 active:scale-95">
              <span>ACQUIRE GENII</span>
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="h-16 px-10 rounded-full border border-white/10 glass text-white font-medium hover:bg-white/5 transition-all">
              Watch Deployment
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Luxury Light Rays */}
      <motion.div
        animate={{
          x: [-100, 100, -100],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_50%)] pointer-events-none"
      />
    </section>
  );
}
