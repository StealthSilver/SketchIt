"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "SketchIt feels like thinking directly on the screen. I’ve never moved from idea to clarity this fast.",
    name: "Alex Morgan",
    role: "Product Designer",
  },
  {
    quote:
      "Explaining diagrams verbally and watching them form instantly is mind-blowing.",
    name: "Sara Kim",
    role: "Startup Founder",
  },
  {
    quote:
      "This replaced three different tools in my workflow. It just feels natural.",
    name: "Daniel Ruiz",
    role: "UX Engineer",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative py-32 bg-background overflow-hidden"
    >
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Header */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl sm:text-5xl font-bold mb-16"
          >
            Loved by thinkers and builders
          </motion.h2>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass rounded-2xl p-8 text-left"
              >
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  “{t.quote}”
                </p>
                <div>
                  <div className="font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
