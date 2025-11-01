// src/App.tsx

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import mermaid from "mermaid";
import { useAiModel } from "./hooks/useAiModel";
import "./App.css";

function App() {
  // --- Local Component State ---
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [mermaidInput, setMermaidInput] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false); // Local loading for prompt
  const [error, setError] = useState<string | null>(null);

  // --- AI State (from Hook) ---
  const { status, message, progress, model, modelErrorMessage, initialize } =
    useAiModel();

  // --- Refs ---
  const mermaidRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });
  }, []);

  useEffect(() => {
    setError(null);
    if (mermaidInput && mermaidRef.current) {
      try {
        mermaid
          .render("mermaid-diagram", mermaidInput)
          .then(({ svg }) => {
            if (mermaidRef.current) mermaidRef.current.innerHTML = svg;
          })
          .catch((err) => {
            setError(`Mermaid Syntax Error: ${err.message}`);
            if (mermaidRef.current) mermaidRef.current.innerHTML = "";
          });
      } catch (e) {
        setError(`Mermaid Syntax Error: ${(e as Error).message}`);
        if (mermaidRef.current) mermaidRef.current.innerHTML = "";
      }
    } else if (mermaidRef.current) {
      mermaidRef.current.innerHTML = ""; // Clear diagram
    }
  }, [mermaidInput]);

  /**
   * Wraps the AI's simple text output in valid Mermaid.js syntax
   */
  //   const parseConnectionsToMermaid = (rawOutput: string): string => {
  //     const lines = rawOutput.trim().split("\n");

  //     // Filter out any junk lines, leaving only valid connections
  //     const validLines = lines.filter(
  //       (line) => line.includes("-->") || line.includes("-.->")
  //     );
  //     if (validLines.length === 0) {
  //       throw new Error(
  //         "AI did not return any valid connections. The diagram may be unclear."
  //       );
  //     }
  //     // Indent each line and join them with newlines
  //     const indentedLines = validLines
  //       .map((line) => `    ${line.trim()}`)
  //       .join("\n");

  //     return `graph TD\n${indentedLines}`;
  //   };

  const parseConnectionsToMermaid = (rawOutput: string): string => {
    // Regex to find "Node A --> Node B" and capture the parts
    console.log("Raw AI Output:", rawOutput);
    const connectionRegex = /([\w\s-]+)\s*([<]*-[.-]*->)\s*([\w\s-]+)/g;

    // Function to remove spaces from a node name
    const formatNodeName = (name: string) => name.replace(/\s+/g, "");

    const lines = rawOutput.trim().split("\n");
    const validLines: string[] = [];

    for (const line of lines) {
      console.log("Processing line:", line);
      // Find all connections in the line (handles simple lines)
      const matches = [...line.matchAll(connectionRegex)];
      console.log("Matches found:", matches);

      if (matches.length > 0) {
        for (const match of matches) {
          const nodeA = formatNodeName(match[1]); // e.g., "Web Server" -> "WebServer"
          const arrow = match[2];
          const nodeB = formatNodeName(match[3]); // e.g., "Wi-Fi Access Point" -> "WiFiAccessPoint"

          validLines.push(`    ${nodeA} ${arrow} ${nodeB}`);
        }
      }
    }
    if (validLines.length === 0) {
      throw new Error(
        "AI did not return any valid connections. The diagram may be unclear."
      );
    }

    return `graph TD\n${validLines.join("\n")}`;
  };

  // --- Handlers ---
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(URL.createObjectURL(file));
      setMermaidInput("");
      setError(null);
    } else {
      setSelectedImage(null);
      setImagePreviewUrl(null);
    }
  };

  /**
   * The "smart" button handler that checks the AI status
   * and decides what action to take.
   */
  const handleMainButtonClick = async () => {
    if (status === "idle" || status === "error") {
      // 1. First click: Initialize the session
      setError(null);
      setMermaidInput("");
      await initialize();
    } else if (status === "available") {
      // 2. Second click (once ready): Run the analysis
      if (!selectedImage) {
        alert("Please upload an image first.");
        return;
      }
      if (!model) {
        setError("AI model is not available. Try re-initializing.");
        return;
      }

      setIsAnalyzing(true);
      setMermaidInput("");
      setError(null);

      try {
        const prompt: LanguageModelPrompt = [
          {
            role: "user",
            content: [
              {
                type: "text",
                value: "##Generate the Mermaid.js code for this diagram.",
              },
              {
                type: "image",
                value: selectedImage,
              },
            ],
          },
        ];

        const rawResult = await model.prompt(prompt); // Get the raw text
        if (!rawResult) throw new Error("AI returned an empty response.");

        // --- NEW STEP ---
        // Parse the raw text into valid Mermaid code
        console.log("Raw AI Output:", rawResult);
        const mermaidCode = parseConnectionsToMermaid(rawResult);
        console.log("Fixed Output:", mermaidCode);

        setMermaidInput(mermaidCode); // Set the final, correct code

        // const result = await model.prompt(prompt);
        // if (!result) throw new Error("AI returned an empty response.");

        // setMermaidInput(
        //   result
        //     .replace(/```mermaid/g, "")
        //     .replace(/```/g, "")
        //     .trim()
        // );
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsAnalyzing(false);
      }
    }
    // If status is 'initializing' or 'downloading', the button is disabled
  };

  /**
   * Helper function to determine the button's text and disabled state
   */
  const getButtonProps = () => {
    switch (status) {
      case "idle":
        return { text: "Initialize AI", disabled: false };
      case "downloading":
        return { text: `Downloading... ${progress}%`, disabled: true };
      case "available":
        return {
          text: isAnalyzing ? "Analyzing..." : "Analyze Diagram",
          disabled: isAnalyzing || !selectedImage,
        };
      case "error":
        return { text: "Retry Initialization", disabled: false };
      default:
        return { text: "Loading...", disabled: true };
    }
  };

  const { text: buttonText, disabled: isButtonDisabled } = getButtonProps();

  const isModelReady = status === "available";

  // --- Render ---
  return (
    <div className="App">
      <header>
        <h1>Whiteboard-to-Infra</h1>
        <p>Your AI assistant for converting diagrams into code.</p>
        <p className="status-message">
          <strong>AI Status:</strong> {message}
        </p>
        {modelErrorMessage && (
          <div className="error-box ai-model-error">
            <strong>AI Model Error:</strong> {modelErrorMessage}
          </div>
        )}
        {status === "downloading" && (
          <progress
            className="download-progress"
            value={progress}
            max="100"
          ></progress>
        )}
      </header>

      <main>
        <div className="upload-section card">
          <h2>1. Upload Your Diagram</h2>
          <p>
            {isModelReady
              ? "Upload a clear photo of your diagram."
              : "You must initialize the AI before analyzing."}
          </p>
          {isModelReady && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              aria-label="Upload diagram image"
            />
          )}
          <button onClick={handleMainButtonClick} disabled={isButtonDisabled}>
            {buttonText}
          </button>
        </div>

        {(imagePreviewUrl || error || mermaidInput) && (
          <div className="results-container">
            {imagePreviewUrl && (
              <div className="image-preview card">
                <h2>Uploaded Image:</h2>
                <img src={imagePreviewUrl} alt="Uploaded network diagram" />
              </div>
            )}

            {(isAnalyzing || error || mermaidInput) && (
              <div className="output-section card">
                <h2>2. AI Analysis Results</h2>
                {isAnalyzing && <div className="loader">Analyzing...</div>}

                {error && (
                  <div className="error-box">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {mermaidInput && (
                  <>
                    <h3>Rendered Diagram:</h3>
                    <div ref={mermaidRef} className="mermaid-diagram"></div>
                    <h3>Generated Mermaid Code:</h3>
                    <pre className="code-output">
                      <code>{mermaidInput}</code>
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
