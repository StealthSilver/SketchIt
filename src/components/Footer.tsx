"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Github, Twitter, Linkedin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="relative overflow-hidden bg-background">
      {/* Glow */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-t border-border/50 backdrop-blur-2xl"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(1, 8, 18, 0.4)"
              : "rgba(255, 255, 255, 0.4)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <Image
                src={
                  theme === "dark"
                    ? "/sketchit-dark.svg"
                    : "/sketchit-light.svg"
                }
                alt="SketchIt Logo"
                width={140}
                height={32}
                className="mb-4"
              />
              <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                SketchIt helps you think visually, sketch freely, and let AI
                transform your ideas into clear, beautiful diagrams.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#testimonials" className="hover:text-foreground">
                    Testimonials
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-display font-semibold mb-4">Connect</h4>
              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com/StealthSilver/SketchIt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass hover:scale-105 transition"
                >
                  <Github className="w-4 h-4" />
                </Link>

                <Link
                  href="https://x.com/silver_srs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass hover:scale-105 transition"
                >
                  <Twitter className="w-4 h-4" />
                </Link>

                <Link
                  href="https://www.linkedin.com/in/rajat-saraswat-0491a3259/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg glass hover:scale-105 transition"
                >
                  <Linkedin className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-16 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
            <span>
              © {new Date().getFullYear()} SketchIt. All rights reserved.
            </span>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <Link href="#" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
