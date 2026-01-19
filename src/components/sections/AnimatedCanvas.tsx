"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Pixel {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  offset: number;
  ripple: number;
  opacity: number;
}

interface Symbol {
  type: "line" | "arrow" | "circle" | "rect" | "curve";
  points: { x: number; y: number }[];
  progress: number;
  fadeOut: number;
  lifetime: number;
}

const AnimatedCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;

    // Theme colors
    const getThemeColors = () => {
      if (theme === "light") {
        return {
          pixel: "rgba(0, 0, 0, 0.09)",
          pixelActive: "rgba(177, 9, 16, 0.7)",
          symbol: "rgba(245, 158, 11, 0.8)",
        };
      }
      return {
        pixel: "rgba(255, 255, 255, 0.09)",
        pixelActive: "rgba(251, 191, 36, 0.8)",
        symbol: "rgba(251, 191, 36, 0.9)",
      };
    };

    // Pixel grid
    const gridSize = 20;
    const pixels: Pixel[] = [];
    let symbols: Symbol[] = [];

    const initPixels = () => {
      pixels.length = 0;
      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSize + gridSize / 2;
          const y = j * gridSize + gridSize / 2;
          pixels.push({
            x,
            y,
            baseX: x,
            baseY: y,
            offset: Math.random() * Math.PI * 2,
            ripple: 0,
            opacity: 0.6 + Math.random() * 0.4,
          });
        }
      }
    };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initPixels();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Mouse tracking for invisible cursor effect
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Create hand-drawn symbols
    const createSymbol = () => {
      const types: Symbol["type"][] = [
        "line",
        "arrow",
        "circle",
        "rect",
        "curve",
      ];
      const type = types[Math.floor(Math.random() * types.length)];
      const centerX = Math.random() * canvas.width;
      const centerY = Math.random() * canvas.height;
      const size = 40 + Math.random() * 80;

      const points: { x: number; y: number }[] = [];

      switch (type) {
        case "line":
          const angle = Math.random() * Math.PI * 2;
          points.push({ x: centerX, y: centerY });
          points.push({
            x: centerX + Math.cos(angle) * size,
            y: centerY + Math.sin(angle) * size,
          });
          break;

        case "arrow":
          const arrowAngle = Math.random() * Math.PI * 2;
          const endX = centerX + Math.cos(arrowAngle) * size;
          const endY = centerY + Math.sin(arrowAngle) * size;
          points.push({ x: centerX, y: centerY });
          points.push({ x: endX, y: endY });
          // Arrow head
          points.push({
            x: endX - Math.cos(arrowAngle - 0.5) * size * 0.3,
            y: endY - Math.sin(arrowAngle - 0.5) * size * 0.3,
          });
          points.push({ x: endX, y: endY });
          points.push({
            x: endX - Math.cos(arrowAngle + 0.5) * size * 0.3,
            y: endY - Math.sin(arrowAngle + 0.5) * size * 0.3,
          });
          break;

        case "circle":
          for (let i = 0; i <= 32; i++) {
            const a = (i / 32) * Math.PI * 2;
            points.push({
              x: centerX + Math.cos(a) * size * 0.5,
              y: centerY + Math.sin(a) * size * 0.5,
            });
          }
          break;

        case "rect":
          const w = size * 0.8;
          const h = size * 0.6;
          points.push({ x: centerX - w / 2, y: centerY - h / 2 });
          points.push({ x: centerX + w / 2, y: centerY - h / 2 });
          points.push({ x: centerX + w / 2, y: centerY + h / 2 });
          points.push({ x: centerX - w / 2, y: centerY + h / 2 });
          points.push({ x: centerX - w / 2, y: centerY - h / 2 });
          break;

        case "curve":
          const curvePoints = 20;
          for (let i = 0; i < curvePoints; i++) {
            const t = i / (curvePoints - 1);
            const x =
              centerX + Math.sin(t * Math.PI * 2) * size * (0.5 + t * 0.3);
            const y = centerY + (t - 0.5) * size;
            points.push({ x, y });
          }
          break;
      }

      return {
        type,
        points,
        progress: 0,
        fadeOut: 1,
        lifetime: 120 + Math.random() * 120,
      };
    };

    // Symbol creation timer
    let symbolTimer = 0;
    const symbolInterval = 180; // Frames between symbols

    // Animation loop
    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;
      const colors = getThemeColors();

      // Update and draw pixels
      pixels.forEach((pixel) => {
        // Distance from mouse for ripple effect
        const dx = pixel.baseX - mouseX;
        const dy = pixel.baseY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
          const force = 1 - distance / maxDistance;
          pixel.ripple = force * 0.5;
          pixel.x = pixel.baseX + dx * force * 0.15;
          pixel.y = pixel.baseY + dy * force * 0.15;
        } else {
          pixel.ripple *= 0.95;
          pixel.x += (pixel.baseX - pixel.x) * 0.1;
          pixel.y += (pixel.baseY - pixel.y) * 0.1;
        }

        // Subtle breathing animation
        const breathe = Math.sin(time * 0.5 + pixel.offset) * 0.15;
        const finalOpacity = pixel.opacity + breathe + pixel.ripple * 0.3;

        // Draw pixel
        ctx.beginPath();
        const pixelSize = 2 + pixel.ripple * 2;
        ctx.arc(pixel.x, pixel.y, pixelSize, 0, Math.PI * 2);
        ctx.fillStyle = pixel.ripple > 0.1 ? colors.pixelActive : colors.pixel;
        ctx.globalAlpha = Math.min(finalOpacity, 1);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Create new symbols occasionally
      symbolTimer++;
      if (symbolTimer > symbolInterval && symbols.length < 3) {
        symbols.push(createSymbol());
        symbolTimer = 0;
      }

      // Update and draw symbols
      symbols = symbols.filter((symbol) => {
        symbol.progress += 0.015;
        symbol.lifetime--;

        if (symbol.lifetime < 60) {
          symbol.fadeOut -= 0.016;
        }

        if (symbol.fadeOut <= 0) return false;

        // Draw symbol with hand-drawn effect
        const drawPoints = Math.min(
          Math.floor(symbol.points.length * symbol.progress),
          symbol.points.length,
        );

        if (drawPoints > 1) {
          ctx.beginPath();
          ctx.moveTo(symbol.points[0].x, symbol.points[0].y);

          for (let i = 1; i < drawPoints; i++) {
            const point = symbol.points[i];
            // Add slight randomness for hand-drawn feel
            const jitterX = (Math.random() - 0.5) * 0.5;
            const jitterY = (Math.random() - 0.5) * 0.5;
            ctx.lineTo(point.x + jitterX, point.y + jitterY);
          }

          ctx.strokeStyle = colors.symbol;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.globalAlpha = symbol.fadeOut * 0.7;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        return true;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

export default AnimatedCanvas;
