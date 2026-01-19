"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface DrawingLine {
  points: Point[];
  color: string;
  width: number;
}

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [currentLine, setCurrentLine] = useState<Point[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: (screenX - rect.left - offset.x) / scale,
        y: (screenY - rect.top - offset.y) / scale,
      };
    },
    [scale, offset],
  );

  // Redraw the canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1 / scale;
    const gridSize = 50;
    const startX = Math.floor(-offset.x / scale / gridSize) * gridSize;
    const startY = Math.floor(-offset.y / scale / gridSize) * gridSize;
    const endX =
      Math.ceil((canvas.width - offset.x) / scale / gridSize) * gridSize;
    const endY =
      Math.ceil((canvas.height - offset.y) / scale / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw all lines
    lines.forEach((line) => {
      if (line.points.length < 2) return;

      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width / scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);

      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }

      ctx.stroke();
    });

    // Draw current line
    if (currentLine.length > 0) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2 / scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(currentLine[0].x, currentLine[0].y);

      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y);
      }

      ctx.stroke();
    }

    // Restore context state
    ctx.restore();
  }, [lines, currentLine, scale, offset]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [redraw]);

  // Redraw when dependencies change
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Mouse/Touch event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2 || e.ctrlKey || e.metaKey) {
      // Middle or right mouse button, or cmd/ctrl key - pan mode
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else {
      // Left mouse button - draw mode
      setIsDrawing(true);
      const point = screenToCanvas(e.clientX, e.clientY);
      setCurrentLine([point]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.x;
      const dy = e.clientY - lastPanPoint.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    } else if (isDrawing) {
      const point = screenToCanvas(e.clientX, e.clientY);
      setCurrentLine((prev) => [...prev, point]);
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else if (isDrawing) {
      setIsDrawing(false);
      if (currentLine.length > 0) {
        setLines((prev) => [
          ...prev,
          { points: currentLine, color: "#000000", width: 2 },
        ]);
        setCurrentLine([]);
      }
    }
  };

  // Wheel event for zooming
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Check if it's a pinch gesture (ctrlKey is set on trackpad pinch)
    if (e.ctrlKey) {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom factor (negative deltaY = zoom in)
      const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
      const newScale = Math.max(0.1, Math.min(10, scale * zoomFactor));

      // Adjust offset to zoom towards mouse position
      const scaleChange = newScale - scale;
      setOffset((prev) => ({
        x: prev.x - (mouseX - prev.x) * (scaleChange / scale),
        y: prev.y - (mouseY - prev.y) * (scaleChange / scale),
      }));

      setScale(newScale);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + 0 to reset zoom
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
      // Cmd/Ctrl + Z to undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setLines((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white dark:bg-gray-900">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className="cursor-crosshair touch-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Zoom: {Math.round(scale * 100)}%
        </p>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg max-w-xs">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          <strong>Controls:</strong>
        </p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Draw: Click and drag</li>
          <li>• Pan: Cmd/Ctrl + drag or middle mouse</li>
          <li>• Zoom: Pinch or Ctrl + scroll</li>
          <li>• Undo: Cmd/Ctrl + Z</li>
          <li>• Reset: Cmd/Ctrl + 0</li>
        </ul>
      </div>
    </div>
  );
}
