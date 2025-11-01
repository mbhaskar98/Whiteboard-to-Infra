// // src/chrome-ai.d.ts

// declare global {

//     /** The content for a multimodal prompt (text or a base64 image) */
//     type PromptContent = { text: string } | { image: string };

//     /** The interface for an active AI session */
//     interface LanguageModelSession {
//         /**
//          * Runs the prompt against the model.
//          * @param prompt A string or a multimodal prompt (array of text/image objects).
//          */
//         prompt(prompt: string | PromptContent[]): Promise<string>;

//         /**
//          * Cleans up the session and frees resources.
//          */
//         destroy(): void;
//     }

//     // --- NEW TYPES FOR THE 'create' MONITOR ---

//     /** The event dispatched for download progress */
//     interface DownloadProgressEvent extends Event {
//         type: 'downloadprogress';
//         /** A number from 0 to 1 indicating download progress */
//         loaded: number;
//     }

//     /** The monitor object that listens for events */
//     interface LanguageModelMonitor {
//         addEventListener(
//             type: 'downloadprogress',
//             listener: (e: DownloadProgressEvent) => void
//         ): void;
//     }

//     /** The options for creating a session */
//     interface LanguageModelCreateOptions {
//         /** A callback to monitor the model download */
//         monitor?: (monitor: LanguageModelMonitor) => void;
//         /** Optional parameters like temperature */
//         temperature?: number;
//     }

//     type AiStatus = 'loading' | 'available' | 'downloadable' | 'downloading' | 'unavailable';

//     // Define the interface for the main language model
//     const LanguageModel: {
//         /**
//          * Checks if the on-device model is available.
//          * "readily": The model is ready to use.
//          * "after-download": The model is not ready, but will be after download.
//          * "not-available": The model is not available.
//          */
//         availability(): Promise<AiStatus>;

//         /**
//             * Creates a new AI session.
//             * This will trigger a download if the model is not present.
//             * Must be called from a user-activated event (e.g., a click).
//             */
//         create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>;
//     }
// }

// // This empty export is still needed to treat this as a module
// // and have its 'declare global' block augment the global scope.
// export { };