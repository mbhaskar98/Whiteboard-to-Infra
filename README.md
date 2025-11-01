# Whiteboard-to-Infra

A local-first, privacy-preserving web app that converts your hand-drawn diagrams into production-ready Mermaid.js code.

Submission for the [Google Chrome Built-in AI Challenge 2025
](http://goo.gle/ChromeAIChallenge2025)
Target Categories: Best Multimodal AI Application, Most Helpful Web Application, Best Hybrid AI Application

[ ➡️ LIVE DEMO ](https://github.com/mbhaskar98/Whiteboard-to-Infra/blob/main/recordings/demo.gif)

📸 The Pitch

The Problem: A Critical Security Gap

For professionals in networking, security, and cloud infrastructure (like me!), the best ideas start on a whiteboard. We sketch out secure network architectures, data flows, and firewall rules.

These critical diagrams are "air-gapped" from our documentation pipeline. We can't simply upload a photo of our company's internal network to a public cloud AI for conversion—it's a massive privacy and security violation. We are forced to redraw them manually, wasting hours and inviting human error.

The Solution: Privacy-First AI

Whiteboard-to-Infra solves this by leveraging the new Chrome Built-in LanguageModel API. It's an "offline-only" tool that analyzes your diagrams entirely on your device.

Your sensitive infrastructure diagrams never leave your browser.

How It Works

Initialize AI: A single click initializes the on-device AI model, downloading it if needed.

Upload Diagram: Upload a photo of your whiteboard or notebook sketch.

Analyze On-Device: The LanguageModel's multimodal capabilities (image + text) analyze the diagram's nodes and connections locally.

Get Code: The app instantly generates a clean, interactive Mermaid.js diagram and the code to go with it.

✨ Key Features

100% On-Device Analysis: The core feature. Your images are processed by the local LanguageModel API (Gemini Nano).

Offline-First & Private: The entire analysis works without an internet connection. This is a secure tool designed for professionals.

Multimodal Input: Uses a sophisticated multimodal prompt, sending both the image (File object) and text instructions to the model in a single call.

Advanced Prompt Engineering: The LanguageModel is initialized with a powerful system prompt that uses Chain of Thought (CoT) and One-Shot Examples. This forces the model to "think" in steps and follow strict formatting rules (like PascalCase and -.-> for dashed lines), dramatically increasing accuracy.

Deterministic Output: The temperature is set to 0 and topK to 1 to ensure the model is as factual and non-creative as possible, sticking to the facts in the diagram.

Resilient Client-Side Parsing: We discovered the on-device model can still make formatting mistakes (like adding spaces). Our React app includes a robust parseConnectionsToMermaid function that cleans the AI's output before it's rendered, ensuring a valid diagram every time.

🧠 Our Hybrid AI Strategy

This project perfectly demonstrates the "offline-first for generation, hybrid for analysis" model.

Part 1: On-Device (Generation)

Task: Convert an image to a diagram draft.

Benefit: Fast, free, and completely private. It respects the user's data security.

Limitation: As we proved, the on-device model struggles with 100% visual accuracy on complex diagrams.

Part 2: Cloud-Enabled (Analysis) - The Hybrid Vision

Task: "Audit this diagram for security flaws."

Benefit: A future "Audit" button would send the non-sensitive, generated Mermaid code to a secure Firebase Function. The full-power Gemini Cloud API can then perform a deep security analysis (e.g., "Find nodes with public internet access that connect directly to a database"), a complex reasoning task the on-device model can't handle.

🛠️ Tech Stack

Frontend: React, TypeScript, Vite

On-Device AI: Chrome Built-in AI API (LanguageModel)

Diagrams: Mermaid.js

Hosting: Firebase Hosting

🚀 How to Run (For Judges)

This project requires an experimental browser and setup to function.

Get the Right Browser:

You must use Google Chrome Canary or Chrome Dev.

This will not work in standard Google Chrome.

Enable the AI Flags:

Go to chrome://flags in your address bar.

Find and Enable the flag: chrome://flags/#prompt-api-for-gemini-nano-multimodal-input.

Relaunch the browser completely.

Run the App:

# 1. Clone the repository
git clone [Whiteboard-to-Infra](https://github.com/mbhaskar98/Whiteboard-to-Infra)

cd Whiteboard-to-Infra

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev


Test the App:

Open the http://localhost:5173 (or the port shown in your terminal).

CRITICAL: Click "Initialize AI" first. This is the required user interaction to trigger the model download. You will see its progress in the UI.

Once the model is "ready," upload a diagram to analyze.