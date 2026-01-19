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

  // Check if eraser intersects with a shape
  const eraserIntersectsShape = useCallback(
    (line: DrawingLine, eraserPoint: Point, eraserRadius: number) => {
      const shape = line.shape || "pen";

      if (shape === "pen") {
        // For pen, check if any point is within eraser radius
        return line.points.some(
          (p) =>
            Math.sqrt(
              Math.pow(p.x - eraserPoint.x, 2) +
                Math.pow(p.y - eraserPoint.y, 2),
            ) < eraserRadius,
        );
      }

      if (line.points.length < 2) return false;
      const start = line.points[0];
      const end = line.points[line.points.length - 1];

      if (shape === "line") {
        // Check distance from point to line segment
        const A = eraserPoint.x - start.x;
        const B = eraserPoint.y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;
        let xx, yy;
        if (param < 0) {
          xx = start.x;
          yy = start.y;
        } else if (param > 1) {
          xx = end.x;
          yy = end.y;
        } else {
          xx = start.x + param * C;
          yy = start.y + param * D;
        }
        const dx = eraserPoint.x - xx;
        const dy = eraserPoint.y - yy;
        return Math.sqrt(dx * dx + dy * dy) < eraserRadius;
      }

      if (shape === "square") {
        // Check if eraser intersects with rectangle edges
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        // Check if point is near any edge
        const nearLeft =
          Math.abs(eraserPoint.x - minX) < eraserRadius &&
          eraserPoint.y >= minY - eraserRadius &&
          eraserPoint.y <= maxY + eraserRadius;
        const nearRight =
          Math.abs(eraserPoint.x - maxX) < eraserRadius &&
          eraserPoint.y >= minY - eraserRadius &&
          eraserPoint.y <= maxY + eraserRadius;
        const nearTop =
          Math.abs(eraserPoint.y - minY) < eraserRadius &&
          eraserPoint.x >= minX - eraserRadius &&
          eraserPoint.x <= maxX + eraserRadius;
        const nearBottom =
          Math.abs(eraserPoint.y - maxY) < eraserRadius &&
          eraserPoint.x >= minX - eraserRadius &&
          eraserPoint.x <= maxX + eraserRadius;
        return nearLeft || nearRight || nearTop || nearBottom;
      }

      if (shape === "circle") {
        // Check if eraser intersects with circle
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
        );
        const distToCenter = Math.sqrt(
          Math.pow(eraserPoint.x - start.x, 2) +
            Math.pow(eraserPoint.y - start.y, 2),
        );
        return Math.abs(distToCenter - radius) < eraserRadius;
      }

      if (shape === "triangle") {
        // Check if eraser intersects with triangle edges
        const width = end.x - start.x;
        const height = end.y - start.y;
        const p1 = { x: start.x + width / 2, y: start.y };
        const p2 = { x: start.x, y: start.y + height };
        const p3 = { x: start.x + width, y: start.y + height };

        // Check distance to each edge
        const edges = [
          [p1, p2],
          [p2, p3],
          [p3, p1],
        ];

        for (const [edgeStart, edgeEnd] of edges) {
          const A = eraserPoint.x - edgeStart.x;
          const B = eraserPoint.y - edgeStart.y;
          const C = edgeEnd.x - edgeStart.x;
          const D = edgeEnd.y - edgeStart.y;
          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;
          if (lenSq !== 0) param = dot / lenSq;
          let xx, yy;
          if (param < 0) {
            xx = edgeStart.x;
            yy = edgeStart.y;
          } else if (param > 1) {
            xx = edgeEnd.x;
            yy = edgeEnd.y;
          } else {
            xx = edgeStart.x + param * C;
            yy = edgeStart.y + param * D;
          }
          const dx = eraserPoint.x - xx;
          const dy = eraserPoint.y - yy;
          if (Math.sqrt(dx * dx + dy * dy) < eraserRadius) return true;
        }
        return false;
      }

      if (shape === "arrow") {
        // Check distance from point to arrow line segment
        const A = eraserPoint.x - start.x;
        const B = eraserPoint.y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;
        let xx, yy;
        if (param < 0) {
          xx = start.x;
          yy = start.y;
        } else if (param > 1) {
          xx = end.x;
          yy = end.y;
        } else {
          xx = start.x + param * C;
          yy = start.y + param * D;
        }
        const dx = eraserPoint.x - xx;
        const dy = eraserPoint.y - yy;
        return Math.sqrt(dx * dx + dy * dy) < eraserRadius;
      }

      return false;
    },
    [],
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
        // Eraser mode - remove shapes that intersect with the cursor
        const eraserRadius = 20 / scale;
        setLines((prev) =>
          prev.filter(
            (line) => !eraserIntersectsShape(line, point, eraserRadius),
          ),
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
        className="touch-none"
        style={{
          width: "100%",
          height: "100%",
          overscrollBehavior: "none",
          cursor:
            selectedShape === "eraser"
              ? 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="white" stroke-width="2"/></svg>\') 16 16, auto'
              : "crosshair",
        }}
      />

      {/* Shape Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500/90 to-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex gap-2">
        <button
          onClick={() => setSelectedShape("pen")}
          className={`p-2 rounded transition-colors ${
            selectedShape === "pen"
              ? "bg-white text-amber-600 shadow-md"
              : "bg-black/20 text-white hover:bg-black/30"
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
              ? "bg-white text-amber-600 shadow-md"
              : "bg-black/20 text-white hover:bg-black/30"
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
              ? "bg-white text-amber-600 shadow-md"
              : "bg-black/20 text-white hover:bg-black/30"
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
              ? "bg-white text-amber-600 shadow-md"
              : "bg-black/20 text-white hover:bg-black/30"
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
              ? "bg-white text-amber-600 shadow-md"
              : "bg-black/20 text-white hover:bg-black/30"
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
              ? "bg-white text-amber-600 shadow-md"
              : "bg-black/20 text-white hover:bg-black/30"
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
              ? "bg-white text-amber-600 shadow-md"
              : "bg-black/20 text-white hover:bg-black/30"
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
