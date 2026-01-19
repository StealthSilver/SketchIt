"use client";

import { motion } from "framer-motion";
import { Mic, Layers, Share2, Cpu } from "lucide-react";

const services = [
  {
    icon: Mic,
    title: "Talk to Your Canvas",
    description:
      "Explain your idea out loud and let AI refine or extend your diagrams.",
  },
  {
    icon: Layers,
    title: "Infinite Whiteboard",
    description:
      "No boundaries. Organize thoughts spatially with unlimited freedom.",
  },
  {
    icon: Cpu,
    title: "Instant AI Structuring",
    description: "Messy sketches become clean SVG diagrams in real time.",
  },
  {
    icon: Share2,
    title: "Export & Share",
    description:
      "Export as SVG or PNG and share ideas instantly with your team.",
  },
];

export function Services() {
  return (
    <section
      id="features"
      className="relative py-32 bg-background overflow-hidden"
    >
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-display text-4xl sm:text-5xl font-bold mb-6"
            >
              Powerful features, zero friction
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-muted-foreground max-w-3xl mx-auto"
            >
              Everything you need to turn raw thoughts into polished visuals —
              effortlessly.
            </motion.p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {services.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass rounded-2xl p-8 flex gap-6"
              >
                <service.icon className="w-8 h-8 text-accent flex-shrink-0" />
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
