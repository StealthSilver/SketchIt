"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/context/ThemeContext";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Features", href: "#features" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Docs", href: "#docs" },
  { name: "GitHub", href: "https://github.com" },
];

export function Navbar() {
  const { theme } = useTheme();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 backdrop-blur-xl"
      style={{
        backgroundColor:
          theme === "dark" ? "rgba(1, 8, 18, 0.2)" : "rgba(255, 255, 255, 0.2)",
        borderBottom: `1px solid ${theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"}`,
        boxShadow:
          theme === "dark"
            ? "0 4px 24px 0 rgba(0, 0, 0, 0.25)"
            : "0 4px 24px 0 rgba(31, 38, 135, 0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={
                theme === "dark" ? "/sketchit-dark.svg" : "/sketchit-light.svg"
              }
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

          {/* Right Side: Theme Toggle and Get Started Button */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/get-started"
              className="btn-primary text-sm px-6 py-2.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
