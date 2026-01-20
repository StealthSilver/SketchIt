"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";

interface AIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDiagramGenerated: (shapes: DiagramShape[]) => void;
}

interface DiagramShape {
  id: string;
  type: "square" | "rectangle" | "circle";
  width?: number;
  height?: number;
  size?: number;
  radius?: number;
  bottomLeft?: { x: number; y: number };
  center?: { x: number; y: number };
}

export function AIDrawer({
  isOpen,
  onClose,
  onDiagramGenerated,
}: AIDrawerProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const COOLDOWN_SECONDS = 3; // Minimum 3 seconds between requests
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAYS = [5, 10, 30]; // Exponential backoff: 5s, 10s, 30s

  // Update cooldown timer
  useState(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  });

  const handleGenerate = async (isAutoRetry = false, attempt = 0) => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    // Check cooldown (skip for auto-retries)
    if (!isAutoRetry) {
      const now = Date.now();
      const timeSinceLastRequest = (now - lastRequestTime) / 1000;
      if (timeSinceLastRequest < COOLDOWN_SECONDS && lastRequestTime > 0) {
        setError(
          `Please wait ${Math.ceil(COOLDOWN_SECONDS - timeSinceLastRequest)} more seconds before making another request.`,
        );
        return;
      }
      setLastRequestTime(now);
      setCooldownRemaining(COOLDOWN_SECONDS);
    }

    setIsGenerating(true);
    setError("");
    setSuccess("");

    try {
      console.log(
        `[Attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS + 1}] Sending request to generate diagram for:`,
        prompt,
      );

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("/api/generate-svg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        // Handle rate limiting with auto-retry
        if (response.status === 429 && attempt < MAX_RETRY_ATTEMPTS) {
          const retryDelay = RETRY_DELAYS[attempt] || 30;
          setRetryAfter(retryDelay);
          setIsRetrying(true);
          setError(
            `Rate limit exceeded. Retrying in ${retryDelay} seconds... (Attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`,
          );

          // Countdown timer
          let countdown = retryDelay;
          const countdownInterval = setInterval(() => {
            countdown--;
            setRetryAfter(countdown);
            if (countdown > 0) {
              setError(
                `Rate limit exceeded. Retrying in ${countdown} seconds... (Attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`,
              );
            }
          }, 1000);

          // Auto-retry after delay
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * 1000),
          );
          clearInterval(countdownInterval);
          setIsRetrying(false);
          return handleGenerate(true, attempt + 1);
        } else if (response.status === 429) {
          throw new Error(
            "Rate limit exceeded. Maximum retry attempts reached. Please try again later.",
          );
        }

        // Handle other errors
        if (response.status === 401) {
          throw new Error(
            "Invalid API key. Please check your OpenAI API key configuration.",
          );
        }
        if (response.status === 402) {
          throw new Error(
            "Insufficient OpenAI credits. Please add credits to your account.",
          );
        }
        if (response.status >= 500) {
          throw new Error(
            "OpenAI service error. Please try again in a moment.",
          );
        }

        throw new Error(data.error || "Failed to generate diagram");
      }

      // Check if we have valid diagram data
      if (!data.diagram) {
        console.error("No diagram in response:", data);
        throw new Error("Invalid response format - no diagram data");
      }

      if (!data.diagram.shapes || !Array.isArray(data.diagram.shapes)) {
        console.error("Invalid shapes array:", data.diagram);
        throw new Error("Invalid response format - shapes must be an array");
      }

      if (data.diagram.shapes.length === 0) {
        throw new Error("No shapes were generated. Try a different prompt.");
      }

      console.log(
        `Generated ${data.diagram.shapes.length} shapes:`,
        data.diagram.shapes,
      );

      // Show success message with debug info
      if (data.debug) {
        setSuccess(
          `Successfully generated ${data.debug.validShapes} shapes${data.debug.filteredOut > 0 ? ` (${data.debug.filteredOut} invalid shapes filtered)` : ""}`,
        );
      } else {
        setSuccess(
          `Successfully generated ${data.diagram.shapes.length} shapes`,
        );
      }

      // Pass the shapes to the canvas to draw
      onDiagramGenerated(data.diagram.shapes);

      // Clear prompt and close after a short delay
      setTimeout(() => {
        setPrompt("");
        setRetryCount(0);
        setSuccess("");
        onClose();
      }, 1500);
    } catch (err) {
      // Handle timeout errors
      if (err instanceof Error && err.name === "AbortError") {
        const errorMsg = "Request timed out. Please try again.";
        console.error(errorMsg);
        setError(errorMsg);
        setIsRetrying(false);
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Generation error:", errorMessage, err);

      // Don't show error if we're retrying
      if (!isRetrying) {
        setError(errorMessage);
      }

      // Track retry count for analytics
      if (
        errorMessage.includes("Rate limit") ||
        errorMessage.includes("quota")
      ) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      if (!isRetrying) {
        setIsGenerating(false);
      }
    }
  };

  // Cancel retry on unmount or drawer close
  const handleClose = () => {
    setIsRetrying(false);
    setRetryAfter(0);
    setError("");
    setSuccess("");
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 transition-opacity"
          style={{ background: "rgba(1, 8, 18, 0.8)" }}
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-[420px] z-50 transform transition-transform duration-300 ease-in-out border-l ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "#010812",
          borderColor: "rgba(251, 191, 36, 0.1)",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: "rgba(251, 191, 36, 0.1)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: "rgba(251, 191, 36, 0.1)" }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#fbbf24" }}>
                  AI Generator
                </h2>
                <p
                  className="text-xs"
                  style={{ color: "rgba(251, 191, 36, 0.6)" }}
                >
                  Create simple diagrams with AI
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg transition-all hover:scale-110"
              style={{ background: "rgba(255, 255, 255, 0.05)" }}
            >
              <X className="w-5 h-5" style={{ color: "#fbbf24" }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium mb-3"
                  style={{ color: "#fbbf24" }}
                >
                  Describe what you want to draw
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="E.g., house, car, robot, tree, computer, person..."
                  className="w-full h-32 px-4 py-3 rounded-lg border resize-none transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: "rgba(251, 191, 36, 0.2)",
                    color: "#ededed",
                  }}
                  disabled={isGenerating}
                />
                <p
                  className="mt-2 text-xs"
                  style={{ color: "rgba(251, 191, 36, 0.5)" }}
                >
                  Press Enter to generate • Shift+Enter for new line
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    background: isRetrying
                      ? "rgba(251, 191, 36, 0.1)"
                      : "rgba(177, 9, 16, 0.1)",
                    borderColor: isRetrying
                      ? "rgba(251, 191, 36, 0.3)"
                      : "rgba(177, 9, 16, 0.3)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {isRetrying ? (
                      <Loader2
                        className="w-5 h-5 shrink-0 mt-0.5 animate-spin"
                        style={{ color: "#fbbf24" }}
                      />
                    ) : (
                      <svg
                        className="w-5 h-5 shrink-0 mt-0.5"
                        fill="#b10910"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium"
                        style={{ color: isRetrying ? "#fbbf24" : "#ff6b6b" }}
                      >
                        {error}
                      </p>
                      {isRetrying && retryAfter > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] transition-all duration-1000"
                              style={{
                                width: `${(1 - retryAfter / RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {!isRetrying &&
                        error.includes("Rate limit") &&
                        !error.includes("Maximum retry") && (
                          <div
                            className="mt-2 text-xs"
                            style={{ color: "rgba(255, 107, 107, 0.8)" }}
                          >
                            <p className="font-semibold mb-1">Tips:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>Wait a few moments before trying again</li>
                              <li>The system will auto-retry with backoff</li>
                              <li>Check your API usage limits</li>
                            </ul>
                          </div>
                        )}
                      {error.includes("Maximum retry") && (
                        <div
                          className="mt-2 text-xs"
                          style={{ color: "rgba(255, 107, 107, 0.8)" }}
                        >
                          <p className="font-semibold mb-1">What to do:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Wait 5-10 minutes</li>
                            <li>Check your OpenAI API usage limits</li>
                            <li>Consider upgrading your API plan</li>
                          </ul>
                        </div>
                      )}
                      {error.includes("Invalid API key") && (
                        <div
                          className="mt-2 text-xs"
                          style={{ color: "rgba(255, 107, 107, 0.8)" }}
                        >
                          <p>
                            Check your .env.local file and ensure OPENAI_API_KEY
                            is set correctly.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    background: "rgba(34, 197, 94, 0.1)",
                    borderColor: "rgba(34, 197, 94, 0.3)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5"
                      fill="#22c55e"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#22c55e" }}
                    >
                      {success}
                    </p>
                  </div>
                </div>
              )}

              {/* Example Prompts */}
              <div className="space-y-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "#fbbf24" }}
                >
                  Quick Examples
                </h3>
                <div className="space-y-2">
                  {["house", "car", "robot", "tree", "computer"].map(
                    (example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        disabled={isGenerating}
                        className="w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          borderColor: "rgba(251, 191, 36, 0.15)",
                          color: "#ededed",
                        }}
                      >
                        {example}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="p-6 border-t"
            style={{ borderColor: "rgba(251, 191, 36, 0.1)" }}
          >
            {cooldownRemaining > 0 && !isGenerating && (
              <div
                className="text-xs text-center mb-3 flex items-center justify-center gap-2"
                style={{ color: "rgba(251, 191, 36, 0.6)" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Wait {cooldownRemaining}s before next request
              </div>
            )}
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim() || cooldownRemaining > 0}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
              style={{
                background:
                  isGenerating || cooldownRemaining > 0
                    ? "rgba(255, 255, 255, 0.1)"
                    : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                color:
                  isGenerating || cooldownRemaining > 0 ? "#fbbf24" : "#010812",
              }}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Retrying in {retryAfter}s...
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Wait {cooldownRemaining}s
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Diagram
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
      `}</style>
    </>
  );
}
