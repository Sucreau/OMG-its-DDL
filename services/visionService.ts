import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let faceLandmarker: FaceLandmarker | null = null;
let lastVideoTime = -1;
let isInitializing = false;

export async function initializeFaceLandmarker() {
  // Prevent multiple initialization calls
  if (faceLandmarker || isInitializing) return;
  
  isInitializing = true;

  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
    );
    
    // We use default options to allow the library to automatically select the best delegate.
    // This avoids forcing GPU on incompatible devices or forcing CPU when GPU is available.
    // Note: "INFO: Created TensorFlow Lite XNNPACK delegate for CPU" is a standard status log, not an error.
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      },
      outputFaceBlendshapes: false,
      runningMode: "VIDEO",
      numFaces: 1
    });
    console.log("FaceLandmarker initialized successfully");

  } catch (error) {
    console.error("Failed to initialize FaceLandmarker:", error);
  } finally {
    isInitializing = false;
  }
}

export function isFaceLandmarkerLoaded() {
  return !!faceLandmarker;
}

// Returns normalized x,y (0-1) of the nose tip
export function detectNose(video: HTMLVideoElement): { x: number; y: number } | null {
  if (!faceLandmarker || !video.videoWidth || video.readyState < 2) return null;

  const nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    try {
      const results = faceLandmarker.detectForVideo(video, nowInMs);
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        // Landmark 1 is the nose tip
        const nose = results.faceLandmarks[0][1];
        // Mirror X because it's a webcam
        return { x: 1 - nose.x, y: nose.y };
      }
    } catch (e) {
      // Benign detection error during stream startup
    }
  }
  return null;
}