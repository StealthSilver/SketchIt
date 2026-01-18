"use client";

import { motion } from "framer-motion";
import { Brain, PenTool, Wand2 } from "lucide-react";

export function About() {
  const items = [
    {
      icon: Brain,
      title: "Think Visually",
      description:
        "Turn abstract thoughts into clear visual structures using natural drawing and language.",
    },
    {
      icon: PenTool,
      title: "Sketch Naturally",
      description:
        "Draw freely on an infinite canvas — no rigid tools, no friction.",
    },
    {
      icon: Wand2,
      title: "AI-Assisted Creation",
      description:
        "Your sketches are instantly enhanced, cleaned, and transformed by AI.",
    },
  ];

  return (
    <section
      id="about"
      className="relative py-32 bg-background overflow-hidden"
    >
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-bold mb-6"
          >
            Built for how your mind works
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto mb-16"
          >
            SketchIt blends freeform drawing with AI intelligence, helping you
            explore ideas visually — faster than typing, clearer than words.
          </motion.p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass rounded-2xl p-8 text-left hover:translate-y-[-4px] transition-transform duration-300"
              >
                <item.icon className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
