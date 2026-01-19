"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { AIDrawer } from "./AIDrawer";

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
  | "eraser"
  | "select";

type StrokePattern = "solid" | "dashed" | "longDashed";

interface DrawingLine {
  points: Point[];
  color: string;
  width: number;
  shape?: ShapeType;
  svgData?: string;
  svgSize?: { width: number; height: number };
  strokePattern?: StrokePattern;
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
  const [selectedShapes, setSelectedShapes] = useState<Set<number>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{
    start: Point;
    end: Point;
  } | null>(null);
  const [clipboard, setClipboard] = useState<DrawingLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [lineColor, setLineColor] = useState("#fbbf24"); // Default amber color
  const [lineWidth, setLineWidth] = useState(2); // Default line width
  const [strokePattern, setStrokePattern] = useState<StrokePattern>("solid"); // Default stroke pattern
  const userId = "default-user"; // Can be replaced with actual user ID from auth

  // Load canvas data from database on mount
  useEffect(() => {
    const loadCanvas = async () => {
      try {
        const response = await fetch(`/api/canvas?userId=${userId}`);
        const result = await response.json();

        if (result.success && result.data.lines) {
          console.log("Loaded canvas data:", result.data.lines.length, "lines");
          setLines(result.data.lines);
        }
      } catch (error) {
        console.error("Error loading canvas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvas();
  }, [userId]);

  // Save canvas data to database (with debounce)
  useEffect(() => {
    if (isLoading) return; // Don't save while loading

    const saveCanvas = async () => {
      try {
        console.log("Saving canvas with", lines.length, "lines");
        await fetch("/api/canvas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            lines,
          }),
        });
      } catch (error) {
        console.error("Error saving canvas:", error);
      }
    };

    // Debounce saves - wait 1 second after last change
    const timeoutId = setTimeout(() => {
      saveCanvas();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [lines, userId, isLoading]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (lines.length > 0) {
        // Use sendBeacon for reliable save on unload
        const blob = new Blob(
          [
            JSON.stringify({
              userId,
              lines,
            }),
          ],
          { type: "application/json" },
        );
        navigator.sendBeacon("/api/canvas", blob);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [lines, userId]);

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

  // Check if a point is inside a shape's bounding box
  const isPointInShape = useCallback(
    (point: Point, line: DrawingLine, tolerance: number = 10) => {
      if (line.points.length < 1) return false;
      const shape = line.shape || "pen";

      if (shape === "pen") {
        // For pen, check if point is near any line segment
        for (let i = 0; i < line.points.length - 1; i++) {
          const p1 = line.points[i];
          const p2 = line.points[i + 1];
          const dist = distanceToSegment(point, p1, p2);
          if (dist < tolerance / scale) return true;
        }
        return false;
      }

      if (line.points.length < 2) return false;
      const start = line.points[0];
      const end = line.points[line.points.length - 1];
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);

      // Check if point is in bounding box
      return (
        point.x >= minX - tolerance / scale &&
        point.x <= maxX + tolerance / scale &&
        point.y >= minY - tolerance / scale &&
        point.y <= maxY + tolerance / scale
      );
    },
    [scale],
  );

  // Helper function to calculate distance from point to line segment
  const distanceToSegment = (point: Point, p1: Point, p2: Point): number => {
    const A = point.x - p1.x;
    const B = point.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

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

  // Apply stroke pattern to context
  const applyStrokePattern = useCallback(
    (ctx: CanvasRenderingContext2D, pattern?: StrokePattern) => {
      const currentPattern = pattern || "solid";
      if (currentPattern === "dashed") {
        ctx.setLineDash([10 / scale, 10 / scale]);
      } else if (currentPattern === "longDashed") {
        ctx.setLineDash([20 / scale, 10 / scale]);
      } else {
        ctx.setLineDash([]);
      }
    },
    [scale],
  );

  // Redraw the canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    console.log("Redrawing canvas with", lines.length, "lines");

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

      // Apply stroke pattern for shape tools (not for pen)
      if (shape !== "pen") {
        applyStrokePattern(ctx, line.strokePattern);
      } else {
        ctx.setLineDash([]);
      }

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

      // Render SVG if present
      if (line.svgData && line.svgSize && line.points.length >= 2) {
        const start = line.points[0];
        const blob = new Blob([line.svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(
            img,
            start.x,
            start.y,
            line.svgSize!.width / scale,
            line.svgSize!.height / scale,
          );
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }
    });
    // Draw selection highlights
    if (selectedShapes.size > 0) {
      selectedShapes.forEach((index) => {
        const line = lines[index];
        if (!line || line.points.length < 1) return;

        const shape = line.shape || "pen";
        ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"; // Blue highlight
        ctx.lineWidth = 3 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);

        if (shape === "pen") {
          // Draw bounding box for pen strokes
          const xs = line.points.map((p) => p.x);
          const ys = line.points.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const padding = 5 / scale;
          ctx.strokeRect(
            minX - padding,
            minY - padding,
            maxX - minX + padding * 2,
            maxY - minY + padding * 2,
          );
        } else if (line.points.length >= 2) {
          const start = line.points[0];
          const end = line.points[line.points.length - 1];
          const minX = Math.min(start.x, end.x);
          const maxX = Math.max(start.x, end.x);
          const minY = Math.min(start.y, end.y);
          const maxY = Math.max(start.y, end.y);
          const padding = 5 / scale;
          ctx.strokeRect(
            minX - padding,
            minY - padding,
            maxX - minX + padding * 2,
            maxY - minY + padding * 2,
          );
        }
        ctx.setLineDash([]);
      });
    }

    // Draw selection box
    if (selectionBox) {
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.lineWidth = 1 / scale;
      ctx.setLineDash([5 / scale, 5 / scale]);
      const width = selectionBox.end.x - selectionBox.start.x;
      const height = selectionBox.end.y - selectionBox.start.y;
      ctx.fillRect(selectionBox.start.x, selectionBox.start.y, width, height);
      ctx.strokeRect(selectionBox.start.x, selectionBox.start.y, width, height);
      ctx.setLineDash([]);
    }
    // Draw current line (preview)
    if (currentLine.length > 0) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 / scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = "#ffffff";

      // Apply stroke pattern for preview (not for pen)
      if (selectedShape !== "pen") {
        applyStrokePattern(ctx, strokePattern);
      } else {
        ctx.setLineDash([]);
      }

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
  }, [
    lines,
    currentLine,
    scale,
    offset,
    selectedShape,
    selectedShapes,
    selectionBox,
    applyStrokePattern,
    strokePattern,
  ]);

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

  // Force redraw after loading completes
  useEffect(() => {
    if (!isLoading && lines.length > 0) {
      console.log(
        "Loading complete, forcing redraw with",
        lines.length,
        "lines",
      );
      // Small delay to ensure canvas is ready
      const timeoutId = setTimeout(() => {
        redraw();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, lines.length, redraw]);

  // Mouse/Touch event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      e.button === 1 ||
      e.button === 2 ||
      (e.metaKey && selectedShape !== "select")
    ) {
      // Middle or right mouse button, or cmd key - pan mode (except in select mode)
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    } else if (selectedShape === "select") {
      // Selection mode
      const point = screenToCanvas(e.clientX, e.clientY);

      // Check if clicking on an already selected shape
      let clickedSelected = false;
      for (const index of selectedShapes) {
        if (isPointInShape(point, lines[index])) {
          clickedSelected = true;
          break;
        }
      }

      if (clickedSelected) {
        // Keep selection and prepare for potential drag
        setIsDrawing(false);
      } else {
        // Check if clicking on a new shape
        let foundShape = false;
        for (let i = lines.length - 1; i >= 0; i--) {
          if (isPointInShape(point, lines[i])) {
            setSelectedShapes(new Set([i]));
            foundShape = true;
            break;
          }
        }

        if (!foundShape) {
          // Start selection box
          setSelectedShapes(new Set());
          setSelectionBox({ start: point, end: point });
          setIsDrawing(true);
        }
      }
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
      if (selectedShape === "select" && selectionBox) {
        // Update selection box
        setSelectionBox((prev) => (prev ? { ...prev, end: point } : null));
      } else if (selectedShape === "pen") {
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

      if (selectedShape === "select" && selectionBox) {
        // Find shapes within selection box
        const minX = Math.min(selectionBox.start.x, selectionBox.end.x);
        const maxX = Math.max(selectionBox.start.x, selectionBox.end.x);
        const minY = Math.min(selectionBox.start.y, selectionBox.end.y);
        const maxY = Math.max(selectionBox.start.y, selectionBox.end.y);

        const selected = new Set<number>();
        lines.forEach((line, index) => {
          if (line.points.length < 1) return;

          // Check if any point of the shape is within selection box
          const inBox = line.points.some(
            (p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY,
          );

          if (inBox) selected.add(index);
        });

        setSelectedShapes(selected);
        setSelectionBox(null);
      } else if (currentLine.length > 0 && selectedShape !== "eraser") {
        setLines((prev) => [
          ...prev,
          {
            points: currentLine,
            color: lineColor,
            width: lineWidth,
            shape: selectedShape,
            strokePattern: strokePattern,
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

      // Selection tool shortcuts
      if (selectedShape === "select" && selectedShapes.size > 0) {
        // Cmd/Ctrl + C to copy
        if ((e.metaKey || e.ctrlKey) && e.key === "c") {
          e.preventDefault();
          const shapesToCopy = Array.from(selectedShapes).map((i) => lines[i]);
          setClipboard(shapesToCopy);
        }

        // Cmd/Ctrl + V to paste
        if ((e.metaKey || e.ctrlKey) && e.key === "v") {
          e.preventDefault();
          if (clipboard.length > 0) {
            const offset = 20 / scale; // Offset for pasted shapes
            const pastedShapes = clipboard.map((shape) => ({
              ...shape,
              points: shape.points.map((p) => ({
                x: p.x + offset,
                y: p.y + offset,
              })),
            }));

            const startIndex = lines.length;
            setLines((prev) => [...prev, ...pastedShapes]);

            // Select the newly pasted shapes
            const newSelection = new Set<number>();
            for (let i = 0; i < pastedShapes.length; i++) {
              newSelection.add(startIndex + i);
            }
            setSelectedShapes(newSelection);
          }
        }

        // Delete or Backspace to delete selected shapes
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          const indicesToDelete = Array.from(selectedShapes).sort(
            (a, b) => b - a,
          );
          setLines((prev) => {
            const newLines = [...prev];
            indicesToDelete.forEach((index) => {
              newLines.splice(index, 1);
            });
            return newLines;
          });
          setSelectedShapes(new Set());
        }
      }

      // Cmd/Ctrl + V to paste even when not in select mode
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "v" &&
        selectedShape !== "select" &&
        clipboard.length > 0
      ) {
        e.preventDefault();
        const offset = 20 / scale;
        const pastedShapes = clipboard.map((shape) => ({
          ...shape,
          points: shape.points.map((p) => ({
            x: p.x + offset,
            y: p.y + offset,
          })),
        }));
        setLines((prev) => [...prev, ...pastedShapes]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShape, selectedShapes, clipboard, lines, scale]);

  // Handle AI-generated SVG
  const handleSVGGenerated = (svgString: string) => {
    try {
      // Create an image from the SVG
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Calculate position (center of viewport)
        const centerX = canvas.width / 2 - offset.x;
        const centerY = canvas.height / 2 - offset.y;

        // Scale the SVG to a reasonable size (max 400px)
        const maxSize = 400;
        const scaleFactor = Math.min(
          maxSize / img.width,
          maxSize / img.height,
          1,
        );
        const width = img.width * scaleFactor;
        const height = img.height * scaleFactor;

        // Convert SVG to canvas points by creating an outline
        // For simplicity, we'll add it as a series of connected points forming a rectangle
        // with the image data stored (you could enhance this to trace the actual SVG paths)
        const svgPoints: Point[] = [
          { x: centerX / scale, y: centerY / scale },
          { x: (centerX + width) / scale, y: centerY / scale },
          { x: (centerX + width) / scale, y: (centerY + height) / scale },
          { x: centerX / scale, y: (centerY + height) / scale },
          { x: centerX / scale, y: centerY / scale },
        ];

        // Store SVG data in a new line object
        const newLine: DrawingLine & {
          svgData?: string;
          svgSize?: { width: number; height: number };
        } = {
          points: svgPoints,
          color: "#000000",
          width: 2,
          shape: "square",
          svgData: svgString,
          svgSize: { width, height },
        };

        setLines((prev) => [...prev, newLine]);
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        console.error("Failed to load SVG image");
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error("Error handling SVG:", error);
    }
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        background: "#010812",
        overscrollBehavior: "none",
        touchAction: "none",
      }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: "#010812" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin" />
            <div className="text-[#fbbf24] text-lg font-medium">
              Loading canvas...
            </div>
          </div>
        </div>
      )}
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
              ? 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" fill="none" stroke="%23fbbf24" stroke-width="2"/></svg>\') 16 16, auto'
              : selectedShape === "select"
                ? "default"
                : "crosshair",
        }}
      />

      {/* Top Toolbar - Logo and Actions */}
      <div
        className="absolute top-6 left-6 right-6 flex items-center justify-between z-20"
        style={{ pointerEvents: "none" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            pointerEvents: "auto",
          }}
        >
          <img
            src="/sketchit-dark.svg"
            alt="SketchIt Logo"
            className="h-7 w-auto"
          />
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center gap-2"
          style={{ pointerEvents: "auto" }}
        >
          <button
            onClick={() => {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-105 hover:border-[#fbbf24]/50"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
            title="Reset View (Cmd+0)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M18.7 8C18 5.8 16.2 4 14 3.5 11.8 3 9.5 3.5 7.5 5" />
              <path d="M21 12c0 5-4 9-9 9s-9-4-9-9" />
            </svg>
          </button>

          <button
            onClick={() => setLines((prev) => prev.slice(0, -1))}
            className="p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-105 hover:border-[#fbbf24]/50"
            style={{ background: "rgba(255, 255, 255, 0.05)" }}
            title="Undo (Cmd+Z)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
            </svg>
          </button>

          <button
            onClick={() => setLines([])}
            className="p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-105 hover:border-[#b10910]/50"
            style={{ background: "rgba(177, 9, 16, 0.1)" }}
            title="Clear Canvas"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b10910"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Drawing Tool Customization Panel - Left Side */}
      {selectedShape !== "select" && selectedShape !== "eraser" && (
        <div
          className="absolute left-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 px-5 py-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl z-20"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            pointerEvents: "auto",
            minWidth: "220px",
          }}
        >
          {/* Color Picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: "#fbbf24" }}>
              Stroke Color
            </label>
            <div className="flex flex-col gap-2">
              <input
                type="color"
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
                className="w-full h-10 rounded-lg cursor-pointer border border-white/20"
                style={{ background: "transparent" }}
              />
              <input
                type="text"
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-mono border border-white/20 bg-white/5 text-white focus:outline-none focus:border-[#fbbf24] transition-colors"
                placeholder="#fbbf24"
              />
            </div>
          </div>

          {/* Width Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium"
                style={{ color: "#fbbf24" }}
              >
                Stroke Width
              </label>
              <span className="text-xs font-medium text-white/60">
                {lineWidth}px
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((lineWidth - 1) / 19) * 100}%, rgba(255, 255, 255, 0.1) ${((lineWidth - 1) / 19) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
            {/* Width Preview */}
            <div className="flex items-center justify-center py-3">
              <div
                style={{
                  width: "100%",
                  height: `${lineWidth}px`,
                  background: lineColor,
                  borderRadius: "2px",
                  maxHeight: "20px",
                }}
              />
            </div>
          </div>

          {/* Stroke Pattern - Only show for shape tools, not pen */}
          {selectedShape !== "pen" && (
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium"
                style={{ color: "#fbbf24" }}
              >
                Stroke Pattern
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setStrokePattern("solid")}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                    strokePattern === "solid"
                      ? "border-[#fbbf24] bg-[#fbbf24]/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                  title="Solid"
                >
                  <svg
                    width="100%"
                    height="16"
                    viewBox="0 0 60 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="8"
                      x2="60"
                      y2="8"
                      stroke={strokePattern === "solid" ? "#fbbf24" : "#ffffff"}
                      strokeWidth="3"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setStrokePattern("dashed")}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                    strokePattern === "dashed"
                      ? "border-[#fbbf24] bg-[#fbbf24]/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                  title="Dashed"
                >
                  <svg
                    width="100%"
                    height="16"
                    viewBox="0 0 60 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="8"
                      x2="60"
                      y2="8"
                      stroke={
                        strokePattern === "dashed" ? "#fbbf24" : "#ffffff"
                      }
                      strokeWidth="3"
                      strokeDasharray="8 8"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setStrokePattern("longDashed")}
                  className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                    strokePattern === "longDashed"
                      ? "border-[#fbbf24] bg-[#fbbf24]/20"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                  title="Long Dashed"
                >
                  <svg
                    width="100%"
                    height="16"
                    viewBox="0 0 60 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="8"
                      x2="60"
                      y2="8"
                      stroke={
                        strokePattern === "longDashed" ? "#fbbf24" : "#ffffff"
                      }
                      strokeWidth="3"
                      strokeDasharray="16 8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Center Toolbar - Shape Tools */}
      <div
        className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 px-3 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-2xl z-20"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={() => setSelectedShape("select")}
          className={`p-2.5 rounded-full transition-all ${
            selectedShape === "select"
              ? "bg-[#fbbf24] shadow-lg shadow-[#fbbf24]/30"
              : "hover:bg-white/10"
          }`}
          title="Select"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedShape === "select" ? "#010812" : "#fbbf24"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </button>

        <button
          onClick={() => setSelectedShape("pen")}
          className={`p-2.5 rounded-full transition-all ${
            selectedShape === "pen"
              ? "bg-[#fbbf24] shadow-lg shadow-[#fbbf24]/30"
              : "hover:bg-white/10"
          }`}
          title="Pen"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedShape === "pen" ? "#010812" : "#fbbf24"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/10" />

        <button
          onClick={() => setSelectedShape("line")}
          className={`p-2.5 rounded-full transition-all ${
            selectedShape === "line"
              ? "bg-[#fbbf24] shadow-lg shadow-[#fbbf24]/30"
              : "hover:bg-white/10"
          }`}
          title="Line"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedShape === "line" ? "#010812" : "#fbbf24"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="5" x2="19" y2="19" />
          </svg>
        </button>

        <button
          onClick={() => setSelectedShape("square")}
          className={`p-2.5 rounded-full transition-all ${
            selectedShape === "square"
              ? "bg-[#fbbf24] shadow-lg shadow-[#fbbf24]/30"
              : "hover:bg-white/10"
          }`}
          title="Rectangle"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedShape === "square" ? "#010812" : "#fbbf24"}
            strokeWidth="2"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>

        <button
          onClick={() => setSelectedShape("circle")}
          className={`p-2.5 rounded-full transition-all ${
            selectedShape === "circle"
              ? "bg-[#fbbf24] shadow-lg shadow-[#fbbf24]/30"
              : "hover:bg-white/10"
          }`}
          title="Circle"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedShape === "circle" ? "#010812" : "#fbbf24"}
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>

        <button
          onClick={() => setSelectedShape("triangle")}
          className={`p-2.5 rounded-full transition-all ${
            selectedShape === "triangle"
              ? "bg-[#fbbf24] shadow-lg shadow-[#fbbf24]/30"
              : "hover:bg-white/10"
          }`}
          title="Triangle"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedShape === "triangle" ? "#010812" : "#fbbf24"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2 L2 22 L22 22 Z" />
          </svg>
        </button>

        <button
          onClick={() => setSelectedShape("arrow")}
          className={`p-2.5 rounded-full transition-all ${
            selectedShape === "arrow"
              ? "bg-[#fbbf24] shadow-lg shadow-[#fbbf24]/30"
              : "hover:bg-white/10"
          }`}
          title="Arrow"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedShape === "arrow" ? "#010812" : "#fbbf24"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/10" />

        <button
          onClick={() => setSelectedShape("eraser")}
          className={`p-2.5 rounded-full transition-all ${
            selectedShape === "eraser"
              ? "bg-[#b10910] shadow-lg shadow-[#b10910]/30"
              : "hover:bg-white/10"
          }`}
          title="Eraser"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={selectedShape === "eraser" ? "#ffffff" : "#b10910"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 20H7L3 16 12 7 17 12M11 9L15 13" />
          </svg>
        </button>
      </div>

      {/* AI Button - Bottom Right */}
      <div className="absolute bottom-6 right-6 flex items-center gap-3 z-20">
        {/* Zoom indicator */}
        <div
          className="px-4 py-2.5 rounded-full backdrop-blur-md border border-white/10"
          style={{ background: "rgba(255, 255, 255, 0.05)" }}
        >
          <p className="text-sm font-medium" style={{ color: "#fbbf24" }}>
            {Math.round(scale * 100)}%
          </p>
        </div>

        {/* AI Button */}
        <button
          onClick={() => setIsAIDrawerOpen(true)}
          className="group relative px-5 py-3 rounded-full font-medium transition-all hover:scale-105 shadow-lg shadow-[#fbbf24]/20 flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#010812"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span style={{ color: "#010812" }}>AI Generate</span>
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] opacity-0 group-hover:opacity-30 blur transition-opacity" />
        </button>
      </div>

      {/* AI Drawer */}
      <AIDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        onSVGGenerated={handleSVGGenerated}
      />
    </div>
  );
}
