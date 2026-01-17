"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Features", href: "#features" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Docs", href: "#docs" },
  { name: "GitHub", href: "https://github.com" },
];

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
      style={{ backgroundColor: "rgba(10, 10, 10, 0.8)" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/sketchit-dark.svg"
              alt="SketchIt Logo"
              width={140}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-all duration-300 text-sm font-medium relative group"
                target={link.name === "GitHub" ? "_blank" : undefined}
                rel={link.name === "GitHub" ? "noopener noreferrer" : undefined}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Get Started Button */}
          <Link href="/get-started" className="btn-primary text-sm px-6 py-2.5">
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
