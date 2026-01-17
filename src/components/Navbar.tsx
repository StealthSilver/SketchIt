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
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md"
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
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
                target={link.name === "GitHub" ? "_blank" : undefined}
                rel={link.name === "GitHub" ? "noopener noreferrer" : undefined}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Get Started Button */}
          <Link
            href="/get-started"
            className="px-5 py-2 rounded-full text-sm font-medium transition-all hover:transform hover:translate-y-[-2px] hover:shadow-[0_10px_25px_rgba(177,9,16,0.4)]"
            style={{ backgroundColor: "#b10910", color: "white" }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
