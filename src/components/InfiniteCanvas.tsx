"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

type ShapeType =
  | "pen"
  | "line"
  | "square"
  | "triangle"
  | "circle"
  | "arrow"
  | "eraser";

interface DrawingLine {
  points: Point[];
  color: string;
  width: number;
  shape?: ShapeType;
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
  const [selectedShape, setSelectedShape] = useState<ShapeType>("pen");
  const [startPoint, setStartPoint] = useState<Point | null>(null);

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

    // Draw all lines
    lines.forEach((line) => {
      if (line.points.length < 1) return;

      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width / scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = line.color;

      const shape = line.shape || "pen";

      if (shape === "pen") {
        if (line.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        ctx.stroke();
      } else if (shape === "line" && line.points.length >= 2) {
        const start = line.points[0];
        const end = line.points[line.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (shape === "square" && line.points.length >= 2) {
        const start = line.points[0];
        const end = line.points[line.points.length - 1];
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
      } else if (shape === "circle" && line.points.length >= 2) {
        const start = line.points[0];
        const end = line.points[line.points.length - 1];
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
        );
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (shape === "triangle" && line.points.length >= 2) {
        const start = line.points[0];
        const end = line.points[line.points.length - 1];
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.beginPath();
        ctx.moveTo(start.x + width / 2, start.y);
        ctx.lineTo(start.x, start.y + height);
        ctx.lineTo(start.x + width, start.y + height);
        ctx.closePath();
        ctx.stroke();
      } else if (shape === "arrow" && line.points.length >= 2) {
        const start = line.points[0];
        const end = line.points[line.points.length - 1];
        const headLength = 15 / scale;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      }
    });

    // Draw current line (preview)
    if (currentLine.length > 0) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 / scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = "#ffffff";

      if (selectedShape === "pen") {
        ctx.beginPath();
        ctx.moveTo(currentLine[0].x, currentLine[0].y);
        for (let i = 1; i < currentLine.length; i++) {
          ctx.lineTo(currentLine[i].x, currentLine[i].y);
        }
        ctx.stroke();
      } else if (selectedShape === "line" && currentLine.length >= 2) {
        const start = currentLine[0];
        const end = currentLine[currentLine.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (selectedShape === "square" && currentLine.length >= 2) {
        const start = currentLine[0];
        const end = currentLine[currentLine.length - 1];
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
      } else if (selectedShape === "circle" && currentLine.length >= 2) {
        const start = currentLine[0];
        const end = currentLine[currentLine.length - 1];
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
        );
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (selectedShape === "triangle" && currentLine.length >= 2) {
        const start = currentLine[0];
        const end = currentLine[currentLine.length - 1];
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.beginPath();
        ctx.moveTo(start.x + width / 2, start.y);
        ctx.lineTo(start.x, start.y + height);
        ctx.lineTo(start.x + width, start.y + height);
        ctx.closePath();
        ctx.stroke();
      } else if (selectedShape === "arrow" && currentLine.length >= 2) {
        const start = currentLine[0];
        const end = currentLine[currentLine.length - 1];
        const headLength = 15 / scale;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      }
    }

    // Restore context state
    ctx.restore();
  }, [lines, currentLine, scale, offset, selectedShape]);

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
    if (e.button === 1 || e.button === 2 || e.metaKey) {
      // Middle or right mouse button, or cmd key - pan mode
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
      if (selectedShape === "pen") {
        setCurrentLine((prev) => [...prev, point]);
      } else if (selectedShape === "eraser") {
        // Eraser mode - remove lines that are close to the cursor
        const eraserRadius = 10 / scale;
        setLines((prev) =>
          prev.filter((line) => {
            return !line.points.some(
              (p) =>
                Math.sqrt(
                  Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2),
                ) < eraserRadius,
            );
          }),
        );
      } else {
        // For shapes, just update the end point
        setCurrentLine((prev) => [prev[0], point]);
      }
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else if (isDrawing) {
      setIsDrawing(false);
      if (currentLine.length > 0 && selectedShape !== "eraser") {
        setLines((prev) => [
          ...prev,
          {
            points: currentLine,
            color: "#ffffff",
            width: 2,
            shape: selectedShape,
          },
        ]);
      }
      setCurrentLine([]);
    }
  };

  // Wheel event for zooming and panning
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
    } else {
      // Two-finger pan (regular scroll without ctrl)
      e.preventDefault();
      setOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser zoom
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "_")
      ) {
        e.preventDefault();
      }
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
    <div
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{
        overscrollBehavior: "none",
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className="cursor-crosshair touch-none"
        style={{
          width: "100%",
          height: "100%",
          overscrollBehavior: "none",
        }}
      />

      {/* Shape Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg flex gap-2">
        <button
          onClick={() => setSelectedShape("pen")}
          className={`p-2 rounded transition-colors ${
            selectedShape === "pen"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          title="Pen (Free Draw)"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
          </svg>
        </button>
        <button
          onClick={() => setSelectedShape("line")}
          className={`p-2 rounded transition-colors ${
            selectedShape === "line"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          title="Line"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="5" x2="19" y2="19" />
          </svg>
        </button>
        <button
          onClick={() => setSelectedShape("square")}
          className={`p-2 rounded transition-colors ${
            selectedShape === "square"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          title="Square"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="4" y="4" width="16" height="16" />
          </svg>
        </button>
        <button
          onClick={() => setSelectedShape("triangle")}
          className={`p-2 rounded transition-colors ${
            selectedShape === "triangle"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          title="Triangle"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2 L2 22 L22 22 Z" />
          </svg>
        </button>
        <button
          onClick={() => setSelectedShape("circle")}
          className={`p-2 rounded transition-colors ${
            selectedShape === "circle"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          title="Circle"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>
        <button
          onClick={() => setSelectedShape("arrow")}
          className={`p-2 rounded transition-colors ${
            selectedShape === "arrow"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          title="Arrow"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <button
          onClick={() => setSelectedShape("eraser")}
          className={`p-2 rounded transition-colors ${
            selectedShape === "eraser"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
          title="Eraser"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 20H7L3 16 12 7 17 12M11 9L15 13" />
            <path d="M8.5 14.5L11.5 17.5" />
          </svg>
        </button>
      </div>

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
          <li>• Pan: Cmd + drag, middle mouse, or two-finger drag</li>
          <li>• Zoom: Pinch or Ctrl + scroll</li>
          <li>• Undo: Cmd/Ctrl + Z</li>
          <li>• Reset: Cmd/Ctrl + 0</li>
        </ul>
      </div>
    </div>
  );
}
