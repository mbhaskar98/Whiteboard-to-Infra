// src/hooks/useAiModel.tsx

import { useCallback, useEffect, useRef, useState } from "react";

// Types are globally available from 'src/chrome-ai.d.ts'

/** The possible states of the AI model */
export type AiModelStatus = "idle" | "error" | Availability;

/** The return value of our minimal hook */
export interface UseAiModelResult {
  /** The current status of the model */
  status: AiModelStatus;
  /** The active AI model (null if not ready) */
  model: LanguageModel | null;
  /** Download progress from 0 to 100 */
  progress: number;
  /** Function to trigger the model creation (and download) */
  initialize: () => Promise<void>;
  /** A status message */
  message: string;
  /** An error message, if any */
  modelErrorMessage: string | null;
}

// Centralized message strings for the AI model hook
const AiModelMessages = {
  defaultMessage: "Initialize the AI model",
  ready: "AI model is ready to use.",
  apiUnavailable:
    "Error: LanguageModel API is not available on this browser. Make sure experimental flags are enabled - https://developer.chrome.com/docs/ai/get-started#use_apis_on_localhost",
  notSupported: "The LanguageModel API is not supported on this device.",
  genericError: "An error occurred initializing the AI model.",
};

/**
 * A minimal hook to manage the state of the Chrome AI Language Model.
 */
export function useAiModel(): UseAiModelResult {
  const [status, setStatus] = useState<AiModelStatus>("idle");
  const [model, setModel] = useState<LanguageModel | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>(
    AiModelMessages.defaultMessage
  );
  const [modelErrorMessage, setModelErrorMessage] = useState<string | null>(
    null
  );

  // Ref to prevent multiple initialization attempts
  const isInitializing = useRef(false);

  /**
   * Triggers the LanguageModel.create() call.
   * This MUST be called from a user-activated event (like a click).
   */
  const initialize = useCallback(async () => {
    setModelErrorMessage(null);
    // create delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Prevent re-runs if already initializing or ready
    if (isInitializing.current || model) {
      return;
    }

    // 1. Check if the API exists at all
    if (typeof LanguageModel === "undefined") {
      setModelErrorMessage(AiModelMessages.apiUnavailable);
      setStatus("error");
      return;
    }

    const availability = await LanguageModel.availability();
    console.log("LanguageModel availability:", availability);
    if (availability === undefined || availability === "unavailable") {
      setModelErrorMessage(AiModelMessages.notSupported);
      setStatus("error");
      return;
    }

    isInitializing.current = true;
    setStatus("downloading"); // Assume download is needed, monitor will correct
    setModelErrorMessage(null);
    setProgress(0);

    try {
      // 2. Call create() and attach the monitor
      const newModel = await LanguageModel.create({
        expectedInputs: [
          { type: "image" },
          { type: "text", languages: ["en"] },
        ],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
        temperature: 0.0,
        topK: 1,
        initialPrompts: [
          {
            role: "system",
            content: [
              {
                type: "text",
                value:
                  "You are an expert at converting hand-drawn diagrams into accurate Mermaid.js syntax. \
                  ⚠️ CRITICAL: Your primary goal is COMPLETENESS and accuracy. \
                  ⚠️ It is wrong to include any extra connection. \
                  ⚠️ CRITICAL: If you see x items in the image, you MUST output exactly x nodes. \
                  ⚠️ CRITICAL: Trace EVERY line carefully, including lines that might be faint or hand-drawn. \
                  Your goal is to capture EVERY node and EVERY connection visible in the diagram. \
                  STEP-BY-STEP PROCESS: \
                  1. IDENTIFY ALL NODES: Look carefully at the entire image. List every box, circle, cylinder, computer icon, cloud, or labeled element you see. Include labels written inside shapes AND labels written nearby with arrows pointing to them. \
                  2. IDENTIFY ALL CONNECTIONS: Trace every line, arrow, or connector. Note whether each line is solid (-->) or (<-->) or dashed (-.->) or (<-.->) or dotted. Follow each line from its source to its destination. \
                  3. CHECK FOR BIDIRECTIONAL ARROWS: If an arrow has heads on both ends, represent it as two separate connections (A --> B and B --> A). \
                  4. VERIFY COMPLETENESS: Count the nodes in your list and compare to what you see in the image. Count the connections and verify each one. \
                  5. GENERATE MERMAID CODE: Use 'graph TD' format with PascalCase node names. \
                  \
                  CRITICAL RULES: \
                  - NEVER skip nodes. If you see x items in the diagram, your output must have x nodes. \
                  - NEVER skip connections. Every line must become a connection in your output. \
                  - Use '-->' or '<-->' for solid arrows \
                  - Use '-.->' or '<-.->' for dashed arrows \
                  - If a node has a longer name like 'Wi-Fi Access Point', use PascalCase: WiFiAccessPoint \
                  - If a node is drawn as a database icon (cylinder), still treat it as a regular node \
                  - Do NOT use subgraphs or clusters \
                  - Your ONLY output should be valid Mermaid.js code starting with 'graph TD'",
              },
            ],
          },
        ],

        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            const percent = Math.round(e.loaded * 100);
            console.log("Download progress event:", e);
            setProgress(percent);
            setStatus("downloading"); // Keep status as 'downloading'
          });
        },
      });

      // 3. If create() succeeds, the model is ready
      setModel(newModel);

      setStatus("available");
      setProgress(100); // Ensure progress is 100%
      setMessage(AiModelMessages.ready);
    } catch (e) {
      // 4. Handle any errors during creation/download
      console.error("Error initializing AI model:", e);
      setModelErrorMessage((e as Error).message);
      setStatus("error");
    } finally {
      isInitializing.current = false;
    }
  }, [model]); // Dependency on `model` to prevent re-init

  // Cleanup effect to destroy the session when the component unmounts
  useEffect(() => {
    // This function will run when the browser tab closes or refreshes
    const handleBrowserUnload = (_: BeforeUnloadEvent) => {
      console.log("beforeunload event triggered: Destroying model");
      if (model) {
        console.log("Model Destroyed-1");
        model.destroy();
        // Note: This is a "best effort" attempt.
        // The browser doesn't wait for async code here.
      }
    };

    // Add the browser-level listener
    window.addEventListener("beforeunload", handleBrowserUnload);

    // The return function is your original React-level cleanup
    return () => {
      console.log("React unmount triggered: Destroying model");
      // Clean up the browser-level listener to prevent memory leaks
      window.removeEventListener("beforeunload", handleBrowserUnload);

      if (model) {
        console.log("Model Destroyed-2");
        model.destroy();
      }
    };
  }, [model]);

  return { status, message, model, progress, modelErrorMessage, initialize };
}
