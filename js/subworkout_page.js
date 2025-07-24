let detector;
let videoElement;
let canvasElement;
let canvasContext;
let isRunning = false;
let cameras = [];
let animationFrameId;
let isInitialized = false;
const DEFAULT_SETTINGS = {
  mewtrackEnabled: true,
  notificationsEnabled: true,
  skeletonStyle: "both",
  cameraEnabled: true,
};

document
  .getElementById("popup-container")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      this.style.display = "none";
    }
  });

// Load settings from local storage
let isMewTrackEnabled =
  localStorage.getItem("mewtrackEnabled") !== null
    ? localStorage.getItem("mewtrackEnabled") === "true"
    : DEFAULT_SETTINGS.mewtrackEnabled;
let notificationsEnabled =
  localStorage.getItem("notificationsEnabled") !== null
    ? localStorage.getItem("notificationsEnabled") === "true"
    : DEFAULT_SETTINGS.notificationsEnabled;
let skeletonStyle =
  localStorage.getItem("skeletonStyle") || DEFAULT_SETTINGS.skeletonStyle;
let isCameraEnabled =
  localStorage.getItem("cameraEnabled") !== null
    ? localStorage.getItem("cameraEnabled") === "true"
    : DEFAULT_SETTINGS.cameraEnabled;

const pauseBtn = document.querySelector(".pause");
const closeBtn = document.getElementById("close-btn");
const skipBtn = document.querySelector(".skip");
const popupContainer = document.getElementById("popup-container");
const popupTitle = document.getElementById("popup-title");
const popupBody = document.getElementById("popup-body");

// Initialize TensorFlow backend
async function initializeTF() {
  if (isInitialized) return true;

  try {
    await tf.ready();
    await tf.setBackend("webgl");
    console.log("TensorFlow.js initialized successfully");
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("Error initializing TensorFlow:", error);
    return false;
  }
}

// Modified init function
async function init() {
  console.log("Initializing pose detection...");
  const workoutUser = document.querySelector(".workout-user");

  try {
    const tfInitialized = await initializeTF();
    console.log("TensorFlow initialized:", tfInitialized);

    if (!tfInitialized) {
      throw new Error(
        "Could not initialize TensorFlow. Please check if your browser supports WebGL."
      );
    }

    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      }
    );
    console.log("Detector created:", !!detector);

    await requestCameraPermission();
    console.log(
      "Camera permission granted, MewTrack enabled:",
      isMewTrackEnabled
    );
  } catch (error) {
    console.error("Initialization error:", error);
    showErrorModal(error.message);
  }
}

window.addEventListener("load", async () => {
  setTimeout(async () => {
    await init();
  }, 1000);
});

// Add function to handle device enumeration and selection
async function getAvailableCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras = devices.filter((device) => device.kind === "videoinput");
    return cameras;
  } catch (error) {
    console.error("Error getting camera devices:", error);
    return [];
  }
}

// Modified camera permission request with device selection
async function requestCameraPermission() {
  const workoutUser = document.querySelector(".workout-user");

  try {
    const cameras = await getAvailableCameras();

    if (cameras.length === 0) {
      workoutUser.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
                    <i class="fa-solid fa-video-slash" style="font-size: 48px; margin-bottom: 20px; color: #ff6060;"></i>
                    <h3 style="margin-bottom: 15px;">No Camera Detected</h3>
                    <p style="margin-bottom: 20px;">Please ensure your camera is properly connected and not in use by another application.</p>
                    <button onclick="location.reload()" style="
                        background-color: #ff6060;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 12px 24px;
                        cursor: pointer;
                        font-size: 16px;
                    ">Try Again</button>
                </div>
            `;
      return;
    }

    // Attempt to start the camera with more specific constraints
    let stream;
    for (const camera of cameras) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: camera.deviceId,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 60 },
          },
          audio: false,
        });

        if (stream) break; // Successfully got a stream
      } catch (err) {
        console.log(
          `Failed to get stream from camera ${camera.deviceId}:`,
          err
        );
        continue;
      }
    }

    if (!stream) {
      throw new Error("Could not access any camera");
    }

    // If we got a stream, proceed with initialization
    await initializeVideoElements(stream);
  } catch (error) {
    console.error("Camera access error:", error);

    let errorMessage;
    let errorTitle;
    let errorIcon = "fa-circle-exclamation";

    switch (error.name) {
      case "NotReadableError":
        errorTitle = "Camera Not Available";
        errorMessage = `
                    <p>The camera is currently in use by another application or encountered a hardware error.</p>
                    <br>
                    <p>Please try:</p>
                    <ol style="text-align: left; margin-top: 10px;">
                        <li>Closing other applications that might be using the camera</li>
                        <li>Disconnecting and reconnecting your camera</li>
                        <li>Restarting your browser</li>
                        <li>Checking your computer's privacy settings</li>
                    </ol>
                `;
        break;
      case "NotAllowedError":
        errorTitle = "Camera Access Denied";
        errorMessage = "Please enable camera access in your browser settings.";
        break;
      case "NotFoundError":
        errorTitle = "No Camera Found";
        errorIcon = "fa-video-slash";
        errorMessage = "Please connect a camera and refresh the page.";
        break;
      default:
        errorTitle = "Camera Error";
        errorMessage = `An error occurred: ${error.message}`;
    }

    workoutUser.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
                <i class="fa-solid ${errorIcon}" style="font-size: 48px; margin-bottom: 20px; color: #ff6060;"></i>
                <h3 style="margin-bottom: 15px;">${errorTitle}</h3>
                <div style="margin-bottom: 20px;">${errorMessage}</div>
                <button onclick="retryInitialization()" style="
                    background-color: #ff6060;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    cursor: pointer;
                    font-size: 16px;
                ">Try Again</button>
            </div>
        `;
  }
}

// Add retry function
async function retryInitialization() {
  const workoutUser = document.querySelector(".workout-user");
  workoutUser.innerHTML =
    '<div style="text-align: center; padding: 20px;">Retrying camera initialization...</div>';

  // Small delay before retrying
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await initPoseDetection();
}

// Modified initializeVideoElements to handle potential errors
async function initializeVideoElements(stream) {
  const workoutUser = document.querySelector(".workout-user");
  workoutUser.innerHTML = "";

  try {
    // Create container for video and canvas
    const videoContainer = document.createElement("div");
    videoContainer.style.position = "relative";
    videoContainer.style.width = "100%";
    videoContainer.style.height = "100%";
    videoContainer.style.overflow = "hidden";
    videoContainer.style.borderRadius = "16px";

    // Create video element
    videoElement = document.createElement("video");
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    videoElement.style.objectFit = "cover";
    videoElement.autoplay = true;
    videoElement.playsinline = true;

    // Create canvas element
    canvasElement = document.createElement("canvas");
    canvasElement.style.position = "absolute";
    canvasElement.style.top = "0";
    canvasElement.style.left = "0";
    canvasElement.style.width = "100%";
    canvasElement.style.height = "100%";

    // Add elements to container
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(canvasElement);
    workoutUser.appendChild(videoContainer);

    // Set up video stream
    videoElement.srcObject = stream;
    canvasContext = canvasElement.getContext("2d");

    // Update canvas size on video load
    videoElement.onloadedmetadata = () => {
      const updateCanvasSize = () => {
        const rect = videoContainer.getBoundingClientRect();
        canvasElement.width = rect.width;
        canvasElement.height = rect.height;

        canvasElement.scaleX = canvasElement.width / videoElement.videoWidth;
        canvasElement.scaleY = canvasElement.height / videoElement.videoHeight;
        canvasElement.offsetX = 0;
        canvasElement.offsetY = 0;
      };

      updateCanvasSize();
      window.addEventListener("resize", updateCanvasSize);

      isRunning = true;
      startDetection();
    };
  } catch (error) {
    console.error("Error in video initialization:", error);
    showErrorModal(error.message);
  }
}

// Initialize the pose detection system
async function initPoseDetection() {
  console.log("Starting pose detection initialization...", { isCameraEnabled });

  if (!isCameraEnabled) {
    showCameraOffMessage("Camera is currently turned off");
    return;
  }

  await requestCameraPermission();

  try {
    // Access webcam
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    // Load pose detection model
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      }
    );

    await initializeVideoElements(stream);
  } catch (error) {
    console.error("Error initializing pose detection:", error);
    const workoutUser = document.querySelector(".workout-user");
    workoutUser.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p>Error: Could not access camera or initialize pose detection. Please check your camera permissions and refresh the page.</p>
                <p>Error details: ${error.message}</p>
                <button onclick="retryInitialization()" style="
                    background-color: #ff6060;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    margin-top: 15px;
                    cursor: pointer;
                ">Try Again</button>
            </div>
        `;
  }
}

// Modify the camera settings handler
async function handleCameraSettings() {
  const popupContainer = document.getElementById("popup-container");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");

  popupTitle.innerHTML = `
        Camera Settings
        <button id="close-settings" style="
            position: absolute;
            right: 15px;
            top: 15px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            font-size: 16px;
        ">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

  // Show loading state
  popupBody.innerHTML = `
        <div style="padding: 20px;">
            <div style="text-align: center;">Loading camera settings...</div>
        </div>
    `;

  popupContainer.style.display = "flex";

  // Wait for cameras to be loaded
  const availableCameras = await getAvailableCameras();

  // Create settings UI
  const settingsHTML = `
        <div style="padding: 20px;">
            <div class="setting-option" style="margin-bottom: 20px; display:none;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500;">Enable Camera</span>
                    <label class="switch">
                        <input type="checkbox" id="camera-toggle" ${isCameraEnabled ? "checked" : ""
    }>
                        <span class="slider round"></span>
                    </label>
                </div>
                <p style="color: #666; margin: 20px 0 0 0; font-size: 14px;">
                    Toggle camera on/off. When disabled, the camera will be completely turned off.
                </p>
            </div>

            <div class="setting-option" style="margin-bottom: 20px;">
                <label for="cameraSelect" style="display: block; margin-bottom: 8px; font-weight: 500;">Select Camera</label>
                <select id="cameraSelect" style="
                    width: 100%;
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    background-color: white;
                    font-size: 14px;
                " ${!isCameraEnabled ? "disabled" : ""}>
                    ${availableCameras
      .map(
        (device, index) => `
                        <option value="${device.deviceId}">
                            ${device.label || `Camera ${index + 1}`}
                        </option>
                    `
      )
      .join("")}
                </select>
            </div>

            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 15px;
                background: white;
                border-top: 1px solid #eee;
                text-align: right;
            ">
                <button id="apply-camera-settings" style="
                    padding: 8px 24px;
                    background: #ffb089;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                ">Apply</button>
            </div>
        </div>
    `;

  popupBody.innerHTML = settingsHTML;

  // Add event listeners
  document.getElementById("camera-toggle").addEventListener("change", (e) => {
    document.getElementById("cameraSelect").disabled = !e.target.checked;
  });

  document
    .getElementById("apply-camera-settings")
    .addEventListener("click", async () => {
      const newCameraEnabled = document.getElementById("camera-toggle").checked;
      const selectedDeviceId = document.getElementById("cameraSelect").value;

      // First stop any existing camera
      stopCamera();

      if (newCameraEnabled) {
        try {
          await initializeCamera(selectedDeviceId);
          // Add a small delay before starting detection
          setTimeout(() => {
            startDetection();
          }, 1000);
        } catch (error) {
          console.error("Failed to start camera:", error);
          showCameraOffMessage(
            "Failed to start camera. Please check permissions and try again."
          );
        }
      } else {
        showCameraOffMessage("Camera is currently turned off");
      }

      popupContainer.style.display = "none";
    });

  document.getElementById("close-settings").addEventListener("click", () => {
    popupContainer.style.display = "none";
  });
}

// Helper function to get current camera ID
function getCurrentCameraId() {
  if (videoElement && videoElement.srcObject) {
    const track = videoElement.srcObject.getVideoTracks()[0];
    if (track) {
      return track.getSettings().deviceId;
    }
  }
  return null;
}

// Function to stop camera
function stopCamera() {
  // Stop detection if running
  if (isRunning) {
    stopDetection();
    isRunning = false;
  }

  // Stop all video tracks
  if (videoElement && videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    videoElement.srcObject = null;
  }

  // Clear canvas
  if (canvasElement && canvasContext) {
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }

  // Reset detector
  detector = null;
}

// Function to show camera off message
function showCameraOffMessage(message) {
  const workoutUser = document.querySelector(".workout-user");
  workoutUser.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            background: #f8f8f8;
            border-radius: 16px;
        ">
            <i class="fa-solid fa-video-slash" style="
                font-size: 48px;
                color: #ffb089;
                margin-bottom: 20px;
            "></i>
            <h3 style="margin-bottom: 10px; color: #333;">Camera Off</h3>
            <p style="color: #666;">${message}</p>
            ${!isCameraEnabled
      ? `
                <button onclick="handleCameraSettings()" style="
                    margin-top: 20px;
                    padding: 8px 16px;
                    background: #ffb089;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Enable Camera</button>
            `
      : ""
    }
        </div>
    `;
}

// Modify initPoseDetection to check camera state
// async function initPoseDetection() {
//     if (!isCameraEnabled) {
//         showCameraOffMessage('Camera is currently turned off');
//         return;
//     }

//     await requestCameraPermission();
// }

// Update window load event to respect camera state
window.addEventListener("load", async () => {
  // Wait a moment to ensure all scripts are loaded
  setTimeout(async () => {
    if (typeof tf !== "undefined" && typeof poseDetection !== "undefined") {
      console.log("Libraries loaded, initializing with settings:", {
        isCameraEnabled,
        isMewTrackEnabled,
        skeletonStyle,
      });

      if (isCameraEnabled) {
        await init();
      } else {
        showCameraOffMessage("Camera is currently turned off");
      }
    } else {
      showErrorModal("Required libraries not loaded. Please refresh the page.");
    }
  }, 1000);
});

function showErrorModal(errorMessage) {
  const workoutUser = document.querySelector(".workout-user");
  const modalContainer = document.createElement("div");
  modalContainer.style.position = "absolute";
  modalContainer.style.top = "0";
  modalContainer.style.left = "0";
  modalContainer.style.width = "100%";
  modalContainer.style.height = "100%";
  modalContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  modalContainer.style.display = "flex";
  modalContainer.style.justifyContent = "center";
  modalContainer.style.alignItems = "center";

  modalContainer.innerHTML = `
        <div style="
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            max-width: 80%;
        ">
            <i class="fa-solid fa-circle-exclamation" style="font-size: 48px; color: #ffb089; margin-bottom: 15px;"></i>
            <h3 style="margin-bottom: 15px;">Camera Error</h3>
            <p style="margin-bottom: 20px;">${errorMessage}</p>
            <button onclick="retryInitialization()" style="
                background-color: #ffb089;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                cursor: pointer;
                font-size: 16px;
            ">Try Again</button>
        </div>
    `;

  workoutUser.appendChild(modalContainer);
}

// Global variable to track visibility state
let isVisibilityFeedbackShown = false;
let lastFeedbackTime = 0;
let feedbackClearTimerId = null;
const FEEDBACK_DURATION = 3000; // Show feedback for 5 seconds
const FEEDBACK_INTERVAL = 10000; // Check every 10 seconds
let lastVisibilityState = true;

function handleVisibilityFeedback(poses) {
  const currentTime = Date.now();
  const minimalVisibility = checkMinimalVisibility(poses);
  const isResting = window.workoutManager
    ? window.workoutManager.isResting
    : false;

  const visibilityChanged = minimalVisibility !== lastVisibilityState;
  lastVisibilityState = minimalVisibility;

  if ((minimalVisibility || isResting) && isVisibilityFeedbackShown) {
  } else if (
    !minimalVisibility &&
    !isResting &&
    (visibilityChanged || currentTime - lastFeedbackTime >= FEEDBACK_INTERVAL)
  ) {
    if (feedbackClearTimerId) {
      clearTimeout(feedbackClearTimerId);
    }

    const partialVisibility = checkPartialVisibility(poses);

    if (partialVisibility) {
      showFormFeedback(
        ["Please position your full body within the camera view"],
        "warning"
      );
    } else {
      showFormFeedback(
        ["Please position yourself within the camera view"],
        "error"
      );
    }

    isVisibilityFeedbackShown = true;
    lastFeedbackTime = currentTime;

    feedbackClearTimerId = setTimeout(() => {
      showFormFeedback([]);
      isVisibilityFeedbackShown = false;
      feedbackClearTimerId = null;
    }, FEEDBACK_DURATION);
  }
}

// Check if at least some upper body parts are visible
function checkPartialVisibility(poses) {
  if (!poses || poses.length === 0) return false;

  const pose = poses[0];
  const keypoints = pose.keypoints;

  const upperBodyKeypoints = [
    "nose",
    "left_eye",
    "right_eye",
    "left_ear",
    "right_ear",
    "left_shoulder",
    "right_shoulder",
  ];

  const visibleUpperBodyKeypoints = upperBodyKeypoints.filter((name) => {
    const keypoint = getKeypointByName(keypoints, name);
    return (
      keypoint &&
      keypoint.score > 0.2 &&
      keypoint.x > 0 &&
      keypoint.x < videoElement.videoWidth &&
      keypoint.y > 0 &&
      keypoint.y < videoElement.videoHeight
    );
  });

  return visibleUpperBodyKeypoints.length >= 3;
}

// Modified minimal visibility check to be more specific about required keypoints
function checkMinimalVisibility(poses) {
  if (!poses || poses.length === 0) return false;

  const pose = poses[0];
  const keypoints = pose.keypoints;

  const criticalKeypoints = [
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
  ];

  const visibleKeypoints = criticalKeypoints.filter((name) => {
    const keypoint = getKeypointByName(keypoints, name);
    return (
      keypoint &&
      keypoint.score > 0.2 &&
      keypoint.x > 0 &&
      keypoint.x < videoElement.videoWidth &&
      keypoint.y > 0 &&
      keypoint.y < videoElement.videoHeight
    );
  });

  return visibleKeypoints.length >= 4;
}

// Modified detectPose function remains the same as previous solution
async function detectPose() {
  if (!isRunning || !detector || !isMewTrackEnabled) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    return;
  }

  if (!videoElement || !videoElement.videoWidth || !videoElement.videoHeight) {
    animationFrameId = requestAnimationFrame(() => detectPose());
    return;
  }

  try {
    const poses = await detector.estimatePoses(videoElement);

    handleVisibilityFeedback(poses);

    const minimalVisibility = checkMinimalVisibility(poses);

    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (poses.length > 0) {
      const keypoints = poses[0].keypoints;
      const scale = Math.min(canvasElement.scaleX, canvasElement.scaleY);
      const offsetX =
        (canvasElement.width - videoElement.videoWidth * scale) / 2;
      const offsetY =
        (canvasElement.height - videoElement.videoHeight * scale) / 2;

      drawSkeleton(keypoints, scale, offsetX, offsetY);
      drawKeypoints(keypoints, scale, offsetX, offsetY);
    }

    if (minimalVisibility && window.workoutManager) {
      window.workoutManager.handlePoseDetection(poses);
    }

    animationFrameId = requestAnimationFrame(() => detectPose());
  } catch (error) {
    console.error("Detection error:", error);
    animationFrameId = requestAnimationFrame(() => detectPose());
  }
}

function validateForm(keypoints, exerciseType) {
  const feedback = [];

  switch (exerciseType) {
    case "Squats":
      const kneeAngle = calculateAngle(
        getKeypointByName(keypoints, "left_hip"),
        getKeypointByName(keypoints, "left_knee"),
        getKeypointByName(keypoints, "left_ankle")
      );
      if (kneeAngle < 80) feedback.push("Keep knees behind toes!");
      break;

    case "Push Ups":
      const bodyAngle = calculateAngle(
        getKeypointByName(keypoints, "left_shoulder"),
        getKeypointByName(keypoints, "left_hip"),
        getKeypointByName(keypoints, "left_ankle")
      );
      if (bodyAngle > 170) feedback.push("Keep your body straight!");
      break;
  }

  return feedback;
}

function showFormFeedback(messages, type = "info") {
  const feedbackElement =
    document.getElementById("form-feedback") || document.createElement("div");

  feedbackElement.id = "form-feedback";

  // Clear feedback if empty messages array is passed
  if (!messages || messages.length === 0) {
    feedbackElement.innerHTML = "";
    if (!document.getElementById("form-feedback")) {
      document.body.appendChild(feedbackElement);
    }
    return;
  }

  // Only update if there are new messages
  const lastUpdateTime = feedbackElement.dataset.lastUpdate || 0;
  const currentTime = Date.now();

  // Only update UI every 2 seconds to prevent flashing
  if (currentTime - lastUpdateTime > 2000) {
    feedbackElement.innerHTML = messages
      .map((msg) => {
        if (!msg) return "";
        return `
                <div class="feedback-message ${type}">
                    <span class="feedback-icon">${getFeedbackIcon(type)}</span>
                    <span class="feedback-text">${msg}</span>
                </div>
            `;
      })
      .join("");

    feedbackElement.dataset.lastUpdate = currentTime;
  }

  if (!document.getElementById("form-feedback")) {
    document.body.appendChild(feedbackElement);
  }
}

// Helper function to get appropriate icon for each feedback type
function getFeedbackIcon(type) {
  switch (type) {
    case "success":
      return "🎉";
    case "warning":
      return "⚠️";
    case "error":
      return "❌";
    case "info":
    default:
      return "💡";
  }
}

// Modified window load event handler
window.addEventListener("load", async () => {
  // Wait for DOM to be fully loaded
  setTimeout(async () => {
    if (typeof tf !== "undefined" && typeof poseDetection !== "undefined") {
      await init();
    } else {
      const workoutUser = document.querySelector(".workout-user");
      showErrorModal("Required libraries not loaded. Please refresh the page.");
    }
  }, 1000);
});

function drawKeypoints(keypoints, scale, offsetX, offsetY) {
  for (const keypoint of keypoints) {
    if (keypoint.score > 0.3) {
      const x = keypoint.x * scale + offsetX;
      const y = keypoint.y * scale + offsetY;

      canvasContext.beginPath();
      canvasContext.arc(x, y, 4, 0, 2 * Math.PI);
      canvasContext.fillStyle = "#FF6060";
      canvasContext.fill();
    }
  }
}

function drawSkeleton(keypoints, scale, offsetX, offsetY) {
  const connections = [
    ["nose", "left_eye"],
    ["nose", "right_eye"],
    ["left_eye", "left_ear"],
    ["right_eye", "right_ear"],
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["right_shoulder", "right_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"],
    ["right_hip", "right_knee"],
    ["left_knee", "left_ankle"],
    ["right_knee", "right_ankle"],
  ];

  canvasContext.strokeStyle = "#FFA476";
  canvasContext.lineWidth = 2;

  for (const [p1Name, p2Name] of connections) {
    const p1 = keypoints.find((kp) => kp.name === p1Name);
    const p2 = keypoints.find((kp) => kp.name === p2Name);

    if (p1 && p2 && p1.score > 0.3 && p2.score > 0.3) {
      const x1 = p1.x * scale + offsetX;
      const y1 = p1.y * scale + offsetY;
      const x2 = p2.x * scale + offsetX;
      const y2 = p2.y * scale + offsetY;

      canvasContext.beginPath();
      canvasContext.moveTo(x1, y1);
      canvasContext.lineTo(x2, y2);
      canvasContext.stroke();
    }
  }
}

// Start detection
async function startDetection() {
  if (!videoElement || !videoElement.srcObject || videoElement.readyState < 2) {
    console.warn("Video not ready, delaying pose detection start");
    setTimeout(startDetection, 500);
    return;
  }

  isRunning = true;
  detectPose();
}

// Stop detection
function stopDetection() {
  isRunning = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
}

// Initialize when page loads
window.addEventListener("load", () => {
  if (typeof tf !== "undefined" && typeof poseDetection !== "undefined") {
    initPoseDetection();
  } else {
    const workoutUser = document.querySelector(".workout-user");
    workoutUser.innerHTML = "Error: Required libraries not loaded";
  }
});

// Add a function to check if libraries are loaded
function areLibrariesLoaded() {
  return (
    typeof tf !== "undefined" &&
    typeof poseDetection !== "undefined" &&
    tf.backend() !== undefined
  );
}

//.........................................................................................//
// Music Function (pop up window)
// Initialize required elements
// const popupContainer = document.getElementById('popup-container');
// const popupTitle = document.getElementById('popup-title');
// const popupBody = document.getElementById('popup-body');
// const closeBtn = document.getElementById('close-btn');
const musicBtn = document.querySelector(".music-btn");
const musicLibrary = document.querySelector(".music-library");

const musicTracks = [
  {
    title: "Nu Love",
    artist: "Momot Music",
    duration: "4:45",
    url: "./assets/workout_music/Nu Love.mp3",
    cover: "https://images.unsplash.com/photo-1519501025264-65ba15a82390",
  },
  {
    title: "Pump It Up",
    artist: "Momot Music",
    duration: "1:49",
    url: "./assets/workout_music/workout-by-MomotMusic.mp3",
    cover: "https://images.unsplash.com/photo-1519501025264-65ba15a82390",
  },
  {
    title: "Energy Boost",
    artist: "HitsLab",
    duration: "2:31",
    url: "./assets/workout_music/workout-motivation.mp3",
    cover: "https://images.unsplash.com/photo-1574680096145-d05b474e2155",
  },
];
class WorkoutMusicPlayer {
  constructor() {
    this.audio = new Audio();
    this.playlist = musicTracks;
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.volume = 0.4;
    this.progressUpdateInterval = null;
    this.isLoading = false;
    this.playAttempts = 0;
    this.isFirstPlay = true;

    // Initialize audio properties
    this.audio.volume = this.volume;
    this.audio.addEventListener("timeupdate", () => this.updateProgress());
    this.audio.addEventListener("ended", () => this.nextTrack());
    this.audio.addEventListener("loadedmetadata", () => {
      this.updateDuration();
      this.isLoading = false;

      // Auto-play when loaded if we were supposed to be playing
      if (this.shouldBePlayingAfterLoad) {
        this.audio
          .play()
          .catch((err) => console.warn("Auto-play after load failed:", err));
        this.shouldBePlayingAfterLoad = false;
      }
    });

    // Add error handling
    this.audio.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      this.isLoading = false;

      // Try next track on error
      if (this.isPlaying) {
        this.nextTrack();
      }
    });
  }

  createMusicInterface() {
    const container = document.createElement("div");
    container.className = "music-player-container";
    container.innerHTML = `
            <div class="player-card">
                <div class="player-header">
                    <div class="track-info">
                        <div class="title">${this.playlist[this.currentTrackIndex].title
      }</div>
                        <div class="artist">${this.playlist[this.currentTrackIndex].artist
      }</div>
                    </div>
                    <div class="duration" id="time-display">0:00 / ${this.playlist[this.currentTrackIndex].duration
      }</div>
                </div>
                <div class="player-controls">
                    <button class="control-btn prev">
                        <i class="fas fa-backward"></i>
                    </button>
                    <button class="control-btn play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="control-btn next">
                        <i class="fas fa-forward"></i>
                    </button>
                    <div class="volume-control">
                        <i class="fas fa-volume-up"></i>
                        <input type="range" class="volume-slider" min="0" max="100" value="${this.volume * 100
      }">
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress"></div>
                </div>
            </div>
        `;
    return container;
  }

  initializeControls() {
    const playerCard = document.querySelector(".player-card");
    const playBtn = playerCard.querySelector(".play");
    const prevBtn = playerCard.querySelector(".prev");
    const nextBtn = playerCard.querySelector(".next");
    const volumeSlider = playerCard.querySelector(".volume-slider");
    const progressBar = playerCard.querySelector(".progress-bar");

    playBtn.addEventListener("click", () => this.togglePlay());
    prevBtn.addEventListener("click", () => this.previousTrack());
    nextBtn.addEventListener("click", () => this.nextTrack());
    volumeSlider.addEventListener("input", (e) =>
      this.setVolume(e.target.value / 100)
    );
    progressBar.addEventListener("click", (e) => this.seekTo(e));
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  updatePlayButton() {
    const playIcon = document.querySelector(".play i");
    playIcon.className = this.isPlaying ? "fas fa-pause" : "fas fa-play";
  }

  play() {
    if (this.isPlaying) return Promise.resolve(); // Already playing

    // Reset loading attempts if playback is successful
    this.playAttempts = 0;

    this.isPlaying = true;
    this.updatePlayButton(); // Sync play button state

    // Attempt to play audio
    return this.audio
      .play()
      .then(() => {
        console.log("Playback started");
        this.isPlaying = true;
      })
      .catch((error) => {
        console.warn("Playback failed:", error);

        // Retry logic: Load the track if not already loaded
        if (!this.audio.duration && !this.isLoading) {
          this.isLoading = true;
          this.loadTrack(true); // Load track and auto-play
        }

        // Skip to next track if the current one is problematic
        if (error.name === "NotSupportedError" || error.name === "AbortError") {
          this.nextTrack();
          return this.play();
        }

        return Promise.reject(error);
      });
  }

  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.shouldBePlayingAfterLoad = false;
    this.audio.pause();
    this.updatePlayButton();
  }

  updateProgress() {
    const progress = (this.audio.currentTime / this.audio.duration) * 100 || 0;
    document.querySelector(".progress").style.width = `${progress}%`;
    this.updateTimeDisplay();
  }

  updateTimeDisplay() {
    const timeDisplay = document.getElementById("time-display");
    const currentTime = this.formatTime(this.audio.currentTime);
    const duration = this.formatTime(this.audio.duration);
    timeDisplay.textContent = `${currentTime} / ${duration}`;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  seekTo(e) {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    this.audio.currentTime = pos * this.audio.duration;
  }

  loadTrack(autoPlay = true, countdownSeconds = 2) {
    const track = this.playlist[this.currentTrackIndex];
    this.isLoading = true;

    // Update UI elements for track info
    document.querySelector(".title").textContent = track.title;
    document.querySelector(".artist").textContent = track.artist;

    // Set audio source and load the track
    this.audio.src = track.url;
    this.audio.load();

    // Add countdown before playing
    if (autoPlay) {
      // Create countdown UI if it doesn't exist
      let countdownEl = document.querySelector(".music-countdown");
      if (!countdownEl) {
        countdownEl = document.createElement("div");
        countdownEl.className = "music-countdown";
        document.querySelector(".player-card").appendChild(countdownEl);
      }

      // Determine countdown duration - 11 seconds for first track, 2 seconds for subsequent tracks
      const duration = this.isFirstPlay ? 11 : 2;
      this.isFirstPlay = false; // Mark that first play has happened

      // Start countdown
      let count = duration;
      countdownEl.textContent = `Music starts in ${count}...`;
      countdownEl.style.display = "none";

      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          // countdownEl.textContent = `Music starts in ${count}...`;
        } else {
          clearInterval(countdownInterval);
          countdownEl.style.display = "none";

          // Play the audio after countdown
          this.audio
            .play()
            .then(() => {
              this.isPlaying = true;
              this.updatePlayButton(); // Sync play button state
            })
            .catch((err) => {
              console.warn("Auto-play after countdown failed:", err);
            });
        }
      }, 1000);
    }
  }

  nextTrack() {
    this.currentTrackIndex =
      (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadTrack();
  }

  previousTrack() {
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + this.playlist.length) %
      this.playlist.length;
    this.loadTrack();
  }

  updateDuration() {
    const duration = this.formatTime(this.audio.duration);
    document.getElementById("time-display").textContent = `0:00 / ${duration}`;
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value)); // Ensure volume is between 0 and 1
    this.audio.volume = this.volume;

    // Update UI if available
    const volumeSlider = document.querySelector(".volume-slider");
    if (volumeSlider) {
      volumeSlider.value = this.volume * 100;
    }
  }

  maintainCurrentTrack() {
    // This method ensures the current track continues playing
    // when a workout starts, without resetting or changing tracks
    if (this.isPlaying) {
      // If already playing, do nothing
      return;
    } else {
      // If not playing, start the current track without changing it
      this.play();
    }
  }
}

// Initialize player
const player = new WorkoutMusicPlayer();
const wrapper = document.createElement("div");
wrapper.style.position = "relative";

// Setup player container
const playerContainer = player.createMusicInterface();
wrapper.appendChild(playerContainer);

// Insert wrapper into DOM
if (musicBtn) {
  musicBtn.parentNode.insertBefore(wrapper, musicBtn);
  wrapper.appendChild(musicBtn);
}

// Initialize controls
player.initializeControls();
player.loadTrack();

// Setup hover behavior
let hideTimeout;
wrapper.addEventListener("mouseenter", () => {
  clearTimeout(hideTimeout);
  playerContainer.classList.add("show");
});

wrapper.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    playerContainer.classList.remove("show");
  }, 2000);
});

// Music library popup functionality
if (musicBtn) {
  musicBtn.addEventListener("click", (e) => {
    if (e.target.closest(".music-player-container")) return;

    playerContainer.classList.remove("show");
    showMusicLibrary();
  });
}

function showMusicLibrary() {
  showPopup(
    "Music Library",
    `
        <div class="music-list">
            ${musicTracks
      .map(
        (track, index) => `
                <div class="music-item" data-index="${index}">
                    <div class="music-item-image">
                        <img src="${track.cover}" alt="${track.title}">
                    </div>
                    <div class="music-item-details">
                        <span class="music-item-title">${track.title}</span>
                        <span class="music-item-artist">${track.artist}</span>
                    </div>
                    <button class="play-btn">
                        ${index === player.currentTrackIndex && player.isPlaying
            ? "Playing"
            : "Play"
          }
                    </button>
                </div>
            `
      )
      .join("")}
        </div>
    `
  );

  // Add click handlers for playlist items
  document.querySelectorAll(".music-item").forEach((item) => {
    item.querySelector(".play-btn").addEventListener("click", () => {
      player.currentTrackIndex = parseInt(item.dataset.index);
      player.loadTrack();
      player.play();
      popupContainer.style.display = "none";
    });
  });
}

function showPopup(title, content) {
  popupTitle.textContent = title;
  popupBody.innerHTML = content;
  popupContainer.style.display = "flex";
}

// Setup close handlers
closeBtn.addEventListener("click", () => {
  popupContainer.style.display = "none";
});

//.........................................................................................//
// More Function (pop up window)

document.addEventListener("DOMContentLoaded", function () {
  let popupContainer = document.getElementById("popup-container-more");
  if (!popupContainer) {
    popupContainer = document.createElement("div");
    popupContainer.id = "popup-container-more";
    document.body.appendChild(popupContainer);
  }

  const createSettingsPopup = () => {
    const moreButton = document.getElementById("more");
    if (!moreButton) {
      console.error("More button not found");
      return;
    }

    let popup = null;

    function createPopup() {
      const popupElement = document.createElement("div");
      popupElement.className = "popup-settings";

      const options = [
        { icon: "fa-camera", label: "Camera Settings" },
        { icon: "fa-chart-line", label: "MewTrack" },
        { icon: "fa-table-cells-large", label: "Layout" },
      ];

      const optionsHTML = options
        .map(
          (option) => `
                <div class="settings-option">
                    <i class="fas ${option.icon}"></i>
                    <span>${option.label}</span>
                </div>
            `
        )
        .join("");

      popupElement.innerHTML = optionsHTML;
      return popupElement;
    }

    function updatePopupPosition() {
      if (!popup) return;

      const buttonRect = moreButton.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();

      // Position popup above the button
      let top = buttonRect.top - popupRect.height - 20;
      let left = buttonRect.left - (popupRect.width - buttonRect.width) / 2;

      // Ensure popup stays within viewport
      if (left + popupRect.width > window.innerWidth) {
        left = window.innerWidth - popupRect.width - 40;
      }
      if (left < 10) {
        left = 10;
      }
      if (top < 10) {
        top = buttonRect.bottom + 10;
      }

      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
    }

    function showPopup() {
      if (!popup) {
        popup = createPopup();
        popupContainer.appendChild(popup);
      }

      popupContainer.style.display = "block";
      updatePopupPosition();

      // Add click handlers for options
      popup.querySelectorAll(".settings-option").forEach((option, index) => {
        option.onclick = () => {
          switch (index) {
            case 0:
              handleCameraSettings();
              break;
            case 1:
              handleMewTrack();
              break;
            case 2:
              handleLayout();
              break;
          }
          hidePopup();
        };
      });
    }

    function hidePopup() {
      popupContainer.style.display = "none";
    }

    // Handle window resize
    window.addEventListener("resize", updatePopupPosition);

    // Toggle popup on more button click
    moreButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (popupContainer.style.display === "block") {
        hidePopup();
      } else {
        showPopup();
      }
    });

    // Close popup when clicking outside
    document.addEventListener("click", (e) => {
      if (
        popupContainer.style.display === "block" &&
        !popup?.contains(e.target) &&
        e.target !== moreButton
      ) {
        hidePopup();
      }
    });
  };

  // Initialize settings popup
  createSettingsPopup();
});

//.........................................................................................//
// Camera Settings function (pop up window)

// Settings option handlers
function handleCameraSettings() {
  const popupContainer = document.getElementById("popup-container");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");

  popupTitle.innerHTML = `
    Camera Settings
    <button id="close-settings" style="
        position: absolute;
        right: 15px;
        top: 15px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        font-size: 16px;
    ">
        <i class="fa-solid fa-xmark"></i>
    </button>
    `;

  // Initialize with loading state
  popupBody.innerHTML = `
    <div style="padding: 20px;">
        <div style="text-align: center;">Loading camera settings...</div>
    </div>
    `;

  // Create camera settings interface with switch
  const settingsHTML = `
        <div style="padding: 20px;">
            <div class="setting-option" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="margin: 0;">Enable Camera</h3>
                    <label class="switch">
                        <input type="checkbox" id="camera-toggle" ${isCameraEnabled ? "checked" : ""
    }>
                        <span class="slider round"></span>
                    </label>
                </div>
                <p style="color: #666; margin: 5px 0 0 0;">
                    Toggle camera on/off. When disabled, the camera will be completely turned off.
                </p>
            </div>

            <div class="setting-option" style="margin-bottom: 20px;">
                <label for="cameraSelect" style="display: block; margin-bottom: 8px; font-weight: 500;">Select Camera</label>
                <select id="cameraSelect" style="
                    width: 100%;
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    background-color: white;
                    font-size: 14px;
                " ${!isCameraEnabled ? "disabled" : ""}>
                    ${cameras
      .map(
        (device, index) => `
                        <option value="${device.deviceId}">
                            ${device.label || `Camera ${index + 1}`}
                        </option>
                    `
      )
      .join("")}
                </select>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 30px;">
                <button id="apply-camera-settings" style="
                    padding: 8px 16px;
                    background: #ffb089;
                    width: 100%;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-right: 0px;
                    transition: background-color 0.3s;
                    padding: 12px 24px;
                    font-size: 16px;
                ">Apply Changes</button>
            </div>
        </div>
    `;

  popupBody.innerHTML = settingsHTML;
  popupContainer.style.display = "flex";

  // Set current camera as selected in dropdown
  if (videoElement && videoElement.srcObject) {
    const currentTrack = videoElement.srcObject.getVideoTracks()[0];
    if (currentTrack) {
      const select = document.getElementById("cameraSelect");
      const options = Array.from(select.options);
      const currentOption = options.find((option) => {
        const device = cameras.find((d) => d.deviceId === option.value);
        return device && device.label === currentTrack.label;
      });
      if (currentOption) {
        select.value = currentOption.value;
      }
    }
  }

  // Handle camera toggle affecting dropdown
  document
    .getElementById("camera-toggle")
    .addEventListener("change", async (e) => {
      const cameraSelect = document.getElementById("cameraSelect");
      cameraSelect.disabled = !e.target.checked;

      // Immediately handle camera state when toggled
      const newCameraEnabled = e.target.checked;
      const selectedDeviceId = cameraSelect.value;

      if (newCameraEnabled !== isCameraEnabled) {
        isCameraEnabled = newCameraEnabled;

        if (isCameraEnabled) {
          try {
            const success = await initializeCamera(selectedDeviceId);
            if (success) {
              startDetection(); // Only if camera initialization was successful
            }
          } catch (error) {
            console.error("Failed to start camera:", error);
            showCameraOffMessage(
              "Failed to start camera. Please check permissions and try again."
            );
            // Reset the toggle if camera fails to start
            e.target.checked = false;
            cameraSelect.disabled = true;
          }
        } else {
          stopCamera();
          showCameraOffMessage("Camera is currently turned off");
        }
      }
    });

  // Handle apply button
  document
    .getElementById("apply-camera-settings")
    .addEventListener("click", async () => {
      const newCameraEnabled = document.getElementById("camera-toggle").checked;
      const selectedDeviceId = document.getElementById("cameraSelect").value;

      if (
        newCameraEnabled !== isCameraEnabled ||
        (newCameraEnabled && selectedDeviceId !== getCurrentCameraId())
      ) {
        isCameraEnabled = newCameraEnabled;

        if (isCameraEnabled) {
          try {
            await initializeCamera(selectedDeviceId);
            startDetection();
          } catch (error) {
            console.error("Failed to start camera:", error);
            showCameraOffMessage(
              "Failed to start camera. Please check permissions and try again."
            );
          }
        } else {
          stopCamera();
          showCameraOffMessage("Camera is currently turned off");
        }
      }

      popupContainer.style.display = "none";
    });

  // Handle x-mark close button
  document.getElementById("close-settings").addEventListener("click", () => {
    popupContainer.style.display = "none";
  });
}

// Helper function to get current camera ID
function getCurrentCameraId() {
  if (videoElement && videoElement.srcObject) {
    const track = videoElement.srcObject.getVideoTracks()[0];
    if (track) {
      return track.getSettings().deviceId;
    }
  }
  return null;
}

// Function to stop camera
function stopCamera() {
  // Stop detection if running
  if (isRunning) {
    stopDetection();
  }

  // Stop all video tracks
  if (videoElement && videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    videoElement.srcObject = null;
  }

  // Clear canvas
  if (canvasElement && canvasContext) {
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }
}

// Function to show camera off message
function showCameraOffMessage(message) {
  const workoutUser = document.querySelector(".workout-user");
  workoutUser.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            background: #f8f8f8;
            border-radius: 16px;
        ">
            <i class="fa-solid fa-video-slash" style="
                font-size: 48px;
                color: #ff6060;
                margin-bottom: 20px;
            "></i>
            <h3 style="margin-bottom: 10px; color: #333;">Camera Off</h3>
            <p style="color: #666;">${message}</p>
            ${!isCameraEnabled
      ? `
                <button onclick="handleCameraSettings()" style="
                    margin-top: 20px;
                    padding: 8px 16px;
                    background: #ffb089;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Enable Camera</button>
            `
      : ""
    }
        </div>
    `;
}

async function initializeCamera(deviceId) {
  try {
    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 60 },
      },
    };

    // Stop any existing camera stream
    if (videoElement.srcObject) {
      videoElement.srcObject.getTracks().forEach((track) => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;

    // Wait for video to be ready
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play(); // Ensure video is playing
        resolve();
      };
    });

    // Add an additional delay to ensure video is fully initialized
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update canvas size
    const videoContainer = videoElement.parentElement;
    const rect = videoContainer.getBoundingClientRect();
    canvasElement.width = rect.width;
    canvasElement.height = rect.height;

    return true;
  } catch (error) {
    console.error("Error initializing camera:", error);
    throw error;
  }
}

//.........................................................................................//
// MewTrack function (pop up window)
function handleMewTrack() {
  const popupContainer = document.getElementById("popup-container");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");

  popupTitle.textContent = "MewTrack Settings";

  // Create settings HTML
  const settingsHTML = `
        <div class="mewtrack-settings">
            <!-- Enable MewTrack -->
            <div class="setting-option">
                <div class="setting-header">
                    <h3>Enable MewTrack</h3>
                    <label class="switch">
                        <input type="checkbox" id="enable-mewtrack" ${isMewTrackEnabled ? "checked" : ""
    }>
                        <span class="slider round"></span>
                    </label>
                </div>
                <p class="setting-description">
                    MewTrack helps detect incorrect postures during your workout.
                    Disable this to hide skeletal tracking and posture warnings.
                </p>
            </div>

            <!-- Posture Notifications -->
            <div class="setting-option">
                <div class="setting-header">
                    <h3>Posture Notifications</h3>
                    <label class="switch">
                        <input type="checkbox" id="enable-notifications" ${notificationsEnabled ? "checked" : ""
    }>
                        <span class="slider round"></span>
                    </label>
                </div>
                <p class="setting-description">
                    Show pop-up notifications when incorrect posture is detected.
                </p>
            </div>

            <!-- Skeleton Style -->
            <div class="setting-option" style="display:none">
                <h3>Skeleton Style</h3>
                <div class="skeleton-styles">
                    <div class="style-option" data-style="line">
                        <div class="style-preview line-style"></div>
                        <span>Lines</span>
                    </div>
                    <div class="style-option" data-style="dot">
                        <div class="style-preview dot-style"></div>
                        <span>Dots</span>
                    </div>
                    <div class="style-option" data-style="both">
                        <div class="style-preview both-style"></div>
                        <span>Both</span>
                    </div>
                </div>
            </div>

            <!-- Apply Button -->
            <button id="apply-mewtrack">Apply Changes</button>
        </div>
    `;

  // Set popup content
  popupBody.innerHTML = settingsHTML;
  popupContainer.style.display = "flex";

  // Handle skeleton style selection
  const styleOptions = document.querySelectorAll(".style-option");
  styleOptions.forEach((option) => {
    option.addEventListener("click", () => {
      styleOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
    });
  });

  // Set initial active style based on current setting
  const currentStyle = localStorage.getItem("skeletonStyle") || "both";
  document
    .querySelector(`[data-style="${currentStyle}"]`)
    .classList.add("active");

  // Handle apply button click
  document.getElementById("apply-mewtrack").addEventListener("click", () => {
    const enableMewTrack = document.getElementById("enable-mewtrack").checked;
    const enableNotifications = document.getElementById(
      "enable-notifications"
    ).checked;
    const selectedStyle = document.querySelector(".style-option.active").dataset
      .style;

    // Save settings
    localStorage.setItem("mewtrackEnabled", enableMewTrack);
    localStorage.setItem("notificationsEnabled", enableNotifications);
    localStorage.setItem("skeletonStyle", selectedStyle);

    // Apply settings
    updateMewTrackSettings(enableMewTrack, enableNotifications, selectedStyle);

    // Close popup
    popupContainer.style.display = "none";
  });
}

function updateMewTrackSettings(enableMewTrack, enableNotifications, style) {
  isMewTrackEnabled = enableMewTrack;
  notificationsEnabled = enableNotifications;
  skeletonStyle = style;
  console.log("MewTrack Enabled:", enableMewTrack, "Running:", isRunning);

  // Update detection state based on MewTrack setting
  if (enableMewTrack && !isRunning) {
    startDetection();
    isRunning = true; // Ensure isRunning reflects the state
  } else if (!enableMewTrack && isRunning) {
    stopDetection();
    isRunning = false; // Ensure isRunning reflects the state
  } else if (enableMewTrack && isRunning) {
    startDetection();
    isRunning = true;
  }

  // Clear canvas if MewTrack is disabled, but only if canvas is initialized
  if (!enableMewTrack && canvasElement && canvasContext) {
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize canvas element and context
  canvasElement = document.getElementById("mewtrack-canvas");
  canvasContext = canvasElement ? canvasElement.getContext("2d") : null;

  console.log(
    "Stored MewTrackEnabled:",
    localStorage.getItem("mewtrackEnabled")
  );

  // Load settings from localStorage
  const storedMewTrackEnabled = localStorage.getItem("mewtrackEnabled");
  const storedNotificationsEnabled = localStorage.getItem(
    "notificationsEnabled"
  );
  const storedSkeletonStyle = localStorage.getItem("skeletonStyle");

  isMewTrackEnabled =
    storedMewTrackEnabled !== null ? storedMewTrackEnabled === "true" : false;
  notificationsEnabled =
    storedNotificationsEnabled !== null
      ? storedNotificationsEnabled === "true"
      : true;
  skeletonStyle = storedSkeletonStyle || "both";

  // Correctly initialize isRunning and trigger detection if enabled
  if (isMewTrackEnabled) {
    isRunning = true;
    startDetection(); // Ensure detection starts if enabled
  } else {
    isRunning = false;
  }

  // Update settings
  updateMewTrackSettings(
    isMewTrackEnabled,
    notificationsEnabled,
    skeletonStyle
  );
});

//.........................................................................................//
// Loyout function (pop up window)
function handleLayout() {
  const popupContainer = document.getElementById("popup-container");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");

  popupTitle.textContent = "Layout Settings";

  // Define layouts
  const layouts = [
    {
      id: "side-by-side",
      name: "Side by Side",
      description: "Equal width displays",
      preview: `
                <div class="layout-preview side-by-side">
                    <div class="preview-guide">Guide</div>
                    <div class="preview-camera">Camera</div>
                </div>
            `,
    },
    {
      id: "guide-focus",
      name: "Guide Focus",
      description: "Larger guide display",
      preview: `
                <div class="layout-preview guide-focus">
                    <div class="preview-guide">Guide</div>
                    <div class="preview-camera">Camera</div>
                </div>
            `,
    },
    {
      id: "camera-focus",
      name: "Camera Focus",
      description: "Larger camera display",
      preview: `
                <div class="layout-preview camera-focus">
                    <div class="preview-guide">Guide</div>
                    <div class="preview-camera">Camera</div>
                </div>
            `,
    },
    {
      id: "stacked",
      name: "Stacked",
      description: "Vertical arrangement",
      preview: `
                <div class="layout-preview stacked">
                    <div class="preview-guide">Guide</div>
                    <div class="preview-camera">Camera</div>
                </div>
            `,
    },
  ];

  // Create layout selector HTML
  const layoutsHTML = layouts
    .map(
      (layout) => `
        <div class="layout-option" data-layout="${layout.id}">
            <div class="layout-info">
                <h3>${layout.name}</h3>
                <p>${layout.description}</p>
            </div>
            ${layout.preview}
            <div class="layout-check">
                <i class="fa-solid fa-check"></i>
            </div>
        </div>
    `
    )
    .join("");

  // Set popup content
  popupBody.innerHTML = `
        <div class="layouts-container">
            ${layoutsHTML}
        </div>
        <div class="layout-actions">
            <button class="apply-layout">Apply Layout</button>
        </div>
    `;

  // Show popup
  popupContainer.style.display = "flex";

  // Add event listeners
  const layoutOptions = popupBody.querySelectorAll(".layout-option");
  let selectedLayout = localStorage.getItem("selectedLayout") || "side-by-side"; // Load saved layout

  layoutOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Remove active class from all options
      layoutOptions.forEach((opt) => opt.classList.remove("active"));
      // Add active class to selected option
      option.classList.add("active");
      selectedLayout = option.dataset.layout;
    });
  });

  // Set initial active state
  document
    .querySelector(`[data-layout="${selectedLayout}"]`)
    .classList.add("active");

  // Handle apply button click
  const applyButton = popupBody.querySelector(".apply-layout");
  applyButton.addEventListener("click", () => {
    applyLayout(selectedLayout);
    popupContainer.style.display = "none";
    // Save selected layout to local storage
    localStorage.setItem("selectedLayout", selectedLayout);
  });
}

function applyLayout(layoutId) {
  const workoutContainer = document.querySelector(".workout-container");
  const workoutGuide = document.querySelector(".workout-guide");
  const workoutUser = document.querySelector(".workout-user");

  // Remove all previous layout classes
  workoutContainer.classList.remove(
    "layout-side-by-side",
    "layout-guide-focus",
    "layout-camera-focus",
    "layout-stacked"
  );

  // Add new layout class
  workoutContainer.classList.add(`layout-${layoutId}`);

  // Apply animation
  workoutContainer.style.transition = "all 0.5s ease-in-out";

  // Update canvas size after layout change
  if (canvasElement) {
    const rect = workoutUser.getBoundingClientRect();

    // Add animation for canvas resizing
    canvasElement.style.transition = "all 0.5s ease-in-out";
    canvasElement.width = rect.width;
    canvasElement.height = rect.height;

    // Redraw pose if detection is running
    if (isRunning) {
      detectPose();
    }
  }
}

// Add layout class to container on initial load
document.addEventListener("DOMContentLoaded", () => {
  const workoutContainer = document.querySelector(".workout-container");
  const savedLayout = localStorage.getItem("selectedLayout") || "side-by-side";
  workoutContainer.classList.add(`layout-${savedLayout}`);
});

//.........................................................................................//
// Connection between workout page data to subworkout page

// At the beginning of your subworkout_page.js
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the workout manager
  const workoutManager = new WorkoutManager();
  window.workoutManager = workoutManager;

  // Check if we're restarting a workout
  const shouldRestart = localStorage.getItem("restartWorkout") === "true";

  if (shouldRestart) {
    // Clear the restart flag
    localStorage.removeItem("restartWorkout");
    console.log("Restarting workout from done page...");
    // Call restart function
    workoutManager.restartWorkout();
  } else {
    // Regular initialization
    console.log("Starting new workout...");
    workoutManager.startCountdown();
  }
});
class WorkoutManager {
  constructor() {

    const urlParams = new URLSearchParams(window.location.search);
    this.workoutId = parseInt(urlParams.get('id') || 0);

    if (this.workout && !this.workout.id) {
      this.workout.id = this.workoutId;
    }

    // Initialize state
    this.initializeState();
    // Get DOM elements
    this.initializeDOMElements();
    // Setup rest overlay
    this.initializeRestOverlay();
    // Setup countdown overlay
    this.initializeCountdownOverlay();
    // Initialize voice instructions
    this.initializeVoiceInstructions();

    // Initialize workout music player
    this.workoutMusicPlayer = new WorkoutMusicPlayer();
    // Initialize pose detector
    this.poseDetector = new WorkoutPoseDetector();
    this.fullBodyAlertActive = false;
    // Would store reference keypoints for each exercise
    this.referenceKeypointsLibrary = {};

    // Add these lines:
    this.setupPauseButton();
    this.setupCloseButton();
    this.setupSkipButton();
  }

  handlePoseDetection(poses) {
    if (!this.poseDetector || !poses || poses.length === 0) return;

    // Get the current exercise name from the workout
    const currentExercise = this.exercises[this.currentExerciseIndex].exercise;

    // Ensure the pose detector is set to the current exercise
    if (this.poseDetector.currentExercise !== currentExercise) {
      console.log(`Setting current exercise to: ${currentExercise}`);
      this.poseDetector.startExercise(currentExercise);
    }

    const keypoints = poses[0].keypoints;
    const result = this.poseDetector.analyzePose(keypoints);

    // Update rep counter display
    if (result.repCount > this.repCount) {
      this.repCount = result.repCount;
      this.timerElement.textContent = this.repCount;

      // Check if exercise is complete based on reps
      if (
        this.exercises[this.currentExerciseIndex].reps &&
        this.repCount >= this.exercises[this.currentExerciseIndex].reps
      ) {
        this.nextExercise();
      }
    }

    // Show form feedback
    if (result.feedback && notificationsEnabled) {
      showFormFeedback([result.feedback]);
    }
  }

  initializeVoiceInstructions() {
    if (typeof responsiveVoice === "undefined") {
      console.error(
        "ResponsiveVoice not found. Make sure to include the ResponsiveVoice library."
      );
      this.speakText = (text) => console.log("Voice would say:", text);
      this.voiceEnabled = false;
      return;
    }

    this.voiceEnabled = true;
    ``;
    this.voiceSettings = {
      pitch: 1,
      rate: 1,
      volume: 1,
      voice: "UK English Female",
    };

    this.createVoiceToggleButton();
  }

  createVoiceToggleButton() {
    const controlsContainer = document.querySelector(".controls-workout");
    if (!controlsContainer) return;

    const voiceButton = document.createElement("button");
    voiceButton.className = "voice-toggle";
    voiceButton.innerHTML = `
            <i id="voice-btn-icon" class="fas ${this.voiceEnabled ? "fa-volume-up" : "fa-volume-mute"
      }"></i>
            <span class="voice-text">${this.voiceEnabled ? "Voice On" : "Voice Off"
      }</span>
        `;
    voiceButton.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
        `;

    voiceButton.addEventListener("click", () => {
      this.voiceEnabled = !this.voiceEnabled;
      const voiceIcon = document.getElementById("voice-btn-icon");
      const voiceText = voiceButton.querySelector(".voice-text");

      if (voiceIcon && voiceText) {
        if (this.voiceEnabled) {
          voiceIcon.classList.remove("fa-volume-mute");
          voiceIcon.classList.add("fa-volume-up");
          voiceText.textContent = "Voice On";
          this.speakText("Voice instructions enabled");
        } else {
          voiceIcon.classList.remove("fa-volume-up");
          voiceIcon.classList.add("fa-volume-mute");
          voiceText.textContent = "Voice Off";
          this.speakText("Voice instructions disabled");
        }
      }
    });

    controlsContainer.appendChild(voiceButton);
  }

  speakText(text, onEndCallback = null) {
    if (!this.voiceEnabled || typeof responsiveVoice === "undefined") return;

    responsiveVoice.speak(text, this.voiceSettings.voice, {
      pitch: this.voiceSettings.pitch,
      rate: this.voiceSettings.rate,
      volume: this.voiceSettings.volume,
      onend: onEndCallback,
    });
  }

  cancelSpeech() {
    if (typeof responsiveVoice !== "undefined") {
      responsiveVoice.cancel();
    }
  }

  initializeState() {
    try {
      const workoutData =
        JSON.parse(localStorage.getItem("currentWorkout")) || [];
      this.workout = workoutData[0];
      this.exercises = this.workout?.exercises || [];
      this.currentSet = 1;
      this.totalSets = this.workout?.sets || 1;
      this.currentExerciseIndex = 0;
      this.isResting = false;
      this.timer = null;
      this.repCount = 0;
      this.repCounter = null;
      this.timeLeft = 0;
      this.endRestTimeout = null;
    } catch (error) {
      console.error("Error initializing state:", error);
      this.exercises = [];
    }
  }

  initializeDOMElements() {
    this.timerElement = document.querySelector(".timer-text");
    this.workoutNameElement = document.querySelector(".workout-name");
    this.roundElement = document.querySelector(".workout-round");
    this.workoutUser = document.querySelector(".workout-user");
    this.workoutGuide = document.querySelector(".workout-guide");

    if (!this.timerElement || !this.workoutNameElement || !this.roundElement) {
      console.error("Required DOM elements not found");
    }
  }

  init() {
    this.workoutId = this.getWorkoutIdFromPage();
    console.log("Initialized workout ID:", this.workoutId);

    if (!this.workout || this.exercises.length === 0) {
      console.error("No workout data available");
      this.endWorkout();
      return;
    }

    this.startCountdown();
  }

  getWorkoutIdFromPage() {
    const urlParams = new URLSearchParams(window.location.search);
    let id = urlParams.get('workout_id');

    if (!id) {
      const workoutElement = document.getElementById('workout-container');
      if (workoutElement && workoutElement.dataset.workoutId) {
        id = workoutElement.dataset.workoutId;
      }
    }

    return id ? parseInt(id, 10) : 0;
  }

  showCurrentExercise() {
    if (!this.exercises[this.currentExerciseIndex]) return;

    const currentExercise = this.exercises[this.currentExerciseIndex];
    this.workoutNameElement.textContent =
      currentExercise.exercise || currentExercise.pose;
    this.roundElement.textContent = `${this.currentSet}/${this.totalSets}`;

    // Announce current exercise
    const exerciseName = currentExercise.exercise || currentExercise.pose;
    let announcement = `${exerciseName}`;

    if (currentExercise.reps) {
      announcement += `, ${currentExercise.reps} reps`;
      this.timerElement.textContent = "0";
      this.timerElement.classList.add("rep-counter");
    } else if (currentExercise.duration) {
      // Parse the duration properly
      let durationInSeconds = this.parseDuration(currentExercise.duration);
      // Display in minutes:seconds format
      this.updateTimerDisplay(durationInSeconds);
      this.timerElement.classList.remove("rep-counter");

      // Add duration to announcement
      if (durationInSeconds >= 60) {
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;
        announcement += `, ${minutes} minute${minutes !== 1 ? "s" : ""}`;
        if (seconds > 0) {
          announcement += ` and ${seconds} second${seconds !== 1 ? "s" : ""}`;
        }
      } else {
        announcement += `, ${durationInSeconds} second${durationInSeconds !== 1 ? "s" : ""
          }`;
      }
    }

    // Add set information
    announcement += `, set ${this.currentSet} of ${this.totalSets}`;

    // Speak the exercise information
    this.speakText(announcement);

    // Show current exercise video
    this.showExerciseVideo(currentExercise);
  }

  // Add this method to show exercise video
  showExerciseVideo(exercise) {
    if (!this.workoutGuide || !exercise.video) return;

    // Create or update video element
    let videoElement = this.workoutGuide.querySelector("video");

    if (!videoElement) {
      videoElement = document.createElement("video");
      videoElement.classList.add("exercise-video");
      videoElement.style.width = "100%";
      videoElement.style.height = "100%";
      videoElement.style.borderRadius = "16px";
      videoElement.style.objectFit = "cover";
      videoElement.style.border = "solid 2px #feaf88";
      videoElement.setAttribute("loop", "true");
      videoElement.setAttribute("autoplay", "true");
      videoElement.setAttribute("muted", "true");
      videoElement.setAttribute("playsinline", "true"); // Add this for iOS support
      this.workoutGuide.innerHTML = "";
      this.workoutGuide.appendChild(videoElement);
    }

    // First pause any existing playback to avoid conflicts
    videoElement.pause();

    // Set video source
    videoElement.src = exercise.video;

    // Wait for the video to be loaded before playing
    videoElement.onloadeddata = () => {
      videoElement.play().catch((error) => {
        console.error("Error playing video after load:", error);
      });
    };

    // Start loading the video
    videoElement.load();
  }

  // Add this method to show next exercise video
  showNextExerciseVideo() {
    let nextIndex = this.currentExerciseIndex;
    let nextSet = this.currentSet;

    // Calculate the next exercise index
    if (nextIndex >= this.exercises.length - 1) {
      if (nextSet >= this.totalSets) {
        // No next exercise (workout complete)
        return;
      }
      nextIndex = 0;
      nextSet++;
    } else {
      nextIndex++;
    }

    console.log(
      `Showing video for next exercise: ${nextIndex} in set ${nextSet}`
    );
    const nextExercise = this.exercises[nextIndex];
    if (nextExercise && nextExercise.video) {
      // Make sure we're not in a rest period when updating the video
      if (!this.isResting) {
        return;
      }

      let videoElement = this.workoutGuide.querySelector("video");
      if (videoElement) {
        videoElement.src = nextExercise.video;
        videoElement.load();
        videoElement.play().catch((error) => {
          console.error("Error playing next exercise video:", error);
        });
      }
    }
  }

  // Add this helper function to parse duration strings
  parseDuration(duration) {
    if (typeof duration === "number") return duration;

    if (typeof duration === "string") {
      // Check if duration contains 'minutes' or 'min'
      if (duration.includes("minute") || duration.includes("min")) {
        // Extract number of minutes
        const match = duration.match(/(\d+)/);
        if (match) {
          // Convert minutes to seconds
          return parseInt(match[1]) * 60;
        }
      } else {
        // Handle seconds format
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }
    }
    return 0;
  }

  startExercise() {
    const currentExercise = this.exercises[this.currentExerciseIndex];
    if (!currentExercise) return;

    this.workoutMusicPlayer.play();

    if (currentExercise.reps) {
      this.setupRepCounter(currentExercise.reps);
    } else if (currentExercise.duration) {
      const durationInSeconds = this.parseDuration(currentExercise.duration);
      this.startTimer(durationInSeconds);
    }
  }

  setupRepCounter(targetReps) {
    if (!targetReps || targetReps <= 0) return;

    const currentExercise = this.exercises[this.currentExerciseIndex].exercise;
    // Initialize the pose detector for the current exercise
    this.poseDetector.startExercise(currentExercise, null);
    this.repCount = 0;

    // Announce rep target
    this.speakText(`Complete ${targetReps} reps`);

    if (
      typeof detectPose === "function" &&
      typeof videoElement !== "undefined"
    ) {
      const originalDetectPose = detectPose.bind(this);
      detectPose = async () => {
        try {
          await originalDetectPose();

          if (this.poseDetector && detector) {
            const poses = await detector.estimatePoses(videoElement);
            if (poses.length > 0) {
              const result = this.poseDetector.analyzePose(poses[0].keypoints);
              if (result.repCount > this.repCount) {
                this.repCount = result.repCount;
                this.timerElement.textContent = this.repCount;

                // Add feedback handling
                if (result.feedback) {
                  this.speakText(result.feedback);
                  // Update UI feedback element if needed
                  document.getElementById("feedback").textContent =
                    result.feedback;
                }

                // Motivational messages
                if (this.repCount === Math.floor(targetReps / 2)) {
                  this.speakText("Halfway there!");
                } else if (targetReps - this.repCount === 5) {
                  this.speakText("Just 5 more reps!");
                } else if (targetReps - this.repCount === 3) {
                  this.speakText("Almost there! 3 more!");
                } else if (targetReps - this.repCount === 1) {
                  this.speakText("Last one, make it count!");
                }

                if (this.repCount >= targetReps) {
                  this.speakText("Great job! Exercise complete!");
                  this.nextExercise();
                }
              }
            }
          }
        } catch (error) {
          console.error("Error in pose detection:", error);
        }
      };

      if (
        typeof isRunning !== "undefined" &&
        !isRunning &&
        typeof startDetection === "function"
      ) {
        startDetection();
      }
    }
  }

  startTimer(seconds) {
    if (!seconds || seconds <= 0) return;

    this.clearAllTimers();
    let timeLeft = seconds;
    let notifiedHalfway = false;
    let notifiedTenSeconds = false;
    let notifiedFiveSeconds = false;

    // Update timer display immediately
    this.updateTimerDisplay(timeLeft);

    this.timer = setInterval(() => {
      timeLeft--;
      this.updateTimerDisplay(timeLeft);

      // Halfway notification
      if (!notifiedHalfway && timeLeft <= Math.floor(seconds / 2)) {
        notifiedHalfway = true;
        this.speakText("Halfway there, keep going!");
      }

      // 10 seconds remaining notification
      if (!notifiedTenSeconds && timeLeft === 10) {
        notifiedTenSeconds = true;
        this.speakText("10 seconds remaining");
      }

      // 5 seconds countdown
      if (timeLeft <= 5 && timeLeft > 0 && !notifiedFiveSeconds) {
        notifiedFiveSeconds = true;
        this.speakText(`${timeLeft}`);
      }

      if (timeLeft <= 0) {
        this.clearAllTimers();
        // Exercise completed notification
        this.speakText("Exercise complete!");
        this.nextExercise();
      }
    }, 1000);
  }

  updateTimerDisplay(timeInSeconds) {
    if (this.timerElement) {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      this.timerElement.textContent = `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  }

  nextExercise() {
    this.repCounter = null;
    this.clearAllTimers();

    // Check if this was the last exercise in the last set
    if (
      this.currentExerciseIndex >= this.exercises.length - 1 &&
      this.currentSet >= this.totalSets
    ) {
      console.log("Workout complete - all exercises and sets finished");
      this.endWorkout();
      return;
    }

    // Otherwise, increment exercise or set
    if (this.currentExerciseIndex >= this.exercises.length - 1) {
      this.currentSet++;
      this.currentExerciseIndex = 0;
      console.log(`Moving to set ${this.currentSet}`);
    } else {
      this.currentExerciseIndex++;
      console.log(
        `Moving to exercise ${this.currentExerciseIndex + 1} in set ${this.currentSet
        }`
      );
    }

    // Show rest screen before the next exercise
    this.showRestScreen();
  }

  // Handle pause button click
  setupPauseButton() {
    const pauseBtn = document.querySelector(".pause");
    const pauseIcon = document.getElementById("pause-btn-icon");
    const pauseText = document.querySelector(".pause-text");

    if (!pauseBtn || !pauseIcon || !pauseText) {
      console.error("Pause button elements not found");
      return;
    }

    this.isPaused = false;

    pauseBtn.addEventListener("click", () => {
      this.isPaused = !this.isPaused;

      if (this.isPaused) {
        // Pause workout and music
        pauseIcon.classList.remove("fa-pause");
        pauseIcon.classList.add("fa-play");
        pauseText.textContent = "Resume";

        // Announce pause
        this.speakText("Workout paused");

        // Stop all active processes
        this.clearAllTimers();
        if (typeof stopDetection === "function") {
          stopDetection();
        }
        if (typeof isRunning !== "undefined") {
          isRunning = false;
        }

        this.pauseExerciseVideo();
        this.showPauseOverlay();
      } else {
        // Resume workout and music
        pauseIcon.classList.remove("fa-play");
        pauseIcon.classList.add("fa-pause");
        pauseText.textContent = "Pause";

        // Announce resume
        this.speakText("Resuming workout");

        // Hide pause overlay
        this.hidePauseOverlay();
        this.resumeExerciseVideo();

        // Resume appropriate timers based on state
        if (this.isResting) {
          this.startRestTimer();
        } else {
          // Resume exercise timer if it exists
          const currentExercise = this.exercises[this.currentExerciseIndex];
          if (currentExercise && currentExercise.duration) {
            // Extract current time left from the timer display
            let timeString = this.timerElement.textContent;
            let timeLeft = 0;

            if (timeString.includes(":")) {
              // Split the time string into minutes and seconds
              const timeParts = timeString.split(":");
              const minutes = parseInt(timeParts[0]);
              const seconds = parseInt(timeParts[1]);
              // Convert to total seconds
              timeLeft = minutes * 60 + seconds;
            } else {
              timeLeft = parseInt(timeString);
            }

            if (!isNaN(timeLeft) && timeLeft > 0) {
              this.startTimer(timeLeft);
            }
          }

          // Resume pose detection
          if (typeof startDetection === "function") {
            startDetection();
          }
          if (typeof isRunning !== "undefined") {
            isRunning = true;
          }
        }
      }

      // Dispatch a custom event that can be listened for by other components
      const pauseEvent = new CustomEvent("workoutPauseStateChange", {
        detail: { isPaused: this.isPaused },
      });
      document.dispatchEvent(pauseEvent);
    });
  }

  // Add these methods to pause/resume video
  pauseExerciseVideo() {
    const videoElement = this.workoutGuide.querySelector("video");
    if (videoElement) {
      videoElement.pause();
    }
    // Also pause any ongoing speech
    this.cancelSpeech();
  }

  resumeExerciseVideo() {
    const videoElement = this.workoutGuide.querySelector("video");
    if (videoElement) {
      videoElement.play().catch((error) => {
        console.error("Error resuming video:", error);
      });
    }
  }

  showPauseOverlay() {
    // Create pause overlay if it doesn't exist
    let pauseOverlay = document.getElementById("pause-overlay");
    if (!pauseOverlay) {
      pauseOverlay = document.createElement("div");
      pauseOverlay.id = "pause-overlay";
      pauseOverlay.className = "pause-overlay";
      pauseOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 950;
                color: white;
                z-index: 999;
            `;

      pauseOverlay.innerHTML = `
                <div class="pause-message" style="text-align: center; padding: 20px;">
                    <img src="./assets/icons/pause_workout.svg" alt="Pause" style="max-width: 150px; margin-bottom: 1rem;" />
                    <h2>Workout Paused</h2>
                    <p>Press the Resume button to continue your workout</p>
                </div>
            `;

      document.body.appendChild(pauseOverlay);
    }

    // Show the overlay
    pauseOverlay.style.display = "flex";
  }

  hidePauseOverlay() {
    const pauseOverlay = document.getElementById("pause-overlay");
    if (pauseOverlay) {
      pauseOverlay.style.display = "none";
    }
  }

  // Handle close button (cancel workout)
  setupCloseButton() {
    const closeBtn = document.getElementById("close-btn");
    if (!closeBtn) return;

    closeBtn.addEventListener("click", () => {
      this.clearAllTimers();
      this.pauseExerciseVideo();
      if (typeof isRunning !== "undefined") {
        isRunning = false;
      }
      // Always show confirmation popup when X button is clicked
      this.showConfirmationPopup(
        "Exit Workout",
        "Do you really want to exit the workout?",
        () => {
          // Clear all timers and stop detection before exiting
          this.clearAllTimers();
          if (typeof stopDetection === "function") stopDetection();
          window.location.href = "workout_page.php";
        }
      );
    });
  }

  // Handle skip button
  setupSkipButton() {
    const skipBtn = document.querySelector(".skip");
    if (!skipBtn) return;

    skipBtn.addEventListener("click", () => {
      // If the workout is paused, resume it first
      if (this.isPaused) {
        this.isPaused = false;

        // Update UI
        const pauseIcon = document.getElementById("pause-btn-icon");
        const pauseText = document.querySelector(".pause-text");
        if (pauseIcon && pauseText) {
          pauseIcon.classList.remove("fa-play");
          pauseIcon.classList.add("fa-pause");
          pauseText.textContent = "Pause";
        }

        // Hide overlay
        this.hidePauseOverlay();

        // Resume detection
        if (typeof startDetection === "function") {
          startDetection();
        }
        if (typeof isRunning !== "undefined") {
          isRunning = true;
        }
      }

      // Skip to next exercise and go to subworkout_done_page when last exercise is skipped
      if (
        this.currentExerciseIndex >= this.exercises.length - 1 &&
        this.currentSet >= this.totalSets
      ) {
        this.showConfirmationPopup(
          "End Workout",
          "Do you want to end the workout?",
          () => {
            this.endWorkout();
          }
        );
        return;
      }

      this.skipCurrentExercise();
    });
  }

  skipCurrentExercise() {
    // If we're already resting, end the rest and go to next exercise
    if (this.isResting) {
      this.endRest();
      return;
    }

    // Announce skipping exercise
    this.speakText("Skipping to next exercise");

    // Clear timers and rep counter
    this.repCounter = null;
    this.clearAllTimers();

    // Move to the next exercise
    this.nextExercise();
  }

  showConfirmationPopup(title, message, onConfirm) {
    // Check if popup container exists, create it if not
    let popupContainer = document.getElementById("popup-container");
    if (!popupContainer) {
      popupContainer = document.createElement("div");
      popupContainer.id = "popup-container";
      popupContainer.className = "popup-container";
      popupContainer.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
      document.body.appendChild(popupContainer);
    }

    // Create popup content
    popupContainer.innerHTML = `
            <div class="popup-content">
                <h2>${title}</h2>
                <p>${message}</p>
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 35px; margin-bottom: 20px;">
                    <button id="popup-yes" style="padding: 15px 50px; border: none; border-radius: 18px; cursor: pointer; background-color: #ff5757; color: white;">Yes</button>
                    <button id="popup-no" style="padding: 15px 50px; border: none; border-radius: 18px; cursor: pointer; background-color: #ffb089; color: white;">No</button>
                </div>
            </div>
        `;

    // Show popup
    popupContainer.style.display = "flex";

    // Add event listeners
    document.getElementById("popup-yes").addEventListener("click", () => {
      popupContainer.style.display = "none";
      if (typeof onConfirm === "function") onConfirm();
    });

    document.getElementById("popup-no").addEventListener("click", () => {
      popupContainer.style.display = "none";
      if (!this.isPaused) {
        this.resumeExerciseVideo();
        this.startRestTimer();

        const currentExercise = this.exercises[this.currentExerciseIndex];
        if (currentExercise && currentExercise.duration) {
          // Extract current time left from the timer display
          let timeString = this.timerElement.textContent;
          let timeLeft = 0;

          if (timeString.includes(":")) {
            // Split the time string into minutes and seconds
            const timeParts = timeString.split(":");
            const minutes = parseInt(timeParts[0]);
            const seconds = parseInt(timeParts[1]);
            // Convert to total seconds
            timeLeft = minutes * 60 + seconds;
          } else {
            timeLeft = parseInt(timeString);
          }

          if (!isNaN(timeLeft) && timeLeft > 0) {
            this.startTimer(timeLeft);
          }
        }

        if (typeof startDetection === "function") {
          startDetection();
        }

        if (typeof isRunning !== "undefined") {
          isRunning = true;
        }
      }
    });
  }

  // Restart workout
  restartWorkout() {
    this.clearAllTimers();
    this.repCounter = null;
    this.currentExerciseIndex = 0;
    this.currentSet = 1;
    this.isResting = false;

    if (typeof stopDetection === "function") stopDetection();

    console.log("Restarting workout...");
    // Restart countdown
    this.startCountdown();
  }

  saveWorkoutData(workout) {
    localStorage.setItem("currentWorkout", JSON.stringify(workout));
  }

  saveWorkoutStats(duration, calories) {
    localStorage.setItem(
      "workoutStats",
      JSON.stringify({
        duration: duration,
        calories: calories,
      })
    );
  }

  initializeRestOverlay() {
    const existingOverlay = document.querySelector(".rest-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    this.restOverlay = document.createElement("div");
    this.restOverlay.className = "rest-overlay";

    this.restOverlay.innerHTML = `
            <div class="rest-card">
                <img src="./assets/icons/pause_workout.svg" alt="Rest" style="max-width: 150px; margin-bottom: 1rem;" />
                <h3>Rest</h3>
                <p>Take a break and have a meow</p>
                <div class="rest-timer" style="font-size: 2rem; margin: 1rem 0;">20</div>
            </div>
        `;

    document.body.appendChild(this.restOverlay);
    this.setupRestControls();
  }

  setupRestControls() {
    this.restOverlay.querySelectorAll(".add-time").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (!this.isResting) return;

        const seconds = parseInt(btn.dataset.seconds);
        this.updateRestTimer(this.timeLeft + seconds);

        this.startRestTimer();
      });
    });
  }

  showRestScreen() {
    this.clearAllTimers();
    this.isResting = true;

    // Calculate the next exercise index correctly
    let nextExerciseIndex;
    let nextSet = this.currentSet; // Default to the current set

    console.log("Current Exercise Index:", this.currentExerciseIndex);

    if (this.currentExerciseIndex >= this.exercises.length - 1) {
      // If we're at the last exercise in the current set
      if (this.currentSet >= this.totalSets - 1) {
        // If this is the last set, there's no next exercise
        nextExerciseIndex = -1;
        console.log("Reached the last exercise of the last set.");
      } else {
        // Move to the first exercise of the next set
        nextExerciseIndex = 0;
        nextSet = this.currentSet + 1;
        console.log("Moving to the first exercise of the next set.");
      }
    } else {
      // Move to the next exercise in the current set
      nextExerciseIndex = this.currentExerciseIndex;
      console.log("Moving to the next exercise in the current set.");
    }

    // Assign the next exercise (if any)
    const nextExercise =
      nextExerciseIndex >= 0 ? this.exercises[nextExerciseIndex] : null;

    // Debugging to ensure values are correct
    console.log("Next Exercise Index:", nextExerciseIndex);
    console.log("Next Set:", nextSet);
    console.log("Next Exercise:", nextExercise);

    // Announce rest period
    this.speakText("Rest time. Take a break.");

    if (nextExercise) {
      this.workoutNameElement.textContent = `Next: ${nextExercise.exercise || nextExercise.pose
        }`;
      // Announce next exercise after a short delay
      setTimeout(() => {
        this.speakText(
          `Coming up next: ${nextExercise.exercise || nextExercise.pose}`
        );
      }, 2000);

      // Show next exercise video during rest
      if (nextExercise.video) {
        let videoElement = this.workoutGuide.querySelector("video");
        if (videoElement) {
          videoElement.src = nextExercise.video;
          videoElement.load();
          videoElement.play().catch((error) => {
            console.error("Error playing next exercise video:", error);
          });
        }
      }
    }

    this.restOverlay.style.display = "flex";
    if (this.workoutUser) {
      this.workoutUser.style.visibility = "hidden";
    }

    this.updateRestTimer(20);
    this.startRestTimer();
  }

  startRestTimer() {
    this.clearAllTimers();
    let notifiedHalfway = false;
    let notifiedTenSeconds = false;
    let notifiedFiveSeconds = false;

    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateRestTimer(this.timeLeft);

        // Rest time notifications
        if (!notifiedHalfway && this.timeLeft === 10) {
          notifiedHalfway = true;
          this.speakText("10 seconds of rest remaining");
        } else if (!notifiedFiveSeconds && this.timeLeft === 5) {
          notifiedFiveSeconds = true;
          this.speakText("Get ready for the next exercise");
        } else if (this.timeLeft <= 3 && this.timeLeft > 0) {
          this.speakText(`${this.timeLeft}`);
        }
      } else {
        this.clearAllTimers();
        this.endRest();
      }
    }, 1000);
  }

  updateRestTimer(newTime) {
    this.timeLeft = Math.max(0, newTime);
    const timerDisplay = this.restOverlay.querySelector(".rest-timer");
    if (timerDisplay) {
      timerDisplay.textContent = this.timeLeft;
    }
  }

  endRest() {
    this.clearAllTimers();
    this.isResting = false;
    this.timeLeft = 0;

    if (this.restOverlay) {
      this.restOverlay.style.display = "none";
    }
    if (this.workoutUser) {
      this.workoutUser.style.visibility = "visible";
    }

    // Announce that rest is over
    this.speakText("Rest time is over. Let's continue!");

    if (isRunning && detector && isMewTrackEnabled) {
      animationFrameId = requestAnimationFrame(() => detectPose());
    }

    this.showCurrentExercise();
    this.startExercise();
  }

  initializeCountdownOverlay() {
    const existingOverlay = document.querySelector(".countdown-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    this.countdownOverlay = document.createElement("div");
    this.countdownOverlay.className = "countdown-overlay";
    this.countdownOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
        `;

    this.countdownOverlay.innerHTML = `
            <div id="countdown-close" class="close-btn" style="position: absolute; top: 25px; right: 0px; cursor: pointer;">
                <i class="fa-solid fa-xmark"></i>
            </div>
            <div class="countdown-main" style="text-align: center;">
                <h1 class="ready-text">READY TO GO</h1>
                <div class="count-circle">10</div>
                <div class="warmup-text">Warm-up Exercise: ${this.getFirstExerciseName()}</div>
            </div>
        `;

    document.body.appendChild(this.countdownOverlay);

    // Add event listener for the close button
    const closeBtn = this.countdownOverlay.querySelector("#countdown-close");
    closeBtn.addEventListener("click", () => {
      // Show a confirmation dialog
      const userConfirmed = confirm(
        "Are you sure you want to stop the exercise?"
      );

      if (userConfirmed) {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        this.countdownOverlay.style.display = "none";
        this.endWorkout();
        window.location.href = "workout_page.php";
      }
    });
  }

  getExerciseDuration() {
    if (!this.exercises[0]) return "00";

    if (this.exercises[0].duration) {
      let duration = this.exercises[0].duration;
      if (typeof duration === "string") {
        const match = duration.match(/\d+/);
        duration = match ? parseInt(match[0]) : 0;
      }
      return duration.toString().padStart(2, "0");
    }
    return "00";
  }

  getFirstExerciseName() {
    return this.exercises[0]?.exercise || this.workout?.title || "Workout";
  }

  startCountdown() {
    // Display the countdown overlay
    this.countdownOverlay.style.display = "flex";

    // Announce workout is about to begin
    this.speakText(
      `Get ready for ${this.workout?.title || "your workout"
      }. Starting in 3 seconds.`
    );

    // Preload first exercise video
    if (this.exercises[0] && this.exercises[0].video) {
      const preloadVideo = document.createElement("video");
      preloadVideo.src = this.exercises[0].video;
      preloadVideo.style.display = "none";
      preloadVideo.preload = "auto";
      document.body.appendChild(preloadVideo);
      setTimeout(() => {
        document.body.removeChild(preloadVideo);
      }, 3000);
    }

    // Set initial count
    let currentCount = 10;

    // Start countdown
    this.startCountdownTimer = () => {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
      }

      this.countdownTimer = setInterval(() => {
        currentCount--;
        const countCircle =
          this.countdownOverlay.querySelector(".count-circle");
        if (countCircle) {
          countCircle.textContent = currentCount;
        }

        // Announce the countdown number
        if (currentCount > 0) {
          this.speakText(currentCount.toString());
        }

        if (currentCount <= 0) {
          // Clear timer and hide overlay
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
          this.countdownOverlay.style.display = "none";

          // Announce beginning of workout
          this.speakText("Begin!");

          // Start the actual workout
          this.showCurrentExercise();
          this.startExercise();
        }
      }, 1000);
    };

    // Start the countdown timer
    this.startCountdownTimer();
  }

  clearAllTimers() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.endRestTimeout) {
      clearTimeout(this.endRestTimeout);
      this.endRestTimeout = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  endWorkout() {
    console.log("Ending workout - preparing to navigate to completion page");

    try {
      // Calculate actual duration and calories based on completed exercises
      const workoutDuration = this.totalDuration || 14;
      const workoutCalories = this.totalCalories || 203;
      // Save stats before navigating
      const workoutStats = {
        duration: `${workoutDuration} Minutes`,
        calories: `${workoutCalories} kcal`,
      };
      localStorage.setItem("workoutStats", JSON.stringify(workoutStats));
      console.log("Workout stats saved:", workoutStats);

      console.log("Using workout ID for redirect:", this.workoutId);

      // Stop music when workout ends
      if (this.workoutMusicPlayer) {
        this.workoutMusicPlayer.pause();
      }

      // Announce workout completion
      this.speakText("Congratulations! Workout complete.");

      setTimeout(() => {
        if (typeof pause === "function") {
          pause();
        }
        localStorage.removeItem("currentWorkout");
        console.log("Navigating to completion page...");

        const durationInSeconds = workoutDuration * 60;

        window.location.href = `subworkout_done_page.php?workout_id=${this.workoutId}&duration=${durationInSeconds}&calories=${workoutCalories}`;
      }, 2000);
    } catch (error) {
      console.error("Error ending workout:", error);
      // Fallback navigation in case of error
      alert("Workout complete! Redirecting to completion page.");
      localStorage.removeItem("currentWorkout");
      window.location.href = `subworkout_done_page.php?workout_id=${this.workoutId}`;
    }
  }
}

// Initialize workout manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const workoutManager = new WorkoutManager();
  window.workoutManager = workoutManager;
  workoutManager.init();
});

//.........................................................................................//
// Pose detection algorithm
class WorkoutPoseDetector {
  constructor() {
    this.repCounter = 0;
    this.lastState = null;
    this.keypointHistory = [];
    this.historySize = 10;
    this.exerciseDetectors = {};
    this.currentExercise = null;
    this.poseCorrection = {};
    this.referenceKeypoints = null;
    this.lastFeedback = null;
    this.lastFeedbackTime = 0;
    this.FEEDBACK_INTERVAL = 5000;
    this.lastGeneratedFeedback = null;
    this.exerciseType = null;
    this.poseTimer = null;

    this.createEmptyDetectors();
    this.registerExerciseDetectors();
  }

  createEmptyDetectors() {
    // List all detector method names here
    const detectorNames = [
      // ==================== CARDIO EXERCISES ====================
      // Time-based Cardio
      "detectMarchOnSpot",
      "detectLowImpactHighKnee",
      "detectSideToSideStep",
      "detectTwistReach",
      "detectShuffle",
      "detectIceSki",
      "detectSideStepShuffle",
      "detectSprint",
      "detectJogOnSpot",
      "detectButtKicks",
      "detectHighPunches",
      "detectLateralShuttle",
      "detectBobWeave",

      // Rep-based Cardio/HIIT
      "detectBurpee",
      "detectJumpSquatPunches",
      "detectStepUps",
      "detectPlankJacks",
      "detectKangarooHops",
      "detectIceSkater",
      "detectStepHopOvers",
      "detectWideNarrowJump",
      "detectSquatPunches",
      "detectCrossPunches",
      "detectStraightPunches",
      "detectBurpeeStepUp",
      "detectDeclineClimbers",
      "detectFroggerSquat",
      "detectStepUpsKneeElbow",

      // ================== WEIGHT TRAINING EXERCISES ================
      "detectDumbbellSquat",
      "detectShoulderPress",
      "detectLungePress",
      "detectBicepCurls",
      "detectTricepKickback",
      "detectFrontRaise",
      "detectSingleArmRow",
      "detectUprightRow",
      "detectSumoSquat",
      "detectWalkingLunges",
      "detectDeadlift",
      "detectGobletSquat",
      "detectWoodchop",
      "detectSnatchPress",
      "detectDumbbellSwing",
      "detectOverheadSquat",
      "detectSingleLegDeadlift",
      "detectReverseFly",
      "detectPlankRow",
      "detectYTWings",
      "detectElevatedLunge",
      "detectTricepDips",
      "detectBurpeeDBPress",
      "detectHighPulls",
      "detectLungeTwist",
      "detectHeadCrusher",
      "detectRussianTwist",
      "detectTricepExtension",
      "detectCurlAbductor",
      "detectSquatPress",
      "detectSingleSnatch",
      "detectPullOver",
      "detectFlyBridge",
      "detectOverheadCircles",
      "detectLRotation",
      "detectSideFrontRaise",

      // ============= BODYWEIGHT/WEIGHT-FREE EXERCISES ============
      // Time-based Bodyweight
      "detectPlank",
      "detectHipBridgeHold",
      "detectSuperman",
      "detectFlutterKicks",
      "detectWindshieldWipers",
      "detectSidePlankDips",

      // Rep-based Bodyweight
      "detectPushUp",
      "detectRussianTwistBodyweight",
      "detectLegRaiseThrust",
      "detectChairSquat",
      "detectReverseLunge",
      "detectFireHydrants",
      "detectLungePulse",
      "detectSumoSquatBodyweight",
      "detectCurtsyLunge",
      "detectSquatPulse",
      "detectStandingLegRaise",
      "detectCalfRaises",
      "detectAssistedKickbacks",
      "detectClockLunge",
      "detectHipBridgeCircle",
      "detectKneePushUp",
      "detectWideNarrowPushUp",
      "detectSpidermanPushUp",
      "detectForwardBackLunge",
      "detectBird",
      "detectBurpeePushUp",
      "detectSplitJackKnife",
      "detectSprinterTucks",
      "detectSingleLegBridge",
      "detectAssistedLunge",
      "detectStandingCrunch",

      // ====================== YOGA/STRETCHING ======================
      "detectChildPose",
      "detectDownwardDog",
      "detectButterfly",
      "detectCatCamel",
      "detectSpinalTwist",
      "detectHamstringStretch",
      "detectCobra",
      "detectBridgeStretch",
      "detectNeckStretch",
      "detectShoulderStretch",
      "detectChestStretch",
      "detectArmCircle",
      "detectCrossStretch",
      "detectHugKnees",
      "detectHipFlexor",
      "detectLyingHamstring",
      "detectWristStretch",
    ];

    detectorNames.forEach((method) => {
      if (!this[method]) {
        this[method] = function (pose) {
          console.log(`${method} called but not yet implemented`);
          return { state: null, feedback: null };
        };
      }
    });
  }

  // Initialize with the current exercise
  startExercise(exercise, exerciseType = "reps", referenceKeypoints = null) {
    // Add extra logging
    console.log(
      `Attempting to start exercise: ${exercise}, type: ${exerciseType}`
    );

    this.currentExercise = exercise;
    this.exerciseType = exerciseType; // 'reps' or 'time'
    this.repCounter = 0;
    this.lastState = null;
    this.keypointHistory = [];
    this.poseCorrection = {};
    this.referenceKeypoints = referenceKeypoints;

    // Ensure detectors are registered
    if (Object.keys(this.exerciseDetectors).length === 0) {
      this.registerExerciseDetectors();
    }

    console.log("Registered detectors:", Object.keys(this.exerciseDetectors));
  }

  // Register all exercise detectors
  registerExerciseDetectors() {
    console.log("Registering exercise detectors...");

    // ==================== CARDIO EXERCISES ====================
    // Time-based Cardio
    this.registerDetector("March On The Spot", this.detectMarchOnSpot); // Time
    this.registerDetector("Low Impact High Knee", this.detectLowImpactHighKnee); // Time
    this.registerDetector("Side to Side Step", this.detectSideToSideStep); // Time
    this.registerDetector("Twist & Reach", this.detectTwistReach); // Time
    this.registerDetector("Shuffle Forward and Backward", this.detectShuffle); // Time
    this.registerDetector("Ice Ski", this.detectIceSki); // Time
    this.registerDetector("Side Step Shuffle", this.detectSideStepShuffle); // Time
    this.registerDetector("Sprint", this.detectSprint); // Time
    this.registerDetector("Jog On The Spot", this.detectJogOnSpot); // Time
    this.registerDetector("Butt Kicks", this.detectButtKicks); // Time
    this.registerDetector("High Punches", this.detectHighPunches); // Time
    this.registerDetector("Lateral Shuttle Steps", this.detectLateralShuttle); // Time
    this.registerDetector("Bob Weave Circle", this.detectBobWeave); // Time

    // Rep-based Cardio/HIIT
    this.registerDetector("Burpee", this.detectBurpee); // Reps
    this.registerDetector(
      "Jump Squat With Punches",
      this.detectJumpSquatPunches
    ); // Reps
    this.registerDetector("Step-Ups", this.detectStepUps); // Reps
    this.registerDetector("Plank Jacks", this.detectPlankJacks); // Reps
    this.registerDetector("Kangaroo Hops", this.detectKangarooHops); // Reps
    this.registerDetector("Ice Skater", this.detectIceSkater); // Reps
    this.registerDetector("Step Hop Overs", this.detectStepHopOvers); // RepsSS
    this.registerDetector(
      "Wide to Narrow Step Jump",
      this.detectWideNarrowJump
    ); // Reps
    this.registerDetector("Squat With Punches", this.detectSquatPunches); // Reps
    this.registerDetector("Cross High Punches", this.detectCrossPunches); // Reps
    this.registerDetector("Straight Punches", this.detectStraightPunches); // Reps
    this.registerDetector("Burpee Step-Up", this.detectBurpeeStepUp); // Reps
    this.registerDetector(
      "Decline Mountain Climbers",
      this.detectDeclineClimbers
    ); // Reps
    this.registerDetector("Frogger To Squat", this.detectFroggerSquat); // Reps
    this.registerDetector(
      "Step-Ups With Knee To Elbow",
      this.detectStepUpsKneeElbow
    ); // Reps

    // ================== WEIGHT TRAINING EXERCISES ================
    // Rep-based Weighted
    this.registerDetector("Dumbbell Squat", this.detectDumbbellSquat); // Reps
    this.registerDetector("Shoulder Press", this.detectShoulderPress); // Reps
    this.registerDetector(
      "Reverse Lunge to Shoulder Press",
      this.detectLungePress
    ); // Reps
    this.registerDetector("Bicep Curls", this.detectBicepCurls); // Reps
    this.registerDetector("Tricep Kickback", this.detectTricepKickback); // Reps
    this.registerDetector("Front Raise", this.detectFrontRaise); // Reps
    this.registerDetector("Single Arm Dumbbell Row", this.detectSingleArmRow); // Reps
    this.registerDetector("Upright Dumbbell Row", this.detectUprightRow); // Reps
    this.registerDetector("Dumbbell Sumo Squat", this.detectSumoSquat); // Reps
    this.registerDetector("Walking Lunges", this.detectWalkingLunges); // Reps
    this.registerDetector("Deadlift", this.detectDeadlift); // Reps
    this.registerDetector("Goblet Squat", this.detectGobletSquat); // Reps
    this.registerDetector("Woodchop", this.detectWoodchop); // Reps
    this.registerDetector("Snatch to Shoulder Press", this.detectSnatchPress); // Reps
    this.registerDetector("Dumbbell Swing", this.detectDumbbellSwing); // Reps
    this.registerDetector("Overhead Squat", this.detectOverheadSquat); // Reps
    this.registerDetector("Single Leg Deadlift", this.detectSingleLegDeadlift); // Reps
    this.registerDetector("Reverse Fly", this.detectReverseFly); // Reps
    this.registerDetector("Plank Row", this.detectPlankRow); // Reps
    this.registerDetector("Y to T Raises", this.detectYTWings); // Reps
    this.registerDetector("Alternate Elevated Lunge", this.detectElevatedLunge); // Reps
    this.registerDetector("Tricep Dips", this.detectTricepDips); // Reps
    this.registerDetector(
      "Burpees with Dumbbell Press",
      this.detectBurpeeDBPress
    ); // Reps
    this.registerDetector("Dumbbells High Pulls", this.detectHighPulls); // Reps
    this.registerDetector("Alternate Lunge & Twist", this.detectLungeTwist); // Reps
    this.registerDetector("Head Crusher", this.detectHeadCrusher); // Reps
    this.registerDetector("Russian Twist (Dumbbell)", this.detectRussianTwist); // Reps
    this.registerDetector("Tricep Extension", this.detectTricepExtension); // Reps
    this.registerDetector(
      "Bicep Curls to Outward Abductor",
      this.detectCurlAbductor
    ); // Reps
    this.registerDetector("Squat to Shoulder Press", this.detectSquatPress); // Reps
    this.registerDetector(
      "Single Arm Snatch to Shoulder Press",
      this.detectSingleSnatch
    ); // Reps
    this.registerDetector("Pull Over", this.detectPullOver); // Reps
    this.registerDetector("Fly Hip Bridge", this.detectFlyBridge); // Reps
    this.registerDetector("Overhead Arm Circle", this.detectOverheadCircles); // Reps
    this.registerDetector("L Rotation", this.detectLRotation); // Reps
    this.registerDetector("Side to Front Raise", this.detectSideFrontRaise); // Reps

    // ============= BODYWEIGHT/WEIGHT-FREE EXERCISES ============
    // Time-based Bodyweight
    this.registerDetector("Plank", this.detectPlank); // Time
    this.registerDetector("Hip Bridge Hold", this.detectHipBridgeHold); // Time
    this.registerDetector("Superman", this.detectSuperman); // Time
    this.registerDetector("Flutter Kicks", this.detectFlutterKicks); // Time
    this.registerDetector(
      "Windshield Wiper with Leg Extension",
      this.detectWindshieldWipers
    ); // Time
    this.registerDetector("Side Plank Hip Dips", this.detectSidePlankDips); // Time

    // Rep-based Bodyweight
    this.registerDetector("Push-Up", this.detectPushUp); // Reps
    this.registerDetector("Russian Twist", this.detectRussianTwistBodyweight); // Reps
    this.registerDetector(
      "Leg Raise with Hip Thrust",
      this.detectLegRaiseThrust
    ); // Reps
    this.registerDetector("Chair Squat", this.detectChairSquat); // Reps
    this.registerDetector("Reverse Lunge", this.detectReverseLunge); // Reps
    this.registerDetector("Fire Hydrants", this.detectFireHydrants); // Reps
    this.registerDetector("Lunge Pulse", this.detectLungePulse); // Reps
    this.registerDetector("Sumo Squat", this.detectSumoSquatBodyweight); // Reps
    this.registerDetector("Curtsy Lunge", this.detectCurtsyLunge); // Reps
    this.registerDetector("Squat Pulse", this.detectSquatPulse); // Reps
    this.registerDetector(
      "Standing Side Leg Raise",
      this.detectStandingLegRaise
    ); // Reps
    this.registerDetector("Calf Raises", this.detectCalfRaises); // Reps
    this.registerDetector(
      "Assisted Standing Kickbacks",
      this.detectAssistedKickbacks
    ); // Reps
    this.registerDetector("Clock Lunge", this.detectClockLunge); // Reps
    this.registerDetector("Hip Bridge Circle", this.detectHipBridgeCircle); // Reps
    this.registerDetector("Knee Push-Up", this.detectKneePushUp); // Reps
    this.registerDetector(
      "Wide To Narrow Push-Up",
      this.detectWideNarrowPushUp
    ); // Reps
    this.registerDetector("Spiderman Push-Up", this.detectSpidermanPushUp); // Reps
    this.registerDetector("Forward To Back Lunge", this.detectForwardBackLunge); // Reps
    this.registerDetector("The Bird", this.detectBird); // Reps
    this.registerDetector("Burpee to Push-Up", this.detectBurpeePushUp); // Reps
    this.registerDetector("Split Jack Knife", this.detectSplitJackKnife); // Reps
    this.registerDetector(
      "Sprinter Alternate Knee Tucks",
      this.detectSprinterTucks
    ); // Reps
    this.registerDetector("Single Leg Hip Bridge", this.detectSingleLegBridge); // Reps
    this.registerDetector("Assisted Lunge", this.detectAssistedLunge); // Reps
    this.registerDetector("Standing Side Crunch", this.detectStandingCrunch); // Reps

    // ====================== YOGA/STRETCHING ======================
    // Time-based Yoga
    this.registerDetector("Child Pose", this.detectChildPose); // Time
    this.registerDetector("Downward Facing Dog", this.detectDownwardDog); // Time
    this.registerDetector("Butterfly Stretch", this.detectButterfly); // Time
    this.registerDetector("Cat and Camel", this.detectCatCamel); // Time
    this.registerDetector("Lying Spinal Twist", this.detectSpinalTwist); // Time
    this.registerDetector(
      "Standing Hamstring Stretch",
      this.detectHamstringStretch
    ); // Time
    this.registerDetector("Cobra", this.detectCobra); // Time
    this.registerDetector("Bridge Stretch", this.detectBridgeStretch); // Time
    this.registerDetector("Neck Stretches", this.detectNeckStretch); // Time
    this.registerDetector("Shoulder Stretch", this.detectShoulderStretch); // Time
    this.registerDetector("Chest Stretch", this.detectChestStretch); // Time
    this.registerDetector("Arm Circle", this.detectArmCircle); // Time
    this.registerDetector("Alternate Cross Stretch", this.detectCrossStretch); // Time
    this.registerDetector("Hug Knees to Chest", this.detectHugKnees); // Time
    this.registerDetector("Hip Flexor Reach", this.detectHipFlexor); // Time
    this.registerDetector("Lying Hamstring Stretch", this.detectLyingHamstring); // Time
    this.registerDetector("Wrist Stretch", this.detectWristStretch); // Time

    console.log(
      `Total registered exercises: ${Object.keys(this.exerciseDetectors).length
      }`
    );
  }

  // Register a specific detector function for an exercise
  registerDetector(exerciseName, detectorFunction) {
    this.exerciseDetectors[exerciseName] = detectorFunction.bind(this);
  }

  analyzePose(keypoints) {
    if (!this.currentExercise) {
      console.warn(
        "No exercise selected. Current exercises:",
        Object.keys(this.exerciseDetectors)
      );
      return {
        repCount: 0,
        feedback:
          "Waiting for exercise selection. Available exercises: " +
          Object.keys(this.exerciseDetectors).join(", "),
        isCorrect: false,
      };
    }

    if (!this.exerciseDetectors[this.currentExercise]) {
      console.warn(`Exercise configuration pending: ${this.currentExercise}`);
      return {
        repCount: 0,
        feedback: "Exercise configuration in progress...",
        isCorrect: false,
      };
    }

    this.updateKeypointHistory(keypoints);

    const correctnessScore = this.checkPoseCorrectness(keypoints);

    const result = this.exerciseDetectors[this.currentExercise](keypoints);

    if (this.exerciseType === "time") {
      result.repCount = null;
    }

    result.isCorrect = correctnessScore > 0.7;

    const currentTime = Date.now();
    const timeSinceLastFeedback = currentTime - this.lastFeedbackTime;

    if (
      !result.isCorrect &&
      (!result.feedback ||
        result.feedback === "No data" ||
        result.feedback === "")
    ) {
      if (timeSinceLastFeedback >= this.FEEDBACK_INTERVAL) {
        const correctionFeedback = this.generatePoseCorrectionFeedback();
        if (correctionFeedback && correctionFeedback !== "Good form!") {
          result.feedback = correctionFeedback;
          this.lastFeedbackTime = currentTime;
          this.lastGeneratedFeedback = result.feedback;
        }
      }
    }

    return result;
  }

  updateKeypointHistory(keypoints) {
    this.keypointHistory.push(keypoints);
    if (this.keypointHistory.length > this.historySize) {
      this.keypointHistory.shift();
    }
  }

  getSmoothedKeypoints() {
    if (this.keypointHistory.length === 0) return null;

    const smoothed = JSON.parse(
      JSON.stringify(this.keypointHistory[this.keypointHistory.length - 1])
    );

    for (let i = 0; i < smoothed.length; i++) {
      let sumX = 0,
        sumY = 0,
        sumConfidence = 0;
      let count = 0;

      for (const historicalKeypoints of this.keypointHistory) {
        if (historicalKeypoints[i]) {
          sumX += historicalKeypoints[i].x;
          sumY += historicalKeypoints[i].y;
          sumConfidence += historicalKeypoints[i].confidence || 0;
          count++;
        }
      }

      if (count > 0) {
        smoothed[i].x = sumX / count;
        smoothed[i].y = sumY / count;
        smoothed[i].confidence = sumConfidence / count;
      }
    }

    return smoothed;
  }

  checkPoseCorrectness(keypoints) {
    if (!this.referenceKeypoints) return 1.0;

    let totalSimilarity = 0;
    let keypointCount = 0;

    // Get relevant keypoints for the current exercise
    const relevantKeypoints = this.getRelevantKeypointsForExercise();

    for (const keypointName of relevantKeypoints) {
      const userKeypoint = getKeypointByName(keypoints, keypointName);
      const refKeypoint = getKeypointByName(
        this.referenceKeypoints,
        keypointName
      );

      if (userKeypoint && refKeypoint) {
        const similarity = this.calculateKeypointSimilarity(
          userKeypoint,
          refKeypoint
        );
        totalSimilarity += similarity;
        keypointCount++;

        if (similarity < 0.6) {
          this.poseCorrection[keypointName] = {
            current: userKeypoint,
            reference: refKeypoint,
            similarity: similarity,
          };
        } else {
          delete this.poseCorrection[keypointName];
        }
      }
    }

    return keypointCount > 0 ? totalSimilarity / keypointCount : 1.0;
  }

  calculateKeypointSimilarity(kp1, kp2) {
    const distance = calculateDistance(kp1, kp2);
    return Math.max(0, 1 - distance / 100);
  }

  generatePoseCorrectionFeedback() {
    if (Object.keys(this.poseCorrection).length === 0) {
      return "Good form!";
    }

    let worstKeypoint = null;
    let worstSimilarity = 1.0;

    for (const [keypoint, correction] of Object.entries(this.poseCorrection)) {
      if (correction.similarity < worstSimilarity) {
        worstSimilarity = correction.similarity;
        worstKeypoint = keypoint;
      }
    }

    if (!worstKeypoint) return "Good form!";

    const correction = this.poseCorrection[worstKeypoint];
    const keypointDisplayName = worstKeypoint.replace("_", " ");

    const xDiff = correction.reference.x - correction.current.x;
    const yDiff = correction.reference.y - correction.current.y;

    let direction = "";
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      direction = xDiff > 0 ? "more to the right" : "more to the left";
    } else {
      direction = yDiff > 0 ? "higher" : "lower";
    }

    return `Position your ${keypointDisplayName} ${direction}`;
  }

  getRelevantKeypointsForExercise() {
    switch (this.currentExercise) {
      case "Squats":
        return [
          "left_hip",
          "right_hip",
          "left_knee",
          "right_knee",
          "left_ankle",
          "right_ankle",
        ];
      case "Push Ups":
        return [
          "left_shoulder",
          "right_shoulder",
          "left_elbow",
          "right_elbow",
          "left_wrist",
          "right_wrist",
        ];
      case "Jumping Jacks":
        return [
          "left_shoulder",
          "right_shoulder",
          "left_wrist",
          "right_wrist",
          "left_ankle",
          "right_ankle",
        ];
      case "March On The Spot":
        return [
          "left_hip",
          "right_hip",
          "left_knee",
          "right_knee",
          "left_ankle",
          "right_ankle",
        ];
      // Add more exercise-specific keypoints as needed
      default:
        return [
          "nose",
          "left_shoulder",
          "right_shoulder",
          "left_hip",
          "right_hip",
          "left_knee",
          "right_knee",
          "left_ankle",
          "right_ankle",
        ];
    }
  }

  /* Exercise-specific detection methods */
  //------------------------------------------------------------------------------
  // ================== OTEHRS/BASIC EXERCISES ================
  //------------------------------------------------------------------------------

  detectSquat(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (!leftHip || !rightHip)
      return { repCount: this.repCounter, feedback: "Cannot track hips" };

    const hipsY = (leftHip.y + rightHip.y) / 2;

    const min = 0.6,
      max = 0.9;
    const normalizedY = (hipsY - min) / (max - min);

    let feedback = "";

    if (normalizedY < 0.3 && this.lastState !== "down") {
      this.repCounter++;
      this.lastState = "down";
      feedback = "Great squat!";
    } else if (normalizedY > 0.7 && this.lastState === "down") {
      this.lastState = "up";
      feedback = "Ready for next rep";
    } else if (this.lastState === "down") {
      feedback = "Push up to standing";
    } else if (normalizedY > 0.4 && normalizedY < 0.6) {
      feedback = "Lower into squat";
    }

    return { repCount: this.repCounter, feedback };
  }

  //------------------------------------------------------------------------------
  // ================== CARDIO EXERCISES ================
  //------------------------------------------------------------------------------
  // Cardio
  detectJumpingJack(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const handSpread = Math.abs(leftWrist.x - rightWrist.x);
    const normalizedSpread = handSpread / shoulderWidth;

    let feedback = "";

    if (normalizedSpread > 2.5 && this.lastState !== "open") {
      this.repCounter++;
      this.lastState = "open";
      feedback = "Good jumping jack!";
    } else if (normalizedSpread < 1.2 && this.lastState === "open") {
      this.lastState = "closed";
      feedback = "Ready for next rep";
    } else if (this.lastState === "open") {
      feedback = "Bring arms down";
    } else if (normalizedSpread < 1.5) {
      feedback = "Raise arms overhead";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectMarchOnSpot(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return {
        repCount: this.repCounter,
        feedback: "No data",
        feedbackType: "error",
      };

    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    // Error case: missing critical keypoints
    if (!leftKnee || !rightKnee || !leftHip || !rightHip) {
      console.log("March error: Missing keypoints");
      return {
        repCount: this.repCounter,
        feedback: "Cannot track legs",
        feedbackType: "error",
      };
    }

    // Calculate the height of knees relative to hips
    const leftKneeHeight = leftHip.y - leftKnee.y;
    const rightKneeHeight = rightHip.y - rightKnee.y;

    // Track the highest knee
    const highestKneeHeight = Math.max(leftKneeHeight, rightKneeHeight);

    // Normalize based on hip position (higher value means knee is higher)
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    const normalizedHeight = highestKneeHeight / hipWidth;

    // Log the calculations for debugging
    console.log("March calculations:", {
      leftKneeHeight,
      rightKneeHeight,
      hipWidth,
      normalizedHeight,
      currentState: this.lastState,
      threshold: {
        high: 0.5,
        low: 0.2,
      },
    });

    let feedback = "";
    let feedbackType = "info";

    // Track which knee is active
    if (!this.lastActiveKnee) {
      this.lastActiveKnee = null;
    }

    // Tracking variables
    if (!this.feedbackCooldown) {
      this.feedbackCooldown = 0;
    }

    // Reduce feedback frequency - only show feedback every few frames
    if (this.feedbackCooldown > 0) {
      this.feedbackCooldown--;
      return { repCount: this.repCounter, feedback: "", feedbackType: "info" };
    }

    // A high knee followed by a low knee counts as one rep
    if (normalizedHeight > 0.5 && this.lastState !== "high") {
      this.lastState = "high";
      // Only count rep when a different knee goes up
      const activeKnee = leftKneeHeight > rightKneeHeight ? "left" : "right";

      if (
        (activeKnee === "left" && this.lastActiveKnee === "right") ||
        (activeKnee === "right" && this.lastActiveKnee === "left") ||
        this.lastActiveKnee === null
      ) {
        this.repCounter++;
        feedback = "Good march!";
        feedbackType = "success";
        this.lastActiveKnee = activeKnee;

        // Log successful rep
        console.log("March rep counted:", {
          newCount: this.repCounter,
          activeKnee,
          normalizedHeight,
        });
      }
    } else if (normalizedHeight < 0.2 && this.lastState === "high") {
      this.lastState = "low";
      // Don't show any feedback when returning to low position
      feedback = "";
      feedbackType = "info";
    } else if (this.lastState === "high" && this.feedbackCooldown === 0) {
      // Only show this feedback occasionally
      feedback = "Lower your foot";
      feedbackType = "info";
      this.feedbackCooldown = 30; // Skip feedback for next 30 frames
    } else if (
      normalizedHeight < 0.3 &&
      this.lastState === "low" &&
      this.feedbackCooldown === 0
    ) {
      // Only show this feedback if the user has been in the low state for a while
      if (!this.lowStateCounter) this.lowStateCounter = 0;
      this.lowStateCounter++;

      // Only give "lift higher" feedback after being low for a while
      if (this.lowStateCounter > 60) {
        // About 2 seconds at 30fps
        feedback = "Lift your knee higher";
        feedbackType = "info";
        this.feedbackCooldown = 45; // Show this feedback less frequently
        this.lowStateCounter = 0;
      } else {
        feedback = "";
      }
    } else {
      // Default - no feedback when form is good
      feedback = "";
    }

    // Only show feedback in UI if there's actual feedback
    if (feedback) {
      showFormFeedback([feedback], feedbackType);

      // Log when feedback is shown
      console.log("March feedback shown:", {
        feedback,
        feedbackType,
        normalizedHeight,
        state: this.lastState,
      });
    }

    return { repCount: this.repCounter, feedback, feedbackType };
  }

  detectSideToSideStep(keypoints) {
    // Implementation similar to March On The Spot but tracking lateral movement
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
      return { repCount: this.repCounter, feedback: "Cannot track feet" };
    }

    // Calculate hip center
    const hipCenterX = (leftHip.x + rightHip.x) / 2;

    // Calculate average ankle position
    const ankleAvgX = (leftAnkle.x + rightAnkle.x) / 2;

    // Calculate distance from hip center to ankle average
    const lateralDistance = Math.abs(hipCenterX - ankleAvgX);

    // Normalize by hip width
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    const normalizedDistance = lateralDistance / hipWidth;

    let feedback = "";

    // State machine for side to side movement
    if (normalizedDistance > 0.4 && this.lastState !== "side") {
      // Check if we've switched sides from the last rep
      const currentSide = ankleAvgX < hipCenterX ? "left" : "right";

      if (currentSide !== this.lastSide) {
        this.repCounter++;
        feedback = "Good side step!";
        this.lastSide = currentSide;
      }

      this.lastState = "side";
    } else if (normalizedDistance < 0.1 && this.lastState === "side") {
      this.lastState = "center";
      feedback = "Ready for next step";
    } else if (this.lastState === "side") {
      feedback = "Return to center";
    } else if (normalizedDistance < 0.2) {
      feedback = "Step wider to the side";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectLowImpactHighKnee(keypoints) {
    // Get smoothed keypoint data for better detection
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // Extract knee and hip positions
    const leftHip = smoothedKeypoints.find((kp) => kp.name === "leftHip");
    const rightHip = smoothedKeypoints.find((kp) => kp.name === "rightHip");
    const leftKnee = smoothedKeypoints.find((kp) => kp.name === "leftKnee");
    const rightKnee = smoothedKeypoints.find((kp) => kp.name === "rightKnee");

    if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
      return {
        repCount: this.repCounter,
        feedback: "Can't track knees and hips",
      };
    }

    // Calculate midpoint between the hips
    const hipMidpointY = (leftHip.y + rightHip.y) / 2;

    // Check knee height relative to hips
    const leftKneeHeightRatio = (hipMidpointY - leftKnee.y) / this.torsoLength;
    const rightKneeHeightRatio =
      (hipMidpointY - rightKnee.y) / this.torsoLength;

    // Track knee positions for movement detection
    this.updateKneePositionsHistory(leftKnee, rightKnee);

    // Detect alternating knee movement
    const isAlternating = this.detectAlternatingKneeMovement();

    // Define high knee threshold (knees should rise to at least 50% of torso length)
    const HIGH_KNEE_THRESHOLD = 0.5;

    // Check if either knee is raised high enough
    const leftKneeHigh = leftKneeHeightRatio > HIGH_KNEE_THRESHOLD;
    const rightKneeHigh = rightKneeHeightRatio > HIGH_KNEE_THRESHOLD;

    // Detect motion and increment rep count if appropriate
    if (this.detectKneeRepCompletion(leftKneeHigh, rightKneeHigh)) {
      this.repCounter++;
    }

    // Generate appropriate feedback
    let feedback = "Good form";

    if (!leftKneeHigh && !rightKneeHigh) {
      feedback = "Lift your knees much higher, aim for waist level";
    } else if (!isAlternating) {
      feedback = "Alternate legs for proper high knees";
    } else if (this.detectSlowPace()) {
      feedback = "Increase your pace for effective high knees";
    }

    return {
      repCount: this.repCounter,
      feedback: feedback,
      metrics: {
        leftKneeHeight: leftKneeHeightRatio.toFixed(2),
        rightKneeHeight: rightKneeHeightRatio.toFixed(2),
        pace: this.currentPace,
        isAlternating: isAlternating,
      },
    };
  }

  detectBobWeave() {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return {
        repCount: this.repCounter,
        feedback: "No data",
        feedbackType: "error",
      };

    const nose = getKeypointByName(smoothedKeypoints, "nose");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    // Error case: missing critical keypoints
    if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      console.log("Bob & Weave error: Missing keypoints");
      return {
        repCount: this.repCounter,
        feedback: "Cannot track upper body",
        feedbackType: "error",
      };
    }

    // Calculate the midpoint between shoulders
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    // Calculate the midpoint between hips
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;

    // Calculate horizontal position of nose relative to shoulder midpoint
    const horizontalOffset = nose.x - shoulderMidX;

    // Calculate vertical position of nose relative to shoulder
    const verticalPosition = nose.y - shoulderMidY;

    // Normalize based on torso length (distance between shoulder and hip midpoints)
    const torsoLength = Math.sqrt(
      Math.pow(shoulderMidX - hipMidX, 2) + Math.pow(shoulderMidY - hipMidY, 2)
    );
    const normalizedHorizontalOffset = horizontalOffset / torsoLength;
    const normalizedVerticalPosition = verticalPosition / torsoLength;

    // Log the calculations for debugging
    console.log("Bob & Weave calculations:", {
      normalizedHorizontalOffset,
      normalizedVerticalPosition,
      currentState: this.lastState,
      threshold: {
        left: -0.3,
        right: 0.3,
        center: 0.1,
        duck: 0.15,
      },
    });

    let feedback = "";
    let feedbackType = "info";

    // Tracking variables
    if (!this.feedbackCooldown) {
      this.feedbackCooldown = 0;
    }

    // Track the bob and weave pattern
    if (!this.weaveDirection) {
      this.weaveDirection = "center"; // center, left, right
    }

    if (!this.bobPosition) {
      this.bobPosition = "up"; // up, down
    }

    // Reduce feedback frequency
    if (this.feedbackCooldown > 0) {
      this.feedbackCooldown--;
      return { repCount: this.repCounter, feedback: "", feedbackType: "info" };
    }

    // Detect weaving (side to side movement)
    if (normalizedHorizontalOffset < -0.3 && this.weaveDirection !== "left") {
      this.weaveDirection = "left";
      console.log("Weave left detected");
    } else if (
      normalizedHorizontalOffset > 0.3 &&
      this.weaveDirection !== "right"
    ) {
      this.weaveDirection = "right";
      console.log("Weave right detected");
    } else if (
      Math.abs(normalizedHorizontalOffset) < 0.1 &&
      (this.weaveDirection === "left" || this.weaveDirection === "right")
    ) {
      // Coming back to center from either left or right
      console.log("Returned to center from " + this.weaveDirection);

      if (
        this.lastCompleteWeave &&
        this.lastCompleteWeave !== this.weaveDirection
      ) {
        // We've completed a full weave pattern (left->center->right or right->center->left)
        console.log("Full weave pattern completed");
        feedback = "Good weaving!";
        feedbackType = "success";
      }

      this.lastCompleteWeave = this.weaveDirection;
      this.weaveDirection = "center";
    }

    // Detect bobbing (up and down movement)
    if (normalizedVerticalPosition > 0.15 && this.bobPosition !== "down") {
      this.bobPosition = "down";
      console.log("Bob down detected");

      // Count a rep when we bob down with proper weaving
      if (this.weaveDirection !== "center") {
        this.repCounter++;
        feedback = "Good bob & weave!";
        feedbackType = "success";

        // Log successful rep
        console.log("Bob & Weave rep counted:", {
          newCount: this.repCounter,
          bobPosition: "down",
          weaveDirection: this.weaveDirection,
        });
      }
    } else if (normalizedVerticalPosition < 0 && this.bobPosition === "down") {
      this.bobPosition = "up";
      console.log("Returned to up position");
    }

    // Add form feedback
    if (this.feedbackCooldown === 0) {
      if (
        this.weaveDirection === "center" &&
        this.bobPosition === "up" &&
        !this.lastCompleteWeave &&
        this.repCounter === 0
      ) {
        feedback = "Weave side to side while bobbing down";
        feedbackType = "info";
        this.feedbackCooldown = 45;
      } else if (
        Math.abs(normalizedHorizontalOffset) < 0.2 &&
        this.weaveDirection !== "center"
      ) {
        feedback = "Weave further to the sides";
        feedbackType = "info";
        this.feedbackCooldown = 30;
      } else if (
        normalizedVerticalPosition < 0.1 &&
        this.bobPosition === "down"
      ) {
        feedback = "Bob down lower";
        feedbackType = "info";
        this.feedbackCooldown = 30;
      }
    }

    // Show feedback in UI if needed
    if (feedback) {
      showFormFeedback([feedback], feedbackType);

      // Log when feedback is shown
      console.log("Bob & Weave feedback shown:", {
        feedback,
        feedbackType,
        normalizedHorizontalOffset,
        normalizedVerticalPosition,
        weaveDirection: this.weaveDirection,
        bobPosition: this.bobPosition,
      });
    }

    return { repCount: this.repCounter, feedback, feedbackType };
  }

  detectKangarooHops() {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return {
        repCount: this.repCounter,
        feedback: "No data",
        feedbackType: "error",
      };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    // Error case: missing critical keypoints
    if (
      !leftAnkle ||
      !rightAnkle ||
      !leftKnee ||
      !rightKnee ||
      !leftHip ||
      !rightHip
    ) {
      console.log("Kangaroo Hops error: Missing keypoints");
      return {
        repCount: this.repCounter,
        feedback: "Cannot track legs",
        feedbackType: "error",
      };
    }

    // Calculate the average Y position of ankles and knees
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
    const kneeY = (leftKnee.y + rightKnee.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;

    // Calculate the leg extension (smaller value means more bent legs/squat position)
    const legExtension = (ankleY - kneeY) / (ankleY - hipY);

    // Calculate the ground impact based on vertical velocity of the ankles
    if (!this.prevAnkleY) {
      this.prevAnkleY = ankleY;
    }
    const verticalVelocity = ankleY - this.prevAnkleY;
    this.prevAnkleY = ankleY;

    // Store velocity samples for detecting landing impact
    if (!this.velocitySamples) {
      this.velocitySamples = [];
    }
    this.velocitySamples.push(verticalVelocity);
    if (this.velocitySamples.length > 5) {
      this.velocitySamples.shift();
    }

    // Calculate average velocity
    const avgVelocity =
      this.velocitySamples.reduce((sum, val) => sum + val, 0) /
      this.velocitySamples.length;

    // Log the calculations for debugging
    console.log("Kangaroo Hops calculations:", {
      legExtension,
      verticalVelocity,
      avgVelocity,
      currentState: this.lastState,
      threshold: {
        squat: 0.5,
        jump: -0.025,
        land: 0.025,
      },
    });

    let feedback = "";
    let feedbackType = "info";

    // Tracking variables
    if (!this.feedbackCooldown) {
      this.feedbackCooldown = 0;
    }

    // Reduce feedback frequency
    if (this.feedbackCooldown > 0) {
      this.feedbackCooldown--;
      return { repCount: this.repCounter, feedback: "", feedbackType: "info" };
    }

    // Track kangaroo hop states: 'squat', 'jumping', 'airborne', 'landing'
    if (!this.lastState) {
      this.lastState = "standing";
    }

    // Detect the hop phases
    if (legExtension < 0.5 && this.lastState !== "squat") {
      // Entering squat position
      this.lastState = "squat";
      feedback = "Good prep!";
      feedbackType = "info";
    } else if (avgVelocity < -0.025 && this.lastState === "squat") {
      // Jumping upward from squat
      this.lastState = "jumping";
      feedback = "";
    } else if (
      avgVelocity > -0.01 &&
      avgVelocity < 0.01 &&
      this.lastState === "jumping"
    ) {
      // At peak of jump (low velocity)
      this.lastState = "airborne";
      feedback = "Good height!";
      feedbackType = "success";
    } else if (avgVelocity > 0.025 && this.lastState === "airborne") {
      // Landing from jump
      this.lastState = "landing";
      this.repCounter++;
      feedback = "Good hop!";
      feedbackType = "success";

      // Log successful rep
      console.log("Kangaroo Hop rep counted:", {
        newCount: this.repCounter,
        legExtension,
        avgVelocity,
      });
    } else if (legExtension >= 0.7 && this.lastState === "landing") {
      // Back to standing position
      this.lastState = "standing";
      feedback = "";
    }

    // Add form feedback
    if (this.feedbackCooldown === 0) {
      if (this.lastState === "standing" && this.repCounter === 0) {
        feedback = "Squat down then jump like a kangaroo";
        feedbackType = "info";
        this.feedbackCooldown = 45;
      } else if (this.lastState === "squat" && legExtension > 0.4) {
        feedback = "Squat lower before jumping";
        feedbackType = "info";
        this.feedbackCooldown = 30;
      } else if (
        this.lastState === "standing" &&
        this.consecutiveStandingFrames > 60
      ) {
        feedback = "Start your next kangaroo hop";
        feedbackType = "info";
        this.feedbackCooldown = 45;
        this.consecutiveStandingFrames = 0;
      }
    }

    // Count consecutive standing frames
    if (this.lastState === "standing") {
      if (!this.consecutiveStandingFrames) this.consecutiveStandingFrames = 0;
      this.consecutiveStandingFrames++;
    } else {
      this.consecutiveStandingFrames = 0;
    }

    // Show feedback in UI if needed
    if (feedback) {
      showFormFeedback([feedback], feedbackType);

      // Log when feedback is shown
      console.log("Kangaroo Hops feedback shown:", {
        feedback,
        feedbackType,
        legExtension,
        avgVelocity,
        state: this.lastState,
      });
    }

    return { repCount: this.repCounter, feedback, feedbackType };
  }

  detectFroggerSquat() {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return {
        repCount: this.repCounter,
        feedback: "No data",
        feedbackType: "error",
      };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    // Error case: missing critical keypoints
    if (
      !leftAnkle ||
      !rightAnkle ||
      !leftKnee ||
      !rightKnee ||
      !leftHip ||
      !rightHip ||
      !leftShoulder ||
      !rightShoulder
    ) {
      console.log("Frogger Squat error: Missing keypoints");
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body",
        feedbackType: "error",
      };
    }

    // Calculate hip position relative to ankles and knees
    const hipY = (leftHip.y + rightHip.y) / 2;
    const kneeY = (leftKnee.y + rightKnee.y) / 2;
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

    // Calculate knee width relative to hip width
    const hipWidth = Math.abs(rightHip.x - leftHip.x);
    const kneeWidth = Math.abs(rightKnee.x - leftKnee.x);
    const kneeWidthRatio = kneeWidth / hipWidth;

    // Calculate squat depth and forward lean
    const squatDepth = (hipY - kneeY) / (ankleY - kneeY);

    // Calculate upper body position (higher values = more forward lean)
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const torsoAngle = (hipY - shoulderY) / hipWidth;

    // Log the calculations for debugging
    console.log("Frogger Squat calculations:", {
      squatDepth,
      kneeWidthRatio,
      torsoAngle,
      currentState: this.lastState,
      threshold: {
        squatDown: 0.8,
        standUp: 0.3,
        wideKnee: 1.5,
      },
    });

    let feedback = "";
    let feedbackType = "info";

    // Tracking variables
    if (!this.feedbackCooldown) {
      this.feedbackCooldown = 0;
    }

    // Reduce feedback frequency
    if (this.feedbackCooldown > 0) {
      this.feedbackCooldown--;
      return { repCount: this.repCounter, feedback: "", feedbackType: "info" };
    }

    // Track frogger squat states: 'standing', 'squatting'
    if (!this.lastState) {
      this.lastState = "standing";
    }

    // Detect the squat phases
    if (squatDepth > 0.8 && this.lastState === "standing") {
      // Moving to squat position
      this.lastState = "squatting";

      // Only count as a rep if knees are wide enough (frogger position)
      if (kneeWidthRatio > 1.5) {
        feedback = "Good frogger position!";
        feedbackType = "success";
      } else {
        feedback = "Spread knees wider like a frog";
        feedbackType = "info";
      }
    } else if (squatDepth < 0.3 && this.lastState === "squatting") {
      // Standing back up
      this.lastState = "standing";

      // Count the rep when returning to standing position
      if (kneeWidthRatio > 1.5 || this.wasWideEnough) {
        this.repCounter++;
        feedback = "Good frogger squat!";
        feedbackType = "success";

        // Log successful rep
        console.log("Frogger Squat rep counted:", {
          newCount: this.repCounter,
          squatDepth,
          kneeWidthRatio,
        });

        this.wasWideEnough = false;
      }
    } else if (this.lastState === "squatting" && kneeWidthRatio > 1.5) {
      // Mark that the squat was wide enough at some point
      this.wasWideEnough = true;
    }

    // Add form feedback
    if (this.feedbackCooldown === 0) {
      if (
        this.lastState === "standing" &&
        this.consecutiveStandingFrames > 60 &&
        this.repCounter > 0
      ) {
        feedback = "Ready for another frogger squat";
        feedbackType = "info";
        this.feedbackCooldown = 45;
      } else if (
        this.lastState === "squatting" &&
        squatDepth < 0.7 &&
        !this.wasWideEnough
      ) {
        feedback = "Squat deeper and wider";
        feedbackType = "info";
        this.feedbackCooldown = 30;
      } else if (this.lastState === "squatting" && torsoAngle > 0.5) {
        feedback = "Keep your chest up";
        feedbackType = "info";
        this.feedbackCooldown = 30;
      } else if (this.lastState === "standing" && this.repCounter === 0) {
        feedback = "Squat down with knees wide like a frog";
        feedbackType = "info";
        this.feedbackCooldown = 45;
      }
    }

    // Count consecutive standing frames
    if (this.lastState === "standing") {
      if (!this.consecutiveStandingFrames) this.consecutiveStandingFrames = 0;
      this.consecutiveStandingFrames++;
    } else {
      this.consecutiveStandingFrames = 0;
    }

    // Show feedback in UI if needed
    if (feedback) {
      showFormFeedback([feedback], feedbackType);

      // Log when feedback is shown
      console.log("Frogger Squat feedback shown:", {
        feedback,
        feedbackType,
        squatDepth,
        kneeWidthRatio,
        torsoAngle,
        state: this.lastState,
      });
    }

    return { repCount: this.repCounter, feedback, feedbackType };
  }

  // Shuffle Forward and Backward detection
  detectShuffle(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const nose = getKeypointByName(smoothedKeypoints, "nose");

    if (!leftAnkle || !rightAnkle || !nose) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track feet and head",
      };
    }

    // Track forward/backward movement based on nose y-position
    // Store historical positions for detecting direction changes
    if (!this.shuffleHistory) {
      this.shuffleHistory = [];
      this.shuffleDirection = null;
      this.shuffleChangeCount = 0;
    }

    // Add current position to history (limit to last 10 frames)
    this.shuffleHistory.push(nose.y);
    if (this.shuffleHistory.length > 10) {
      this.shuffleHistory.shift();
    }

    // Determine current direction (forward or backward)
    if (this.shuffleHistory.length >= 5) {
      const currentAvg =
        this.shuffleHistory.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const previousAvg =
        this.shuffleHistory.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

      const currentDirection =
        currentAvg > previousAvg ? "backward" : "forward";

      // Detect direction change
      if (this.shuffleDirection && currentDirection !== this.shuffleDirection) {
        this.shuffleChangeCount++;

        // Every 2 direction changes is one full rep (forward and back)
        if (this.shuffleChangeCount % 2 === 0) {
          this.repCounter++;
        }
      }

      this.shuffleDirection = currentDirection;
    }

    let feedback = "";

    // Generate feedback based on current state
    if (this.shuffleDirection === "forward") {
      feedback = "Shuffling forward, good!";
    } else if (this.shuffleDirection === "backward") {
      feedback = "Shuffling backward, good!";
    } else {
      feedback = "Start shuffling forward and backward";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Ice Ski detection
  detectIceSki(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (!leftAnkle || !rightAnkle) {
      return { repCount: this.repCounter, feedback: "Cannot track feet" };
    }

    // Calculate foot spread (distance between ankles)
    const footSpread = Math.abs(leftAnkle.x - rightAnkle.x);

    // Initialize ice ski state if not exists
    if (this.iceSkiState === undefined) {
      this.iceSkiState = "centered";
      this.iceSkiThreshold = 100; // Adjust based on your needs
    }

    let feedback = "";

    // Detect side-to-side movement
    if (footSpread > this.iceSkiThreshold && this.iceSkiState === "centered") {
      this.iceSkiState = "spread";
      this.repCounter++;
      feedback = "Good ice ski movement!";
    } else if (
      footSpread < this.iceSkiThreshold * 0.6 &&
      this.iceSkiState === "spread"
    ) {
      this.iceSkiState = "centered";
      feedback = "Ready for next rep";
    } else if (this.iceSkiState === "spread") {
      feedback = "Bring feet closer together";
    } else {
      feedback = "Spread feet further apart";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Side Step Shuffle detection
  detectSideStepShuffle(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const hip = getKeypointByName(smoothedKeypoints, "left_hip"); // Use hip as reference point

    if (!hip) {
      return { repCount: this.repCounter, feedback: "Cannot track hips" };
    }

    // Initialize side step state if not exists
    if (!this.sideStepHistory) {
      this.sideStepHistory = [];
      this.lastSideDirection = null;
      this.sideStepThreshold = 50; // Adjust based on your needs
    }

    // Add current position to history (limit to last 15 frames)
    this.sideStepHistory.push(hip.x);
    if (this.sideStepHistory.length > 15) {
      this.sideStepHistory.shift();
    }

    let feedback = "";

    // Need enough history to determine movement
    if (this.sideStepHistory.length >= 10) {
      const currentPos = this.sideStepHistory[this.sideStepHistory.length - 1];
      const previousPos = this.sideStepHistory[0];

      // Calculate horizontal movement
      const movementDelta = Math.abs(currentPos - previousPos);

      // Determine direction
      const direction = currentPos > previousPos ? "right" : "left";

      // If significant movement and direction changed
      if (
        movementDelta > this.sideStepThreshold &&
        this.lastSideDirection &&
        direction !== this.lastSideDirection
      ) {
        this.repCounter++;
        feedback = `Good side shuffle to the ${direction}!`;
      } else if (movementDelta > this.sideStepThreshold) {
        feedback = `Moving to the ${direction}, good!`;
      } else {
        feedback = "Step further to the side";
      }

      this.lastSideDirection = direction;
    } else {
      feedback = "Start side stepping";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Sprint detection
  detectSprint(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (!leftKnee || !rightKnee || !leftHip || !rightHip) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track knees and hips",
      };
    }

    // Calculate knee height relative to hips
    const leftKneeHeight = leftHip.y - leftKnee.y;
    const rightKneeHeight = rightHip.y - rightKnee.y;

    // Initialize sprint state if not exists
    if (!this.sprintState) {
      this.sprintState = {
        lastHighKnee: null,
        kneeHeightThreshold: 40, // Adjust based on your needs
        cycleCount: 0,
      };
    }

    let feedback = "";

    // Check which knee is higher
    const highKnee = leftKneeHeight > rightKneeHeight ? "left" : "right";
    const maxKneeHeight = Math.max(leftKneeHeight, rightKneeHeight);

    // Detect alternating high knees for sprint
    if (maxKneeHeight > this.sprintState.kneeHeightThreshold) {
      if (
        this.sprintState.lastHighKnee !== highKnee &&
        this.sprintState.lastHighKnee !== null
      ) {
        // Alternating knee detected
        this.sprintState.cycleCount++;

        // Every 2 cycles (left and right) is one rep
        if (this.sprintState.cycleCount % 2 === 0) {
          this.repCounter++;
        }

        feedback = "Good sprint motion!";
      } else {
        feedback = `${highKnee.charAt(0).toUpperCase() + highKnee.slice(1)
          } knee up, good!`;
      }

      this.sprintState.lastHighKnee = highKnee;
    } else {
      feedback = "Lift knees higher for sprint";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Jog On The Spot detection
  detectJogOnSpot(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Initialize jogging state if not exists
    if (!this.jogState) {
      this.jogState = {
        lastActive: null,
        verticalThreshold: 30, // Adjust based on your needs
        stationaryThreshold: 50, // To ensure jogging on spot, not moving forward
        cycleCount: 0,
        leftAnkleHistory: [],
        rightAnkleHistory: [],
      };
    }

    // Track ankle position history
    this.jogState.leftAnkleHistory.push({ x: leftAnkle.x, y: leftAnkle.y });
    this.jogState.rightAnkleHistory.push({ x: rightAnkle.x, y: rightAnkle.y });

    // Limit history size
    if (this.jogState.leftAnkleHistory.length > 10)
      this.jogState.leftAnkleHistory.shift();
    if (this.jogState.rightAnkleHistory.length > 10)
      this.jogState.rightAnkleHistory.shift();

    // Calculate vertical movement
    const leftAnkleVertical = this.calculateVerticalMovement(
      this.jogState.leftAnkleHistory
    );
    const rightAnkleVertical = this.calculateVerticalMovement(
      this.jogState.rightAnkleHistory
    );

    // Check horizontal movement to ensure "on the spot"
    const leftHorizontal = this.calculateHorizontalMovement(
      this.jogState.leftAnkleHistory
    );
    const rightHorizontal = this.calculateHorizontalMovement(
      this.jogState.rightAnkleHistory
    );

    let feedback = "";

    // Determine which foot is active
    const activeFoot =
      leftAnkleVertical > rightAnkleVertical ? "left" : "right";
    const maxVertical = Math.max(leftAnkleVertical, rightAnkleVertical);
    const maxHorizontal = Math.max(leftHorizontal, rightHorizontal);

    // Check if jogging on spot or moving too much
    if (maxHorizontal > this.jogState.stationaryThreshold) {
      feedback = "Try to jog in place without moving forward";
    } else if (maxVertical > this.jogState.verticalThreshold) {
      if (
        this.jogState.lastActive !== activeFoot &&
        this.jogState.lastActive !== null
      ) {
        // Alternating feet detected
        this.jogState.cycleCount++;

        // Every 2 cycles (left and right) is one rep
        if (this.jogState.cycleCount % 2 === 0) {
          this.repCounter++;
        }

        feedback = "Good jogging motion!";
      } else {
        feedback = "Keep jogging";
      }

      this.jogState.lastActive = activeFoot;
    } else {
      feedback = "Lift feet higher when jogging";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Helper method for jogging detection
  calculateVerticalMovement(positionHistory) {
    if (positionHistory.length < 5) return 0;

    const recent = positionHistory.slice(-3);
    const earlier = positionHistory.slice(0, 3);

    const recentAvgY =
      recent.reduce((sum, pos) => sum + pos.y, 0) / recent.length;
    const earlierAvgY =
      earlier.reduce((sum, pos) => sum + pos.y, 0) / earlier.length;

    return Math.abs(recentAvgY - earlierAvgY);
  }

  // Helper method for jogging detection
  calculateHorizontalMovement(positionHistory) {
    if (positionHistory.length < 5) return 0;

    const recent = positionHistory.slice(-3);
    const earlier = positionHistory.slice(0, 3);

    const recentAvgX =
      recent.reduce((sum, pos) => sum + pos.x, 0) / recent.length;
    const earlierAvgX =
      earlier.reduce((sum, pos) => sum + pos.x, 0) / earlier.length;

    return Math.abs(recentAvgX - earlierAvgX);
  }

  // Butt Kicks detection
  detectButtKicks(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftAnkle ||
      !rightAnkle ||
      !leftKnee ||
      !rightKnee ||
      !leftHip ||
      !rightHip
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Initialize butt kicks state if not exists
    if (!this.buttKicksState) {
      this.buttKicksState = {
        lastActiveLeg: null,
        kickThreshold: 30, // Distance threshold for detecting a kick
        cycleCount: 0,
      };
    }

    // Calculate heel to hip vertical distance (negative means heel is above hip)
    const leftHeelToHipY = leftAnkle.y - leftHip.y;
    const rightHeelToHipY = rightAnkle.y - rightHip.y;

    // Calculate horizontal distance to ensure proper form
    const leftHeelToHipX = Math.abs(leftAnkle.x - leftHip.x);
    const rightHeelToHipX = Math.abs(rightAnkle.x - rightHip.x);

    let feedback = "";

    // Determine which leg is performing a kick
    const isLeftKick =
      leftHeelToHipY < this.buttKicksState.kickThreshold &&
      leftHeelToHipX < 100;
    const isRightKick =
      rightHeelToHipY < this.buttKicksState.kickThreshold &&
      rightHeelToHipX < 100;

    let activeLeg = null;
    if (isLeftKick && !isRightKick) {
      activeLeg = "left";
    } else if (isRightKick && !isLeftKick) {
      activeLeg = "right";
    }

    if (activeLeg) {
      if (
        this.buttKicksState.lastActiveLeg !== activeLeg &&
        this.buttKicksState.lastActiveLeg !== null
      ) {
        // Alternating legs detected
        this.buttKicksState.cycleCount++;

        // Every 2 cycles (left and right) is one rep
        if (this.buttKicksState.cycleCount % 2 === 0) {
          this.repCounter++;
        }

        feedback = "Good butt kick!";
      } else {
        feedback = `${activeLeg.charAt(0).toUpperCase() + activeLeg.slice(1)
          } leg kick, good!`;
      }

      this.buttKicksState.lastActiveLeg = activeLeg;
    } else {
      feedback = "Kick heels toward buttocks";
    }

    return { repCount: this.repCounter, feedback };
  }

  // High Punches detection
  detectHighPunches(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const nose = getKeypointByName(smoothedKeypoints, "nose");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder ||
      !nose
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Initialize high punches state if not exists
    if (!this.punchState) {
      this.punchState = {
        lastActivePunch: null,
        extensionThreshold: 100, // Distance threshold for detecting a punch
        heightThreshold: 20, // Wrist should be higher than nose
        cycleCount: 0,
      };
    }

    // Calculate arm extension (distance from shoulder to wrist)
    const leftExtension = Math.sqrt(
      Math.pow(leftWrist.x - leftShoulder.x, 2) +
      Math.pow(leftWrist.y - leftShoulder.y, 2)
    );

    const rightExtension = Math.sqrt(
      Math.pow(rightWrist.x - rightShoulder.x, 2) +
      Math.pow(rightWrist.y - rightShoulder.y, 2)
    );

    // Check if wrists are high enough (Y position lower than nose means higher in image)
    const isLeftHigh = leftWrist.y < nose.y + this.punchState.heightThreshold;
    const isRightHigh = rightWrist.y < nose.y + this.punchState.heightThreshold;

    let feedback = "";

    // Determine which arm is punching
    const isLeftPunch =
      leftExtension > this.punchState.extensionThreshold && isLeftHigh;
    const isRightPunch =
      rightExtension > this.punchState.extensionThreshold && isRightHigh;

    let activePunch = null;
    if (isLeftPunch && !isRightPunch) {
      activePunch = "left";
    } else if (isRightPunch && !isLeftPunch) {
      activePunch = "right";
    }

    if (activePunch) {
      if (
        this.punchState.lastActivePunch !== activePunch &&
        this.punchState.lastActivePunch !== null
      ) {
        // Alternating punches detected
        this.punchState.cycleCount++;

        // Every 2 cycles (left and right) is one rep
        if (this.punchState.cycleCount % 2 === 0) {
          this.repCounter++;
        }

        feedback = "Good high punch!";
      } else {
        feedback = `${activePunch.charAt(0).toUpperCase() + activePunch.slice(1)
          } arm punch, good!`;
      }

      this.punchState.lastActivePunch = activePunch;
    } else if (!isLeftHigh && !isRightHigh) {
      feedback = "Punch higher above shoulder level";
    } else {
      feedback = "Extend arms more for punches";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Lateral Shuttle Steps detection
  detectLateralShuttle(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const hip = getKeypointByName(smoothedKeypoints, "left_hip"); // Reference point

    if (!leftAnkle || !rightAnkle || !hip) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track feet and hips",
      };
    }

    // Initialize lateral shuttle state if not exists
    if (!this.shuttleState) {
      this.shuttleState = {
        positionHistory: [],
        lastPosition: null,
        movementThreshold: 80, // Distance threshold for detecting lateral movement
        directionChangeCount: 0,
      };
    }

    // Add current position to history
    this.shuttleState.positionHistory.push(hip.x);
    if (this.shuttleState.positionHistory.length > 20) {
      this.shuttleState.positionHistory.shift();
    }

    let feedback = "";

    // Need enough history to determine movement
    if (this.shuttleState.positionHistory.length >= 10) {
      // Calculate average position from recent frames
      const recentPositions = this.shuttleState.positionHistory.slice(-5);
      const recentAvg =
        recentPositions.reduce((a, b) => a + b, 0) / recentPositions.length;

      // Calculate average position from earlier frames
      const earlierPositions = this.shuttleState.positionHistory.slice(0, 5);
      const earlierAvg =
        earlierPositions.reduce((a, b) => a + b, 0) / earlierPositions.length;

      // Calculate movement and direction
      const movement = Math.abs(recentAvg - earlierAvg);
      const currentPosition =
        movement > this.shuttleState.movementThreshold
          ? recentAvg > earlierAvg
            ? "right"
            : "left"
          : "center";

      // Check for direction change
      if (
        this.shuttleState.lastPosition &&
        currentPosition !== "center" &&
        this.shuttleState.lastPosition !== "center" &&
        currentPosition !== this.shuttleState.lastPosition
      ) {
        this.shuttleState.directionChangeCount++;

        // Every 2 direction changes is one rep
        if (this.shuttleState.directionChangeCount % 2 === 0) {
          this.repCounter++;
        }

        feedback = `Good lateral shuttle to the ${currentPosition}!`;
      } else if (currentPosition !== "center") {
        feedback = `Moving ${currentPosition}, good!`;
      } else {
        feedback = "Move further to the side";
      }

      this.shuttleState.lastPosition = currentPosition;
    } else {
      feedback = "Start lateral movements";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Additional exercise detectors would follow the same pattern
  detectTwistReach(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // Implementation would track shoulder and hip rotation plus arm extension
    // For simplicity, reporting basic placeholder
    return {
      repCount: this.repCounter,
      feedback: "Twist and extend arms fully",
    };
  }

  detectBurpee(keypoints) {
    // Get smoothed keypoint data for better detection
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // Extract relevant keypoints
    const nose = smoothedKeypoints.find((kp) => kp.name === "nose");
    const leftShoulder = smoothedKeypoints.find(
      (kp) => kp.name === "leftShoulder"
    );
    const rightShoulder = smoothedKeypoints.find(
      (kp) => kp.name === "rightShoulder"
    );
    const leftHip = smoothedKeypoints.find((kp) => kp.name === "leftHip");
    const rightHip = smoothedKeypoints.find((kp) => kp.name === "rightHip");
    const leftAnkle = smoothedKeypoints.find((kp) => kp.name === "leftAnkle");
    const rightAnkle = smoothedKeypoints.find((kp) => kp.name === "rightAnkle");
    const leftWrist = smoothedKeypoints.find((kp) => kp.name === "leftWrist");
    const rightWrist = smoothedKeypoints.find((kp) => kp.name === "rightWrist");

    if (
      !nose ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle ||
      !leftWrist ||
      !rightWrist
    ) {
      return { repCount: this.repCounter, feedback: "Can't track full body" };
    }

    // Initialize burpee state tracking
    if (!this.burpeeState) {
      this.burpeeState = {
        currentPhase: "standing", // standing, squat, plank, pushUp, jump
        phaseStartTime: Date.now(),
        completedPhases: [],
        phaseTransitions: [],
      };
    }

    // Calculate key metrics
    const shoulderMidpointY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipMidpointY = (leftHip.y + rightHip.y) / 2;
    const ankleMidpointY = (leftAnkle.y + rightAnkle.y) / 2;
    const wristMidpointY = (leftWrist.y + rightWrist.y) / 2;

    // Normalize by height to make detection size-independent
    const bodyHeight = ankleMidpointY - nose.y;

    // Detect body orientation and position
    const isStanding =
      hipMidpointY - shoulderMidpointY < 0.2 * bodyHeight &&
      shoulderMidpointY - nose.y < 0.1 * bodyHeight;

    const isSquatting =
      hipMidpointY - shoulderMidpointY > 0.25 * bodyHeight &&
      ankleMidpointY - hipMidpointY < 0.3 * bodyHeight;

    const isInPlank =
      Math.abs(shoulderMidpointY - hipMidpointY) < 0.3 * bodyHeight &&
      Math.abs(shoulderMidpointY - hipMidpointY) > 0.1 * bodyHeight &&
      wristMidpointY - shoulderMidpointY > 0.1 * bodyHeight;

    const isInPushUp =
      isInPlank &&
      Math.abs(shoulderMidpointY - wristMidpointY) < 0.15 * bodyHeight;

    const isJumping = nose.y < ankleMidpointY - 1.1 * bodyHeight;

    // Track phase changes
    let currentPhase = this.burpeeState.currentPhase;
    let newPhase = currentPhase;

    // Determine current phase
    if (isJumping) {
      newPhase = "jump";
    } else if (isInPushUp) {
      newPhase = "pushUp";
    } else if (isInPlank) {
      newPhase = "plank";
    } else if (isSquatting) {
      newPhase = "squat";
    } else if (isStanding) {
      newPhase = "standing";
    }

    // If phase changed, record it
    if (newPhase !== currentPhase) {
      this.burpeeState.phaseTransitions.push({
        from: currentPhase,
        to: newPhase,
        time: Date.now(),
      });

      this.burpeeState.completedPhases.push(currentPhase);
      this.burpeeState.currentPhase = newPhase;
      this.burpeeState.phaseStartTime = Date.now();
    }

    // Check if we've completed the burpee sequence
    const lastTransitions = this.burpeeState.phaseTransitions.slice(-6);
    const correctSequence = this.checkBurpeeSequence(lastTransitions);

    if (correctSequence) {
      this.repCounter++;
      // Reset for next rep
      this.burpeeState.phaseTransitions = [];
      this.burpeeState.completedPhases = [];
    }

    // Generate feedback
    let feedback = "Good form";
    if (
      currentPhase === "standing" &&
      this.burpeeState.phaseTransitions.length === 0
    ) {
      feedback = "Begin by moving into a squat position";
    } else if (
      currentPhase === "squat" &&
      !this.burpeeState.completedPhases.includes("plank")
    ) {
      feedback = "Place hands on ground and kick back to plank position";
    } else if (
      currentPhase === "plank" &&
      !this.burpeeState.completedPhases.includes("pushUp")
    ) {
      feedback = "Lower chest to ground for push-up";
    } else if (currentPhase === "pushUp") {
      feedback = "Push back up and return to squat position";
    } else if (
      currentPhase === "squat" &&
      this.burpeeState.completedPhases.includes("pushUp")
    ) {
      feedback = "Jump explosively from squat position";
    } else if (
      !correctSequence &&
      this.burpeeState.phaseTransitions.length > 3
    ) {
      feedback = "Complete full sequence: squat, plank, push-up, squat, jump";
    }

    return {
      repCount: this.repCounter,
      feedback: feedback,
      metrics: {
        currentPhase: currentPhase,
        completedPhases: this.burpeeState.completedPhases.join(" → "),
        isCorrectSequence: correctSequence,
      },
    };
  }

  checkBurpeeSequence(transitions) {
    if (transitions.length < 5) return false;

    // Extract just the phase names in order
    const phases = ["standing", ...transitions.map((t) => t.to)];

    // Check for the correct sequence (may start at different points)
    const correctSequence = [
      "standing",
      "squat",
      "plank",
      "pushUp",
      "squat",
      "jump",
      "standing",
    ];

    // Check if the phases match any part of the correct sequence
    for (let i = 0; i <= correctSequence.length - phases.length; i++) {
      let match = true;
      for (let j = 0; j < phases.length; j++) {
        if (phases[j] !== correctSequence[i + j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }

    return false;
  }

  detectMountainClimbers(keypoints) {
    // Get smoothed keypoint data for better detection
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // Extract relevant keypoints
    const leftShoulder = smoothedKeypoints.find(
      (kp) => kp.name === "leftShoulder"
    );
    const rightShoulder = smoothedKeypoints.find(
      (kp) => kp.name === "rightShoulder"
    );
    const leftHip = smoothedKeypoints.find((kp) => kp.name === "leftHip");
    const rightHip = smoothedKeypoints.find((kp) => kp.name === "rightHip");
    const leftKnee = smoothedKeypoints.find((kp) => kp.name === "leftKnee");
    const rightKnee = smoothedKeypoints.find((kp) => kp.name === "rightKnee");
    const leftAnkle = smoothedKeypoints.find((kp) => kp.name === "leftAnkle");
    const rightAnkle = smoothedKeypoints.find((kp) => kp.name === "rightAnkle");
    const leftWrist = smoothedKeypoints.find((kp) => kp.name === "leftWrist");
    const rightWrist = smoothedKeypoints.find((kp) => kp.name === "rightWrist");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle ||
      !leftWrist ||
      !rightWrist
    ) {
      return { repCount: this.repCounter, feedback: "Can't track full body" };
    }

    // Initialize state tracking if needed
    if (!this.mountainClimberState) {
      this.mountainClimberState = {
        kneePositions: [],
        lastRepTime: Date.now(),
        isInPlank: false,
        leftKneeForward: false,
        rightKneeForward: false,
      };
    }

    // Calculate key metrics
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    const wristMidpoint = {
      x: (leftWrist.x + rightWrist.x) / 2,
      y: (leftWrist.y + rightWrist.y) / 2,
    };

    // Check if in plank position
    const torsoAngle =
      (Math.atan2(
        hipMidpoint.y - shoulderMidpoint.y,
        hipMidpoint.x - shoulderMidpoint.x
      ) *
        180) /
      Math.PI;

    const isInPlank =
      Math.abs(torsoAngle) < 30 &&
      Math.abs(shoulderMidpoint.y - wristMidpoint.y) < 50;

    this.mountainClimberState.isInPlank = isInPlank;

    if (!isInPlank) {
      return {
        repCount: this.repCounter,
        feedback: "Get into proper plank position",
      };
    }

    // Track knee positions
    this.mountainClimberState.kneePositions.push({
      leftKnee: { x: leftKnee.x, y: leftKnee.y },
      rightKnee: { x: rightKnee.x, y: rightKnee.y },
      timestamp: Date.now(),
    });

    // Keep history limited to last 30 frames
    if (this.mountainClimberState.kneePositions.length > 30) {
      this.mountainClimberState.kneePositions.shift();
    }

    // Check knee positions relative to shoulders
    const leftKneeForward = leftKnee.x > shoulderMidpoint.x;
    const rightKneeForward = rightKnee.x > shoulderMidpoint.x;

    // Detect rep completion (when knee moves from behind shoulder to forward and back)
    if (leftKneeForward && !this.mountainClimberState.leftKneeForward) {
      this.repCounter++;
      this.mountainClimberState.lastRepTime = Date.now();
    } else if (
      rightKneeForward &&
      !this.mountainClimberState.rightKneeForward
    ) {
      this.repCounter++;
      this.mountainClimberState.lastRepTime = Date.now();
    }

    // Update knee position state
    this.mountainClimberState.leftKneeForward = leftKneeForward;
    this.mountainClimberState.rightKneeForward = rightKneeForward;

    // Calculate pace
    const repTimeElapsed = Date.now() - this.mountainClimberState.lastRepTime;
    const pace = 1000 / repTimeElapsed; // reps per second

    // Generate feedback
    let feedback = "Good form";

    if (!this.detectAlternatingKnees()) {
      feedback = "Alternate knees for proper mountain climbers";
    } else if (pace < 1.0) {
      // slower than 1 rep per second
      feedback = "Increase your pace, drive knees faster";
    } else if (
      !this.isProperPlankAlignment(shoulderMidpoint, hipMidpoint, wristMidpoint)
    ) {
      feedback = "Maintain straight line from shoulders to heels";
    }

    return {
      repCount: this.repCounter,
      feedback: feedback,
      metrics: {
        pace: pace.toFixed(2),
        isInPlank: isInPlank,
        plankAngle: torsoAngle.toFixed(2),
      },
    };
  }

  detectWideNarrowJump(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track feet and hips",
      };
    }

    // Initialize wide/narrow jump state if not exists
    if (!this.wideNarrowJumpState) {
      this.wideNarrowJumpState = {
        footSpreadHistory: [],
        hipHeightHistory: [],
        wideThreshold: 150, // Threshold for wide stance
        narrowThreshold: 70, // Threshold for narrow stance
        jumpThreshold: 20, // Vertical movement threshold to detect jump
        currentState: "unknown",
        lastStateChange: 0,
        completeSequence: false,
      };
    }

    // Calculate foot spread (distance between ankles)
    const footSpread = Math.abs(leftAnkle.x - rightAnkle.x);

    // Calculate hip height (average of left and right hip y-position)
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    // Add current measurements to history
    this.wideNarrowJumpState.footSpreadHistory.push(footSpread);
    this.wideNarrowJumpState.hipHeightHistory.push(hipHeight);

    // Limit history size
    if (this.wideNarrowJumpState.footSpreadHistory.length > 15) {
      this.wideNarrowJumpState.footSpreadHistory.shift();
    }

    if (this.wideNarrowJumpState.hipHeightHistory.length > 15) {
      this.wideNarrowJumpState.hipHeightHistory.shift();
    }

    let feedback = "";
    let newState = "";

    // Need enough history to determine movement patterns
    if (this.wideNarrowJumpState.footSpreadHistory.length >= 10) {
      // Determine current stance
      if (footSpread > this.wideNarrowJumpState.wideThreshold) {
        newState = "wide";
      } else if (footSpread < this.wideNarrowJumpState.narrowThreshold) {
        newState = "narrow";
      } else {
        newState = "transitioning";
      }

      // Detect jump by checking for vertical hip movement
      let jumpDetected = false;
      if (this.wideNarrowJumpState.hipHeightHistory.length >= 10) {
        const recentHipAvg =
          this.wideNarrowJumpState.hipHeightHistory
            .slice(-3)
            .reduce((a, b) => a + b, 0) / 3;
        const earlierHipAvg =
          this.wideNarrowJumpState.hipHeightHistory
            .slice(-8, -5)
            .reduce((a, b) => a + b, 0) / 3;

        jumpDetected =
          Math.abs(recentHipAvg - earlierHipAvg) >
          this.wideNarrowJumpState.jumpThreshold;
      }

      const now = Date.now();

      // State transition with debounce (500ms)
      if (
        newState !== this.wideNarrowJumpState.currentState &&
        newState !== "transitioning" &&
        now - this.wideNarrowJumpState.lastStateChange > 500
      ) {
        // For a complete cycle: need to go from wide to narrow or vice versa
        if (jumpDetected) {
          if (
            this.wideNarrowJumpState.currentState === "wide" &&
            newState === "narrow"
          ) {
            feedback = "Good jump to narrow stance!";
            // Mark the first half of the sequence
            this.wideNarrowJumpState.completeSequence =
              this.wideNarrowJumpState.completeSequence ===
                "wide_to_narrow_done"
                ? true
                : "narrow_to_wide_done";
          } else if (
            this.wideNarrowJumpState.currentState === "narrow" &&
            newState === "wide"
          ) {
            feedback = "Good jump to wide stance!";
            // Mark the first half of the sequence
            this.wideNarrowJumpState.completeSequence =
              this.wideNarrowJumpState.completeSequence ===
                "narrow_to_wide_done"
                ? true
                : "wide_to_narrow_done";
          }

          // If a complete sequence is detected (either narrow->wide->narrow or wide->narrow->wide)
          if (this.wideNarrowJumpState.completeSequence === true) {
            this.repCounter++;
            this.wideNarrowJumpState.completeSequence = false; // Reset for the next rep
            feedback = "Complete rep! Great job!";
          }
        } else {
          feedback = "Jump higher when changing stance";
        }

        this.wideNarrowJumpState.currentState = newState;
        this.wideNarrowJumpState.lastStateChange = now;
      } else if (newState === "transitioning") {
        feedback =
          this.wideNarrowJumpState.currentState === "wide"
            ? "Jump to bring feet together"
            : "Jump to spread feet wider";
      } else if (!jumpDetected) {
        feedback = "Jump with more height";
      } else {
        feedback =
          newState === "wide"
            ? "Now jump to narrow position"
            : "Now jump to wide position";
      }
    } else {
      feedback = "Get ready to jump between wide and narrow stances";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Squat With Punches detection
  detectSquatPunches(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body keypoints",
      };
    }

    // Initialize squat punches state if not exists
    if (!this.squatPunchesState) {
      this.squatPunchesState = {
        hipHeightHistory: [],
        punchState: "none", // none, left_extended, right_extended
        squatState: "standing", // standing, squatting
        squatThreshold: 50, // Distance threshold for squat depth
        punchThreshold: 120, // Arm extension threshold for punches
        seqState: null, // Tracks the current sequence state
        lastStateChangeTime: 0,
      };
    }

    // Calculate hip height (average of left and right hip y-position)
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    // Add current hip height to history
    this.squatPunchesState.hipHeightHistory.push(hipHeight);
    if (this.squatPunchesState.hipHeightHistory.length > 15) {
      this.squatPunchesState.hipHeightHistory.shift();
    }

    // Calculate squat depth by comparing hip height to knee height
    const kneeHeight = (leftKnee.y + rightKnee.y) / 2;
    const squat_depth = hipHeight - kneeHeight;

    // Determine if in squat position
    let currentSquatState =
      squat_depth < this.squatPunchesState.squatThreshold
        ? "squatting"
        : "standing";

    // Calculate arm extension for punches
    const leftArmExtension = Math.sqrt(
      Math.pow(leftWrist.x - leftShoulder.x, 2) +
      Math.pow(leftWrist.y - leftShoulder.y, 2)
    );

    const rightArmExtension = Math.sqrt(
      Math.pow(rightWrist.x - rightShoulder.x, 2) +
      Math.pow(rightWrist.y - rightShoulder.y, 2)
    );

    // Determine current punch state
    let currentPunchState = "none";
    if (
      leftArmExtension > this.squatPunchesState.punchThreshold &&
      rightArmExtension <= this.squatPunchesState.punchThreshold
    ) {
      currentPunchState = "left_extended";
    } else if (
      rightArmExtension > this.squatPunchesState.punchThreshold &&
      leftArmExtension <= this.squatPunchesState.punchThreshold
    ) {
      currentPunchState = "right_extended";
    } else if (
      leftArmExtension > this.squatPunchesState.punchThreshold &&
      rightArmExtension > this.squatPunchesState.punchThreshold
    ) {
      currentPunchState = "both_extended";
    }

    let feedback = "";
    const now = Date.now();

    // State machine for tracking the exercise sequence
    // Complete rep: Squat down -> Punch (either arm) -> Return to standing

    // If there was a state change, update the sequence state
    if (
      currentSquatState !== this.squatPunchesState.squatState ||
      currentPunchState !== this.squatPunchesState.punchState
    ) {
      // Debounce state changes (300ms)
      if (now - this.squatPunchesState.lastStateChangeTime > 300) {
        // Sequence: standing -> squatting -> punch -> standing (complete rep)
        if (
          this.squatPunchesState.squatState === "standing" &&
          currentSquatState === "squatting"
        ) {
          this.squatPunchesState.seqState = "squatting";
          feedback = "Good squat! Now punch while holding the squat";
        } else if (
          this.squatPunchesState.seqState === "squatting" &&
          currentPunchState !== "none" &&
          this.squatPunchesState.punchState === "none"
        ) {
          this.squatPunchesState.seqState = "punched";
          feedback = "Great punch! Now return to standing";
        } else if (
          this.squatPunchesState.seqState === "punched" &&
          currentSquatState === "standing" &&
          this.squatPunchesState.squatState === "squatting"
        ) {
          // Complete repetition
          this.repCounter++;
          this.squatPunchesState.seqState = null;
          feedback = "Complete rep! Excellent form!";
        }

        // Update states
        this.squatPunchesState.squatState = currentSquatState;
        this.squatPunchesState.punchState = currentPunchState;
        this.squatPunchesState.lastStateChangeTime = now;
      }
    } else if (feedback === "") {
      // Provide guidance based on current sequence state
      if (this.squatPunchesState.seqState === null) {
        feedback = "Squat down to begin";
      } else if (this.squatPunchesState.seqState === "squatting") {
        feedback = "Extend arm for punch while holding squat";
      } else if (this.squatPunchesState.seqState === "punched") {
        feedback = "Return to standing position";
      }
    }

    return { repCount: this.repCounter, feedback };
  }

  // Cross High Punches detection
  detectCrossPunches(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const nose = getKeypointByName(smoothedKeypoints, "nose");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftElbow ||
      !rightElbow ||
      !nose
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track arms and face",
      };
    }

    // Initialize cross punches state if not exists
    if (!this.crossPunchesState) {
      this.crossPunchesState = {
        punchState: "neutral", // neutral, left_cross, right_cross
        lastValidPunch: null, // Last detected valid punch
        punchExtensionThreshold: 130, // Threshold for arm extension
        crossThreshold: 40, // Threshold for crossing the body midline
        heightThreshold: 20, // Wrist should be above or near shoulder height
        lastPunchTime: 0, // Timestamp of last punch
        punchSequence: [], // Track the sequence of punches
      };
    }

    // Calculate body midline (based on nose position)
    const midlineX = nose.x;

    // Check if wrists are high enough (close to or above shoulder height)
    const leftWristHigh =
      leftWrist.y < leftShoulder.y + this.crossPunchesState.heightThreshold;
    const rightWristHigh =
      rightWrist.y < rightShoulder.y + this.crossPunchesState.heightThreshold;

    // Calculate arm extension
    const leftArmExtension = Math.sqrt(
      Math.pow(leftWrist.x - leftShoulder.x, 2) +
      Math.pow(leftWrist.y - leftShoulder.y, 2)
    );

    const rightArmExtension = Math.sqrt(
      Math.pow(rightWrist.x - rightShoulder.x, 2) +
      Math.pow(rightWrist.y - rightShoulder.y, 2)
    );

    // Check if arms are crossing the body midline
    const leftArmCrossing =
      leftWrist.x > midlineX + this.crossPunchesState.crossThreshold;
    const rightArmCrossing =
      rightWrist.x < midlineX - this.crossPunchesState.crossThreshold;

    let currentPunchState = "neutral";

    // Detect left cross punch
    if (
      leftArmExtension > this.crossPunchesState.punchExtensionThreshold &&
      leftWristHigh &&
      leftArmCrossing
    ) {
      currentPunchState = "left_cross";
    }
    // Detect right cross punch
    else if (
      rightArmExtension > this.crossPunchesState.punchExtensionThreshold &&
      rightWristHigh &&
      rightArmCrossing
    ) {
      currentPunchState = "right_cross";
    }

    let feedback = "";
    const now = Date.now();

    // Detect punch state changes with debounce (300ms)
    if (
      currentPunchState !== "neutral" &&
      currentPunchState !== this.crossPunchesState.punchState &&
      now - this.crossPunchesState.lastPunchTime > 300
    ) {
      // Record the punch in sequence
      this.crossPunchesState.punchSequence.push(currentPunchState);

      // Limit sequence memory to last 4 punches
      if (this.crossPunchesState.punchSequence.length > 4) {
        this.crossPunchesState.punchSequence.shift();
      }

      // Alternating left and right crosses is proper form
      if (
        this.crossPunchesState.lastValidPunch &&
        currentPunchState !== this.crossPunchesState.lastValidPunch
      ) {
        // Complete rep: alternating punches
        this.repCounter++;
        feedback = `Good ${currentPunchState === "left_cross" ? "left" : "right"
          } cross punch!`;
      } else {
        feedback = `${currentPunchState === "left_cross" ? "Left" : "Right"
          } cross punch detected`;
      }

      this.crossPunchesState.lastValidPunch = currentPunchState;
      this.crossPunchesState.lastPunchTime = now;
    } else if (currentPunchState === "neutral") {
      // Return to neutral position
      if (
        this.crossPunchesState.punchState !== "neutral" &&
        now - this.crossPunchesState.lastPunchTime > 500
      ) {
        this.crossPunchesState.punchState = "neutral";
        feedback = "Ready for next punch";
      } else if (this.crossPunchesState.lastValidPunch === "left_cross") {
        feedback = "Now throw a right cross punch";
      } else if (this.crossPunchesState.lastValidPunch === "right_cross") {
        feedback = "Now throw a left cross punch";
      } else {
        feedback = "Throw a cross punch across your body";
      }
    }

    this.crossPunchesState.punchState = currentPunchState;

    return { repCount: this.repCounter, feedback };
  }

  // Straight Punches detection
  detectStraightPunches(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftElbow ||
      !rightElbow
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Initialize straight punches state if not exists
    if (!this.straightPunchesState) {
      this.straightPunchesState = {
        punchState: "neutral", // neutral, left_punch, right_punch
        lastValidPunch: null, // Last detected valid punch
        punchExtensionThreshold: 120, // Threshold for arm extension
        alignmentThreshold: 30, // Threshold for wrist-shoulder alignment
        lastPunchTime: 0, // Timestamp of last punch
        punchSequence: [], // Track the sequence of punches
      };
    }

    // Calculate arm extension
    const leftArmExtension = Math.sqrt(
      Math.pow(leftWrist.x - leftShoulder.x, 2) +
      Math.pow(leftWrist.y - leftShoulder.y, 2)
    );

    const rightArmExtension = Math.sqrt(
      Math.pow(rightWrist.x - rightShoulder.x, 2) +
      Math.pow(rightWrist.y - rightShoulder.y, 2)
    );

    // Check alignment for straight punches (wrist should be aligned with shoulder)
    const leftPunchAlignment = Math.abs(leftWrist.y - leftShoulder.y);
    const rightPunchAlignment = Math.abs(rightWrist.y - rightShoulder.y);

    let currentPunchState = "neutral";

    // Detect left straight punch
    if (
      leftArmExtension > this.straightPunchesState.punchExtensionThreshold &&
      leftPunchAlignment < this.straightPunchesState.alignmentThreshold
    ) {
      currentPunchState = "left_punch";
    }
    // Detect right straight punch
    else if (
      rightArmExtension > this.straightPunchesState.punchExtensionThreshold &&
      rightPunchAlignment < this.straightPunchesState.alignmentThreshold
    ) {
      currentPunchState = "right_punch";
    }

    let feedback = "";
    const now = Date.now();

    // Detect punch state changes with debounce (300ms)
    if (
      currentPunchState !== "neutral" &&
      currentPunchState !== this.straightPunchesState.punchState &&
      now - this.straightPunchesState.lastPunchTime > 300
    ) {
      // Record the punch in sequence
      this.straightPunchesState.punchSequence.push(currentPunchState);

      // Limit sequence memory to last 4 punches
      if (this.straightPunchesState.punchSequence.length > 4) {
        this.straightPunchesState.punchSequence.shift();
      }

      // Alternating left and right punches is proper form
      if (
        this.straightPunchesState.lastValidPunch &&
        currentPunchState !== this.straightPunchesState.lastValidPunch
      ) {
        // Complete rep: alternating punches
        this.repCounter++;
        feedback = `Good ${currentPunchState === "left_punch" ? "left" : "right"
          } straight punch!`;
      } else {
        feedback = `${currentPunchState === "left_punch" ? "Left" : "Right"
          } punch detected`;
      }

      this.straightPunchesState.lastValidPunch = currentPunchState;
      this.straightPunchesState.lastPunchTime = now;
    } else if (currentPunchState === "neutral") {
      // Return to neutral position
      if (
        this.straightPunchesState.punchState !== "neutral" &&
        now - this.straightPunchesState.lastPunchTime > 500
      ) {
        this.straightPunchesState.punchState = "neutral";
        feedback = "Ready for next punch";
      } else if (this.straightPunchesState.lastValidPunch === "left_punch") {
        feedback = "Now throw a right straight punch";
      } else if (this.straightPunchesState.lastValidPunch === "right_punch") {
        feedback = "Now throw a left straight punch";
      } else {
        feedback = "Throw a straight punch directly forward";
      }
    }

    this.straightPunchesState.punchState = currentPunchState;

    return { repCount: this.repCounter, feedback };
  }

  // Burpee Step-Up detection
  detectBurpeeStepUp(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const nose = getKeypointByName(smoothedKeypoints, "nose");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftAnkle ||
      !rightAnkle ||
      !leftHip ||
      !rightHip ||
      !leftShoulder ||
      !rightShoulder ||
      !nose
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body keypoints",
      };
    }

    // Initialize burpee state if not exists
    if (!this.burpeeState) {
      this.burpeeState = {
        currentPhase: "standing", // standing, squat, plank, step_up, completed
        phaseChangeTime: 0, // Timestamp of last phase change
        hipHeightHistory: [], // Track hip height for movement detection
        noseHeightHistory: [], // Track nose height for overall body position
        handFloorDistance: 50, // Threshold for hands touching floor (plank)
        standingThreshold: 120, // Threshold for standing position
        stepUpThreshold: 40, // Threshold for step up movement
        lastRepTime: 0, // Timestamp of last completed rep
      };
    }

    // Calculate body position metrics
    const hipHeight = (leftHip.y + rightHip.y) / 2;
    const noseHeight = nose.y;
    const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
    const wristHeight = (leftWrist.y + rightWrist.y) / 2;
    const ankleHeight = (leftAnkle.y + rightAnkle.y) / 2;

    // Store movement history
    this.burpeeState.hipHeightHistory.push(hipHeight);
    this.burpeeState.noseHeightHistory.push(noseHeight);

    // Limit history size
    if (this.burpeeState.hipHeightHistory.length > 15) {
      this.burpeeState.hipHeightHistory.shift();
    }
    if (this.burpeeState.noseHeightHistory.length > 15) {
      this.burpeeState.noseHeightHistory.shift();
    }

    // Determine current body position
    let isStanding =
      hipHeight < ankleHeight - this.burpeeState.standingThreshold;
    let isSquat = hipHeight < ankleHeight - 30 && hipHeight > ankleHeight - 100;
    let isPlank =
      Math.abs(wristHeight - ankleHeight) <
      this.burpeeState.handFloorDistance &&
      Math.abs(shoulderHeight - hipHeight) < 50;

    // Detect step up motion using changes in nose height
    let isStepUp = false;
    if (this.burpeeState.noseHeightHistory.length >= 10) {
      const recentNoseAvg =
        this.burpeeState.noseHeightHistory
          .slice(-3)
          .reduce((a, b) => a + b, 0) / 3;
      const earlierNoseAvg =
        this.burpeeState.noseHeightHistory
          .slice(-10, -7)
          .reduce((a, b) => a + b, 0) / 3;

      isStepUp =
        Math.abs(recentNoseAvg - earlierNoseAvg) >
        this.burpeeState.stepUpThreshold;
    }

    let feedback = "";
    let newPhase = this.burpeeState.currentPhase;
    const now = Date.now();

    // State machine for burpee phases
    // Complete sequence: standing -> squat -> plank -> step up -> standing

    // Phase transition logic with debounce (500ms)
    if (now - this.burpeeState.phaseChangeTime > 500) {
      if (this.burpeeState.currentPhase === "standing" && isSquat) {
        newPhase = "squat";
        feedback = "Good! Now place hands on floor and extend legs";
      } else if (this.burpeeState.currentPhase === "squat" && isPlank) {
        newPhase = "plank";
        feedback = "Good plank position! Now perform step-up motion";
      } else if (this.burpeeState.currentPhase === "plank" && isStepUp) {
        newPhase = "step_up";
        feedback = "Good step-up! Now return to standing";
      } else if (this.burpeeState.currentPhase === "step_up" && isStanding) {
        newPhase = "completed";
        this.repCounter++;
        this.burpeeState.lastRepTime = now;
        feedback = "Complete burpee! Great job!";
      } else if (
        this.burpeeState.currentPhase === "completed" &&
        now - this.burpeeState.lastRepTime > 1000
      ) {
        // Reset for next rep after a short delay
        newPhase = "standing";
        feedback = "Ready for next burpee";
      }

      // If phase changed, update timestamp
      if (newPhase !== this.burpeeState.currentPhase) {
        this.burpeeState.phaseChangeTime = now;
        this.burpeeState.currentPhase = newPhase;
      }
    }

    // If no feedback set yet, provide guidance based on current phase
    if (feedback === "") {
      switch (this.burpeeState.currentPhase) {
        case "standing":
          feedback = "Begin burpee by squatting down";
          break;
        case "squat":
          feedback = "Place hands on floor and extend legs back";
          break;
        case "plank":
          feedback = "Perform step-up motion";
          break;
        case "step_up":
          feedback = "Return to standing position";
          break;
        case "completed":
          feedback = "Great job! Get ready for next rep";
          break;
      }
    }

    return { repCount: this.repCounter, feedback };
  }

  detectAlternatingKnees() {
    if (
      !this.mountainClimberState ||
      !this.mountainClimberState.kneePositions ||
      this.mountainClimberState.kneePositions.length < 10
    ) {
      return false;
    }

    // Check if knees are moving in alternating pattern
    let leftForward = false;
    let rightForward = false;
    let hasAlternated = false;

    for (let i = 1; i < this.mountainClimberState.kneePositions.length; i++) {
      const prev = this.mountainClimberState.kneePositions[i - 1];
      const curr = this.mountainClimberState.kneePositions[i];

      // Detect forward movement
      const leftMovingForward = curr.leftKnee.x > prev.leftKnee.x;
      const rightMovingForward = curr.rightKnee.x > prev.rightKnee.x;

      // Check for alternating pattern
      if (leftMovingForward && !rightMovingForward) {
        leftForward = true;
      } else if (!leftMovingForward && rightMovingForward) {
        rightForward = true;
      }

      if (leftForward && rightForward) {
        hasAlternated = true;
        break;
      }
    }

    return hasAlternated;
  }

  isProperPlankAlignment(shoulder, hip, wrist) {
    // Check if shoulders, hips, and heels form a straight line
    const shoulderToHipAngle =
      (Math.atan2(hip.y - shoulder.y, hip.x - shoulder.x) * 180) / Math.PI;

    // Proper plank should have angle close to horizontal
    return Math.abs(shoulderToHipAngle) < 15;
  }

  detectJumpSquatPunches(keypoints) {
    // Get smoothed keypoint data for better detection
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // Extract relevant keypoints
    const nose = smoothedKeypoints.find((kp) => kp.name === "nose");
    const leftShoulder = smoothedKeypoints.find(
      (kp) => kp.name === "leftShoulder"
    );
    const rightShoulder = smoothedKeypoints.find(
      (kp) => kp.name === "rightShoulder"
    );
    const leftElbow = smoothedKeypoints.find((kp) => kp.name === "leftElbow");
    const rightElbow = smoothedKeypoints.find((kp) => kp.name === "rightElbow");
    const leftWrist = smoothedKeypoints.find((kp) => kp.name === "leftWrist");
    const rightWrist = smoothedKeypoints.find((kp) => kp.name === "rightWrist");
    const leftHip = smoothedKeypoints.find((kp) => kp.name === "leftHip");
    const rightHip = smoothedKeypoints.find((kp) => kp.name === "rightHip");
    const leftKnee = smoothedKeypoints.find((kp) => kp.name === "leftKnee");
    const rightKnee = smoothedKeypoints.find((kp) => kp.name === "rightKnee");
    const leftAnkle = smoothedKeypoints.find((kp) => kp.name === "leftAnkle");
    const rightAnkle = smoothedKeypoints.find((kp) => kp.name === "rightAnkle");

    if (
      !nose ||
      !leftShoulder ||
      !rightShoulder ||
      !leftElbow ||
      !rightElbow ||
      !leftWrist ||
      !rightWrist ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Can't track full body" };
    }

    // Initialize state tracking if needed
    if (!this.jumpSquatPunchState) {
      this.jumpSquatPunchState = {
        phase: "standing", // standing, squatting, jumping, punching
        prevNoseY: nose.y,
        hipPositions: [],
        armExtension: {
          left: false,
          right: false,
        },
        lastFullRepTime: Date.now(),
      };
    }

    // Track vertical movement
    const verticalVelocity = this.jumpSquatPunchState.prevNoseY - nose.y;
    this.jumpSquatPunchState.prevNoseY = nose.y;

    // Track hip position for squat detection
    const hipMidpointY = (leftHip.y + rightHip.y) / 2;
    const ankleMidpointY = (leftAnkle.y + rightAnkle.y) / 2;

    this.jumpSquatPunchState.hipPositions.push({
      y: hipMidpointY,
      timestamp: Date.now(),
    });

    // Keep history limited
    if (this.jumpSquatPunchState.hipPositions.length > 30) {
      this.jumpSquatPunchState.hipPositions.shift();
    }

    // Calculate key metrics
    const bodyHeight = ankleMidpointY - nose.y;
    const squatDepth = (hipMidpointY - ankleMidpointY) / bodyHeight;
    const isSquatting = squatDepth < 0.3; // Lower value means deeper squat

    // Detect jumping
    const isJumping = verticalVelocity > 15; // Upward velocity threshold

    // Detect arm extension for punches
    const leftArmExtension = this.calculateArmExtension(
      leftShoulder,
      leftElbow,
      leftWrist
    );
    const rightArmExtension = this.calculateArmExtension(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    const leftPunching =
      leftArmExtension > 0.8 && !this.jumpSquatPunchState.armExtension.left;
    const rightPunching =
      rightArmExtension > 0.8 && !this.jumpSquatPunchState.armExtension.right;

    this.jumpSquatPunchState.armExtension.left = leftArmExtension > 0.8;
    this.jumpSquatPunchState.armExtension.right = rightArmExtension > 0.8;

    // Update phase
    let currentPhase = this.jumpSquatPunchState.phase;

    if (isJumping) {
      currentPhase = "jumping";
    } else if (isSquatting) {
      currentPhase = "squatting";
    } else if (leftPunching || rightPunching) {
      currentPhase = "punching";
    } else {
      currentPhase = "standing";
    }

    // Track phase changes for rep counting
    if (currentPhase !== this.jumpSquatPunchState.phase) {
      // Count a rep when completing the sequence: squat -> jump -> punch
      if (
        this.jumpSquatPunchState.phase === "punching" &&
        currentPhase === "standing"
      ) {
        const timeElapsed =
          Date.now() - this.jumpSquatPunchState.lastFullRepTime;
        if (timeElapsed > 500) {
          // Prevent double counting
          this.repCounter++;
          this.jumpSquatPunchState.lastFullRepTime = Date.now();
        }
      }

      this.jumpSquatPunchState.phase = currentPhase;
    }

    // Generate feedback
    let feedback = "Good form";

    if (
      currentPhase === "standing" &&
      this.jumpSquatPunchState.lastFullRepTime === 0
    ) {
      feedback = "Begin with a deep squat";
    } else if (currentPhase === "squatting" && squatDepth > 0.25) {
      feedback = "Squat deeper, at least to parallel";
    } else if (currentPhase === "jumping" && verticalVelocity < 20) {
      feedback = "Jump more explosively from squat";
    } else if (
      currentPhase === "punching" &&
      leftArmExtension < 0.7 &&
      rightArmExtension < 0.7
    ) {
      feedback = "Extend punches fully";
    }

    return {
      repCount: this.repCounter,
      feedback: feedback,
      metrics: {
        currentPhase: currentPhase,
        squatDepth: (1 - squatDepth).toFixed(2),
        jumpHeight: verticalVelocity.toFixed(2),
        leftPunchExtension: leftArmExtension.toFixed(2),
        rightPunchExtension: rightArmExtension.toFixed(2),
      },
    };
  }

  calculateArmExtension(shoulder, elbow, wrist) {
    // Calculate the actual arm length
    const upperArmLength = Math.sqrt(
      Math.pow(elbow.x - shoulder.x, 2) + Math.pow(elbow.y - shoulder.y, 2)
    );

    const forearmLength = Math.sqrt(
      Math.pow(wrist.x - elbow.x, 2) + Math.pow(wrist.y - elbow.y, 2)
    );

    const totalArmLength = upperArmLength + forearmLength;

    // Calculate the direct distance from shoulder to wrist
    const shoulderToWristDistance = Math.sqrt(
      Math.pow(wrist.x - shoulder.x, 2) + Math.pow(wrist.y - shoulder.y, 2)
    );

    // Extension ratio: 1.0 means fully extended, lower values mean more bent
    return shoulderToWristDistance / totalArmLength;
  }

  detectStepUps(keypoints) {
    // Get smoothed keypoint data for better detection
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // Extract relevant keypoints
    const leftHip = smoothedKeypoints.find((kp) => kp.name === "leftHip");
    const rightHip = smoothedKeypoints.find((kp) => kp.name === "rightHip");
    const leftKnee = smoothedKeypoints.find((kp) => kp.name === "leftKnee");
    const rightKnee = smoothedKeypoints.find((kp) => kp.name === "rightKnee");
    const leftAnkle = smoothedKeypoints.find((kp) => kp.name === "leftAnkle");
    const rightAnkle = smoothedKeypoints.find((kp) => kp.name === "rightAnkle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Can't track lower body" };
    }

    // Initialize state tracking if needed
    if (!this.stepUpState) {
      this.stepUpState = {
        hipPositionHistory: [],
        lastStepLeadLeg: null, // 'left' or 'right'
        isOnPlatform: false,
        lastRepTime: Date.now(),
        stepHeight: 0,
      };
    }

    // Calculate hip midpoint
    const hipMidpointY = (leftHip.y + rightHip.y) / 2;

    // Track hip vertical position
    this.stepUpState.hipPositionHistory.push({
      y: hipMidpointY,
      leftKneeY: leftKnee.y,
      rightKneeY: rightKnee.y,
      leftAnkleY: leftAnkle.y,
      rightAnkleY: rightAnkle.y,
      timestamp: Date.now(),
    });

    // Keep history limited
    if (this.stepUpState.hipPositionHistory.length > 60) {
      // About 2 seconds at 30fps
      this.stepUpState.hipPositionHistory.shift();
    }

    // Detect step height
    const ankleYDifference = Math.abs(leftAnkle.y - rightAnkle.y);
    if (ankleYDifference > this.stepUpState.stepHeight) {
      this.stepUpState.stepHeight = ankleYDifference;
    }

    // Detect which leg is leading the step
    const leftLeading = leftAnkle.y < rightAnkle.y - 20; // Left foot higher
    const rightLeading = rightAnkle.y < leftAnkle.y - 20; // Right foot higher

    let leadLeg = null;
    if (leftLeading) leadLeg = "left";
    else if (rightLeading) leadLeg = "right";

    // Detect if on platform (both legs at same height)
    const isOnPlatform = ankleYDifference < 20;

    // Detect step-up completion
    if (!this.stepUpState.isOnPlatform && isOnPlatform) {
      // Successfully stepped onto platform
      const minHipY = Math.min(
        ...this.stepUpState.hipPositionHistory.map((pos) => pos.y)
      );
      const maxHipY = Math.max(
        ...this.stepUpState.hipPositionHistory.map((pos) => pos.y)
      );
      const verticalDisplacement = maxHipY - minHipY;

      // Ensure sufficient vertical movement
      if (
        verticalDisplacement > 30 &&
        leadLeg !== this.stepUpState.lastStepLeadLeg
      ) {
        this.repCounter++;
        this.stepUpState.lastRepTime = Date.now();
        this.stepUpState.lastStepLeadLeg = leadLeg;
      }
    }

    // Update platform state
    this.stepUpState.isOnPlatform = isOnPlatform;

    // Generate feedback
    let feedback = "Good form";

    if (!leftLeading && !rightLeading && !isOnPlatform) {
      feedback = "Step fully onto platform";
    } else if (isOnPlatform && this.detectPoorKneeAlignment()) {
      feedback = "Keep knee aligned with ankle";
    } else if (this.detectTooFastPace()) {
      feedback = "Control your movement, avoid rushing";
    } else if (
      this.detectInsufficientExtension(leftHip, rightHip, leftKnee, rightKnee)
    ) {
      feedback = "Fully extend hips and knees on platform";
    }

    return {
      repCount: this.repCounter,
      feedback: feedback,
      metrics: {
        leadLeg: leadLeg || "none",
        stepHeight: this.stepUpState.stepHeight.toFixed(2),
      },
    };
  }

  // Step Hop Overs detection
  detectStepHopOvers(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track feet and hips",
      };
    }

    // Initialize step hop overs state if not exists
    if (!this.stepHopState) {
      this.stepHopState = {
        ankleHistory: [],
        verticalThreshold: 40, // Threshold for detecting vertical movement (hop)
        lateralThreshold: 60, // Threshold for detecting lateral movement
        lastDirection: null,
        directionCount: 0,
        lastHopTime: 0,
      };
    }

    // Calculate average ankle position
    const avgAnkleX = (leftAnkle.x + rightAnkle.x) / 2;
    const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;

    // Add current position to history
    const currentTime = Date.now();
    this.stepHopState.ankleHistory.push({
      x: avgAnkleX,
      y: avgAnkleY,
      time: currentTime,
    });

    // Limit history size
    if (this.stepHopState.ankleHistory.length > 15) {
      this.stepHopState.ankleHistory.shift();
    }

    let feedback = "";

    // Need enough history to determine movement
    if (this.stepHopState.ankleHistory.length >= 10) {
      // Get recent and earlier positions
      const recent = this.stepHopState.ankleHistory.slice(-3);
      const earlier = this.stepHopState.ankleHistory.slice(-10, -7);

      // Calculate average positions
      const recentAvgX =
        recent.reduce((sum, pos) => sum + pos.x, 0) / recent.length;
      const earlierAvgX =
        earlier.reduce((sum, pos) => sum + pos.x, 0) / earlier.length;
      const recentAvgY =
        recent.reduce((sum, pos) => sum + pos.y, 0) / recent.length;
      const earlierAvgY =
        earlier.reduce((sum, pos) => sum + pos.y, 0) / earlier.length;

      // Calculate horizontal and vertical movement
      const horizontalMovement = Math.abs(recentAvgX - earlierAvgX);
      const verticalMovement = Math.abs(recentAvgY - earlierAvgY);

      // Determine direction of horizontal movement
      const direction = recentAvgX > earlierAvgX ? "right" : "left";

      // Check if there was a hop (significant vertical movement)
      const isHop = verticalMovement > this.stepHopState.verticalThreshold;

      // Check if there was significant lateral movement
      const isLateralMove =
        horizontalMovement > this.stepHopState.lateralThreshold;

      // Detect a complete hop over
      if (isHop && isLateralMove) {
        // Only count if direction changed and enough time passed since last hop (prevent double counting)
        if (
          this.stepHopState.lastDirection &&
          direction !== this.stepHopState.lastDirection &&
          currentTime - this.stepHopState.lastHopTime > 500
        ) {
          // 500ms debounce

          this.stepHopState.directionCount++;
          this.stepHopState.lastHopTime = currentTime;

          // Every 2 direction changes is one complete rep (hop over and back)
          if (this.stepHopState.directionCount % 2 === 0) {
            this.repCounter++;
          }

          feedback = "Great hop over!";
        } else if (currentTime - this.stepHopState.lastHopTime > 500) {
          feedback = `Good hop to the ${direction}!`;
          this.stepHopState.lastHopTime = currentTime;
        }

        this.stepHopState.lastDirection = direction;
      } else if (isHop && !isLateralMove) {
        feedback = "Hop more to the side";
      } else if (!isHop && isLateralMove) {
        feedback = "Lift feet higher when hopping";
      } else {
        feedback = "Hop completely over step";
      }
    } else {
      feedback = "Prepare to hop side to side";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Wide To Narrow Step Jump detection
  detectWideToNarrowStepJump(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (!leftAnkle || !rightAnkle || !leftKnee || !rightKnee) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track feet and knees",
      };
    }

    // Initialize wide/narrow state if not exists
    if (!this.wideNarrowState) {
      this.wideNarrowState = {
        footSpreadHistory: [],
        wideThreshold: 150, // Threshold for wide stance (adjust based on your needs)
        narrowThreshold: 70, // Threshold for narrow stance
        currentState: "unknown",
        stateChangeTime: 0,
      };
    }

    // Calculate foot spread (distance between ankles)
    const footSpread = Math.abs(leftAnkle.x - rightAnkle.x);

    // Calculate vertical movement to detect jumps
    // Use knee position as it might be more stable than ankles during jumps
    const avgKneeY = (leftKnee.y + rightKnee.y) / 2;

    // Add current spread to history
    const currentTime = Date.now();
    this.wideNarrowState.footSpreadHistory.push({
      spread: footSpread,
      kneeY: avgKneeY,
      time: currentTime,
    });

    // Limit history size
    if (this.wideNarrowState.footSpreadHistory.length > 15) {
      this.wideNarrowState.footSpreadHistory.shift();
    }

    let feedback = "";

    // Need enough history to determine movement
    if (this.wideNarrowState.footSpreadHistory.length >= 10) {
      // Determine current stance
      let newState;
      if (footSpread > this.wideNarrowState.wideThreshold) {
        newState = "wide";
      } else if (footSpread < this.wideNarrowState.narrowThreshold) {
        newState = "narrow";
      } else {
        newState = "transitioning";
      }

      // Check for vertical movement to confirm it's a jump
      let isJump = false;
      if (this.wideNarrowState.footSpreadHistory.length >= 5) {
        const recentKneeY =
          this.wideNarrowState.footSpreadHistory
            .slice(-3)
            .reduce((sum, data) => sum + data.kneeY, 0) / 3;
        const earlierKneeY =
          this.wideNarrowState.footSpreadHistory
            .slice(-8, -5)
            .reduce((sum, data) => sum + data.kneeY, 0) / 3;

        // Significant change in knee height indicates a jump
        isJump = Math.abs(recentKneeY - earlierKneeY) > 20;
      }

      // State transition with debounce to prevent oscillation
      if (
        newState !== this.wideNarrowState.currentState &&
        newState !== "transitioning" &&
        currentTime - this.wideNarrowState.stateChangeTime > 500
      ) {
        // 500ms debounce

        // For a complete rep: must go from wide to narrow or vice versa with a jump
        if (
          (this.wideNarrowState.currentState === "wide" &&
            newState === "narrow") ||
          (this.wideNarrowState.currentState === "narrow" &&
            newState === "wide")
        ) {
          if (isJump) {
            // Count every transition between wide and narrow as one rep
            // This means one complete cycle (wide->narrow->wide) counts as 2 reps
            this.repCounter++;

            if (newState === "wide") {
              feedback = "Good jump to wide stance!";
            } else {
              feedback = "Good jump to narrow stance!";
            }
          } else {
            feedback = "Jump higher when changing stance";
          }
        }

        this.wideNarrowState.currentState = newState;
        this.wideNarrowState.stateChangeTime = currentTime;
      } else if (newState === "transitioning") {
        // Provide guidance based on previous state
        if (this.wideNarrowState.currentState === "wide") {
          feedback = "Jump to bring feet together";
        } else if (this.wideNarrowState.currentState === "narrow") {
          feedback = "Jump to spread feet wider";
        } else {
          feedback = "Jump wider, then narrow";
        }
      } else if (!isJump && newState === this.wideNarrowState.currentState) {
        // If staying in same position without jumping
        if (newState === "wide") {
          feedback = "Now jump to narrow stance";
        } else if (newState === "narrow") {
          feedback = "Now jump to wide stance";
        } else {
          feedback = "Jump wider, then narrow";
        }
      }
    } else {
      feedback = "Prepare to jump wide, then narrow";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectStepUpsKneeElbow(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftKnee ||
      !rightKnee ||
      !leftElbow ||
      !rightElbow ||
      !leftHip ||
      !rightHip
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track knees and elbows",
      };
    }

    // Calculate distance between knee and opposite elbow
    const leftKneeToRightElbowDist = calculateDistance(leftKnee, rightElbow);
    const rightKneeToLeftElbowDist = calculateDistance(rightKnee, leftElbow);

    // Calculate reference distance (hip width) for normalization
    const hipWidth = calculateDistance(leftHip, rightHip);

    // Normalize distances based on hip width
    const normalizedLeftKneeToRightElbow = leftKneeToRightElbowDist / hipWidth;
    const normalizedRightKneeToLeftElbow = rightKneeToLeftElbowDist / hipWidth;

    let feedback = "";

    // Check if either knee is close to the opposite elbow (step-up with knee to elbow motion)
    if (
      (normalizedLeftKneeToRightElbow < 1.0 ||
        normalizedRightKneeToLeftElbow < 1.0) &&
      this.lastState !== "knee-to-elbow"
    ) {
      this.repCounter++;
      this.lastState = "knee-to-elbow";
      feedback = "Good knee to elbow!";
    } else if (
      normalizedLeftKneeToRightElbow > 2.0 &&
      normalizedRightKneeToLeftElbow > 2.0 &&
      this.lastState === "knee-to-elbow"
    ) {
      this.lastState = "standing";
      feedback = "Ready for next rep";
    } else if (this.lastState === "knee-to-elbow") {
      feedback = "Return to standing position";
    } else {
      feedback = "Bring knee up to opposite elbow";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Decline Mountain Climbers detector
  detectDeclineClimbers(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftKnee ||
      !rightKnee ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track knees and hips",
      };
    }

    // Calculate y-distances to measure the height difference of knees
    const leftKneeHeight = leftHip.y - leftKnee.y;
    const rightKneeHeight = rightHip.y - rightKnee.y;

    // Calculate reference distance (hip height from ankles) for normalization
    const hipHeightLeft = leftHip.y - leftAnkle.y;
    const hipHeightRight = rightHip.y - rightAnkle.y;
    const avgHipHeight = (hipHeightLeft + hipHeightRight) / 2;

    // Normalize knee heights
    const normalizedLeftKneeHeight = leftKneeHeight / avgHipHeight;
    const normalizedRightKneeHeight = rightKneeHeight / avgHipHeight;

    let feedback = "";

    // Check if the legs are alternating in a climbing motion
    if (
      normalizedLeftKneeHeight > 0.4 &&
      normalizedRightKneeHeight < 0.2 &&
      this.lastState !== "left-knee-up"
    ) {
      this.repCounter++;
      this.lastState = "left-knee-up";
      feedback = "Good left knee drive!";
    } else if (
      normalizedRightKneeHeight > 0.4 &&
      normalizedLeftKneeHeight < 0.2 &&
      this.lastState !== "right-knee-up"
    ) {
      this.repCounter++;
      this.lastState = "right-knee-up";
      feedback = "Good right knee drive!";
    } else if (
      normalizedLeftKneeHeight < 0.2 &&
      normalizedRightKneeHeight < 0.2
    ) {
      this.lastState = "plank";
      feedback = "Keep core tight in plank position";
    } else {
      feedback = "Drive knees toward chest, alternate legs";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Ice Skater detector
  detectIceSkater(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (!leftAnkle || !rightAnkle || !leftHip || !rightHip) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track ankles and hips",
      };
    }

    // Calculate lateral distance between ankles
    const ankleSpread = Math.abs(leftAnkle.x - rightAnkle.x);

    // Calculate reference distance (hip width) for normalization
    const hipWidth = Math.abs(leftHip.x - rightHip.x);

    // Normalize ankle spread distance
    const normalizedAnkleSpread = ankleSpread / hipWidth;

    // Calculate which side the weight is on by comparing ankle heights
    const weightOnLeftSide = rightAnkle.y < leftAnkle.y;
    const weightOnRightSide = leftAnkle.y < rightAnkle.y;

    let feedback = "";

    // Check for lateral movement pattern typical for ice skaters
    if (
      normalizedAnkleSpread > 2.0 &&
      weightOnLeftSide &&
      this.lastState !== "weight-left"
    ) {
      this.repCounter++;
      this.lastState = "weight-left";
      feedback = "Good left side hop!";
    } else if (
      normalizedAnkleSpread > 2.0 &&
      weightOnRightSide &&
      this.lastState !== "weight-right"
    ) {
      this.repCounter++;
      this.lastState = "weight-right";
      feedback = "Good right side hop!";
    } else if (normalizedAnkleSpread < 1.0) {
      this.lastState = "center";
      feedback = "Prepare for next lateral hop";
    } else {
      feedback = "Hop side to side with control";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Plank Jacks detector
  detectPlankJacks(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftAnkle ||
      !rightAnkle ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track key points" };
    }

    // Calculate ankle spread and shoulder width for reference
    const ankleSpread = Math.abs(leftAnkle.x - rightAnkle.x);
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    // Normalize ankle spread based on shoulder width
    const normalizedAnkleSpread = ankleSpread / shoulderWidth;

    // Check if hips are in proper plank position (roughly level with shoulders)
    const hipLevel = (leftHip.y + rightHip.y) / 2;
    const shoulderLevel = (leftShoulder.y + rightShoulder.y) / 2;
    const properPlankPosition =
      Math.abs(hipLevel - shoulderLevel) < shoulderWidth * 0.3;

    let feedback = "";

    if (!properPlankPosition) {
      feedback = "Keep body straight in plank position";
    } else if (normalizedAnkleSpread > 1.8 && this.lastState !== "wide") {
      this.repCounter++;
      this.lastState = "wide";
      feedback = "Good plank jack!";
    } else if (normalizedAnkleSpread < 0.8 && this.lastState === "wide") {
      this.lastState = "narrow";
      feedback = "Feet together, ready for next rep";
    } else if (this.lastState === "wide") {
      feedback = "Bring feet together";
    } else {
      feedback = "Jump feet out wide";
    }

    return { repCount: this.repCounter, feedback };
  }

  //------------------------------------------------------------------------------
  // ================== WEIGHT TRAINING EXERCISES ================
  //------------------------------------------------------------------------------

  detectDumbbellSquat(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track lower body" };
    }

    // Calculate the angle of the knees (squat depth)
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Average knee angle
    const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    let feedback = "";

    // Detect squat states
    if (kneeAngle < 120 && this.lastState !== "down") {
      // In squat position
      this.lastState = "down";
      feedback = "Good squat depth";
    } else if (kneeAngle > 160 && this.lastState === "down") {
      // Standing up, count the rep
      this.repCounter++;
      this.lastState = "up";
      feedback = "Good rep!";
    } else if (this.lastState === "down") {
      feedback = "Stand up fully";
    } else {
      feedback = "Squat down";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectShoulderPress(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Calculate the vertical position of wrists relative to shoulders
    const leftWristToShoulder = leftShoulder.y - leftWrist.y;
    const rightWristToShoulder = rightShoulder.y - rightWrist.y;

    // Average vertical position (higher values mean hands are higher above shoulders)
    const wristHeight = (leftWristToShoulder + rightWristToShoulder) / 2;

    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );
    const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    let feedback = "";

    // Detect press states
    if (wristHeight > 100 && elbowAngle > 160 && this.lastState !== "up") {
      // Arms extended overhead
      this.lastState = "up";
      feedback = "Good extension";
    } else if (
      wristHeight < 20 &&
      elbowAngle < 100 &&
      this.lastState === "up"
    ) {
      // Arms down at shoulder level, count the rep
      this.repCounter++;
      this.lastState = "down";
      feedback = "Good rep!";
    } else if (this.lastState === "up") {
      feedback = "Lower weights to shoulders";
    } else {
      feedback = "Press weights overhead";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectBicepCurls(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    // Use the minimum angle (the more bent arm)
    const elbowAngle = Math.min(leftElbowAngle, rightElbowAngle);

    let feedback = "";

    // Detect curl states
    if (elbowAngle < 80 && this.lastState !== "up") {
      // Arms curled up
      this.lastState = "up";
      feedback = "Good curl";
    } else if (elbowAngle > 150 && this.lastState === "up") {
      // Arms extended down, count the rep
      this.repCounter++;
      this.lastState = "down";
      feedback = "Good rep!";
    } else if (this.lastState === "up") {
      feedback = "Extend arms fully";
    } else {
      feedback = "Curl weights up";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSingleArmRow(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // For single arm exercises, we need to detect which side is active
    // Let's first check both sides
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Determine which arm is doing the row (the one that moves more)
    // This is simplified - in a real application, you might need a more robust method
    const leftArmMovement = Math.abs(
      leftWrist.y - this.previousLeftWristY || 0
    );
    const rightArmMovement = Math.abs(
      rightWrist.y - this.previousRightWristY || 0
    );

    // Store current positions for next frame
    this.previousLeftWristY = leftWrist.y;
    this.previousRightWristY = rightWrist.y;

    let activeElbow, activeShoulder, activeWrist, sideName;

    if (leftArmMovement > rightArmMovement) {
      activeElbow = leftElbow;
      activeShoulder = leftShoulder;
      activeWrist = leftWrist;
      sideName = "left";
    } else {
      activeElbow = rightElbow;
      activeShoulder = rightShoulder;
      activeWrist = rightWrist;
      sideName = "right";
    }

    // Calculate elbow angle for the active arm
    const elbowAngle = calculateAngle(activeShoulder, activeElbow, activeWrist);

    // Calculate horizontal distance from wrist to shoulder (for rowing motion)
    const wristToShoulderHorizontal = Math.abs(
      activeWrist.x - activeShoulder.x
    );

    let feedback = "";

    // Detect row states
    if (
      elbowAngle < 100 &&
      wristToShoulderHorizontal < 50 &&
      this.lastState !== "up"
    ) {
      // Arm pulled up in row position
      this.lastState = "up";
      feedback = `Good ${sideName} arm row`;
    } else if (elbowAngle > 150 && this.lastState === "up") {
      // Arm extended down, count the rep
      this.repCounter++;
      this.lastState = "down";
      feedback = "Good rep!";
    } else if (this.lastState === "up") {
      feedback = "Extend arm fully";
    } else {
      feedback = "Pull weight up to side";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectLungePress(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // Track lower body for lunge
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    // Track upper body for press
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle ||
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track body" };
    }

    // Calculate knee angles for lunge detection
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Check which leg is lunging (smaller angle)
    const minKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

    // Calculate arm position for press
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // Vertical position of wrists relative to shoulders
    const leftWristToShoulder = leftShoulder.y - leftWrist.y;
    const rightWristToShoulder = rightShoulder.y - rightWrist.y;
    const avgWristHeight = (leftWristToShoulder + rightWristToShoulder) / 2;

    let feedback = "";

    // State machine for the combined exercise
    // We need 4 states: standing, lunging, pressing, recovery
    if (!this.exercisePhase) {
      this.exercisePhase = "standing";
    }

    switch (this.exercisePhase) {
      case "standing":
        if (minKneeAngle < 120) {
          this.exercisePhase = "lunging";
          feedback = "Good lunge, prepare to press";
        } else {
          feedback = "Step back into lunge";
        }
        break;

      case "lunging":
        if (avgElbowAngle > 160 && avgWristHeight > 100) {
          this.exercisePhase = "pressing";
          feedback = "Good press!";
        } else {
          feedback = "Press weights overhead";
        }
        break;

      case "pressing":
        if (avgElbowAngle < 100 && minKneeAngle > 160) {
          this.exercisePhase = "recovery";
          feedback = "Good recovery";
        } else {
          feedback = "Return to standing position";
        }
        break;

      case "recovery":
        if (avgElbowAngle < 90 && minKneeAngle > 170) {
          this.exercisePhase = "standing";
          this.repCounter++;
          feedback = "Complete rep!";
        } else {
          feedback = "Bring weights to shoulders";
        }
        break;
    }

    return { repCount: this.repCounter, feedback };
  }

  // Tricep Kickback
  detectTricepKickback(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (!rightElbow || !rightWrist || !rightShoulder) {
      return { repCount: this.repCounter, feedback: "Cannot track right arm" };
    }

    // Calculate angles
    const armAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);

    let feedback = "";

    // Check if arm is extended backward (kickback position)
    if (armAngle > 160 && this.lastState !== "extended") {
      this.repCounter++;
      this.lastState = "extended";
      feedback = "Good kickback!";
    } else if (armAngle < 110 && this.lastState === "extended") {
      this.lastState = "bent";
      feedback = "Ready for next rep";
    } else if (this.lastState === "extended") {
      feedback = "Bend your arm";
    } else {
      feedback = "Extend your arm back";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Front Raise
  detectFrontRaise(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (!rightShoulder || !rightElbow || !rightWrist || !rightHip) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track right arm and hip",
      };
    }

    // Calculate angle between arm and torso
    const shoulderToHipAngle = calculateAngle(
      rightElbow,
      rightShoulder,
      rightHip
    );

    let feedback = "";

    // Check if arm is raised to shoulder level
    if (shoulderToHipAngle < 50 && this.lastState !== "raised") {
      this.repCounter++;
      this.lastState = "raised";
      feedback = "Good front raise!";
    } else if (shoulderToHipAngle > 80 && this.lastState === "raised") {
      this.lastState = "lowered";
      feedback = "Ready for next rep";
    } else if (this.lastState === "raised") {
      feedback = "Lower your arms";
    } else {
      feedback = "Raise your arms to shoulder height";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Upright Dumbbell Row
  detectUprightRow(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");

    if (
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder ||
      !leftWrist ||
      !rightWrist
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Calculate elbow height relative to shoulders
    const leftElbowHeight = leftShoulder.y - leftElbow.y;
    const rightElbowHeight = rightShoulder.y - rightElbow.y;
    const avgElbowHeight = (leftElbowHeight + rightElbowHeight) / 2;

    let feedback = "";

    // Check if elbows are raised above shoulders
    if (avgElbowHeight > 0.15 && this.lastState !== "raised") {
      this.repCounter++;
      this.lastState = "raised";
      feedback = "Good upright row!";
    } else if (avgElbowHeight < -0.15 && this.lastState === "raised") {
      this.lastState = "lowered";
      feedback = "Ready for next rep";
    } else if (this.lastState === "raised") {
      feedback = "Lower your elbows";
    } else {
      feedback = "Raise your elbows above shoulders";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Dumbbell Sumo Squat
  detectSumoSquat(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate knee angle
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Calculate feet width
    const feetWidth = Math.abs(leftAnkle.x - rightAnkle.x);
    const hipWidth = Math.abs(leftHip.x - rightHip.x);
    const normalizedFeetWidth = feetWidth / hipWidth;

    let feedback = "";

    // Check for sumo stance
    if (normalizedFeetWidth < 1.5) {
      feedback = "Widen your stance for sumo position";
      return { repCount: this.repCounter, feedback };
    }

    // Check squat depth
    if (avgKneeAngle < 130 && this.lastState !== "squatting") {
      this.repCounter++;
      this.lastState = "squatting";
      feedback = "Good sumo squat!";
    } else if (avgKneeAngle > 160 && this.lastState === "squatting") {
      this.lastState = "standing";
      feedback = "Ready for next rep";
    } else if (this.lastState === "squatting") {
      feedback = "Stand up straight";
    } else {
      feedback = "Squat down, keep wide stance";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Walking Lunges
  detectWalkingLunges(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Calculate front-back distance between feet
    const feetDistance = Math.abs(leftAnkle.y - rightAnkle.y);
    const heightNormalization = Math.abs(leftHip.y - leftAnkle.y);
    const normalizedFeetDistance = feetDistance / heightNormalization;

    let feedback = "";

    if (normalizedFeetDistance < 0.5) {
      feedback = "Step forward or backward into lunge position";
      return { repCount: this.repCounter, feedback };
    }

    // Check if either knee is bent in lunge position
    if (
      (leftKneeAngle < 110 || rightKneeAngle < 110) &&
      this.lastState !== "lunging"
    ) {
      this.repCounter++;
      this.lastState = "lunging";
      feedback = "Good lunge!";
    } else if (
      leftKneeAngle > 160 &&
      rightKneeAngle > 160 &&
      this.lastState === "lunging"
    ) {
      this.lastState = "standing";
      feedback = "Ready for next step";
    } else if (this.lastState === "lunging") {
      feedback = "Return to standing position";
    } else {
      feedback = "Lunge deeper, bend your knee";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Deadlift
  detectDeadlift(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body position",
      };
    }

    // Calculate hip angle
    const hipAngle = calculateAngle(
      {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
      },
      { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 },
      { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2 }
    );

    let feedback = "";

    // Check deadlift position
    if (hipAngle > 160 && this.lastState !== "standing") {
      this.repCounter++;
      this.lastState = "standing";
      feedback = "Good deadlift!";
    } else if (hipAngle < 110 && this.lastState === "standing") {
      this.lastState = "bent";
      feedback = "Keep your back straight";
    } else if (this.lastState === "standing") {
      feedback = "Bend at the hips";
    } else {
      feedback = "Stand up straight";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Goblet Squat
  detectGobletSquat(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    let feedback = "";

    // Check squat depth
    if (avgKneeAngle < 120 && this.lastState !== "squatting") {
      this.repCounter++;
      this.lastState = "squatting";
      feedback = "Good goblet squat!";
    } else if (avgKneeAngle > 160 && this.lastState === "squatting") {
      this.lastState = "standing";
      feedback = "Ready for next rep";
    } else if (this.lastState === "squatting") {
      feedback = "Stand up straight";
    } else {
      feedback = "Squat down deeper";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Woodchop
  detectWoodchop(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftWrist ||
      !rightWrist ||
      !leftHip ||
      !rightHip
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track arms and hips",
      };
    }

    // Calculate average positions
    const avgWrist = {
      x: (leftWrist.x + rightWrist.x) / 2,
      y: (leftWrist.y + rightWrist.y) / 2,
    };
    const avgShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const avgHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    // Calculate diagonal movement
    const topPosition = avgWrist.y < avgShoulder.y - 0.2;
    const bottomPosition = avgWrist.y > avgHip.y + 0.2;

    let feedback = "";

    // Check woodchop movement (high to low)
    if (bottomPosition && this.lastState === "top") {
      this.repCounter++;
      this.lastState = "bottom";
      feedback = "Good woodchop!";
    } else if (topPosition && this.lastState === "bottom") {
      this.lastState = "top";
      feedback = "Ready for next rep";
    } else if (this.lastState === "bottom" || !this.lastState) {
      this.lastState = "top";
      feedback = "Raise weight to shoulder height";
    } else {
      feedback = "Bring weight down across body";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSnatchPress(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track arms and hips",
      };
    }

    // Calculate wrist positions relative to shoulders
    const avgWristHeight =
      (leftShoulder.y - leftWrist.y + (rightShoulder.y - rightWrist.y)) / 2;
    const normalizedWristHeight =
      avgWristHeight / Math.abs(leftShoulder.y - leftHip.y);

    let feedback = "";

    // Define the states: low (below hips), middle (at shoulders), and overhead
    if (normalizedWristHeight > 1.5 && this.lastState === "middle") {
      // Wrists are overhead (press completed)
      this.lastState = "overhead";
      feedback = "Good press!";
    } else if (normalizedWristHeight < 0 && this.lastState === "overhead") {
      // Wrists below shoulders, going down for next rep
      this.lastState = "low";
      feedback = "Ready for next rep";
    } else if (
      normalizedWristHeight > 0.8 &&
      normalizedWristHeight < 1.2 &&
      this.lastState === "low"
    ) {
      // Wrists at shoulder height (snatch completed)
      this.lastState = "middle";
      this.repCounter++;
      feedback = "Good snatch!";
    } else if (this.lastState === "overhead") {
      feedback = "Lower weight for next rep";
    } else if (this.lastState === "middle") {
      feedback = "Press overhead";
    } else {
      feedback = "Raise weight to shoulders";
      if (!this.lastState) this.lastState = "low";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Dumbbell Swing
  detectDumbbellSwing(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track arms and hips",
      };
    }

    // Calculate average wrist position
    const avgWrist = {
      x: (leftWrist.x + rightWrist.x) / 2,
      y: (leftWrist.y + rightWrist.y) / 2,
    };

    // Calculate average shoulder and hip positions
    const avgShoulder = {
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const avgHip = {
      y: (leftHip.y + rightHip.y) / 2,
    };

    // Calculate normalized wrist height
    const shoulderToHipDistance = Math.abs(avgShoulder.y - avgHip.y);
    const wristToShoulderHeight = avgShoulder.y - avgWrist.y;
    const normalizedWristHeight = wristToShoulderHeight / shoulderToHipDistance;

    let feedback = "";

    // Check swing phases
    if (normalizedWristHeight > 0.8 && this.lastState === "down") {
      // Wrists are raised to shoulder level or above (top of swing)
      this.repCounter++;
      this.lastState = "up";
      feedback = "Good swing!";
    } else if (normalizedWristHeight < -0.5 && this.lastState === "up") {
      // Wrists are below hips (bottom of swing)
      this.lastState = "down";
      feedback = "Ready for next rep";
    } else if (this.lastState === "up") {
      feedback = "Swing weight down";
    } else {
      feedback = "Swing weight up to shoulder height";
      if (!this.lastState) this.lastState = "down";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Overhead Squat
  detectOverheadSquat(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track full body position",
      };
    }

    // Check if arms are overhead
    const avgWristHeight =
      (leftShoulder.y - leftWrist.y + (rightShoulder.y - rightWrist.y)) / 2;
    const shoulderToHipDistance = Math.abs(
      (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2
    );
    const normalizedWristHeight = avgWristHeight / shoulderToHipDistance;

    // Calculate knee angles for squat depth
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    let feedback = "";

    // Check if arms are overhead
    if (normalizedWristHeight < 1.2) {
      feedback = "Raise arms fully overhead";
      return { repCount: this.repCounter, feedback };
    }

    // Check squat depth with arms overhead
    if (avgKneeAngle < 130 && this.lastState !== "squatting") {
      this.repCounter++;
      this.lastState = "squatting";
      feedback = "Good overhead squat!";
    } else if (avgKneeAngle > 160 && this.lastState === "squatting") {
      this.lastState = "standing";
      feedback = "Ready for next rep";
    } else if (this.lastState === "squatting") {
      feedback = "Stand up, keep arms overhead";
    } else {
      feedback = "Squat down, keep arms overhead";
      if (!this.lastState) this.lastState = "standing";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Single Leg Deadlift
  detectSingleLegDeadlift(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track full body position",
      };
    }

    // Calculate torso angle (shoulders to hips)
    const avgShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const avgHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    // Check if one foot is elevated (using ankle height difference)
    const ankleHeightDiff = Math.abs(leftAnkle.y - rightAnkle.y);
    const hipToAnkleDistance = Math.abs(
      avgHip.y - (leftAnkle.y + rightAnkle.y) / 2
    );
    const normalizedAnkleHeightDiff = ankleHeightDiff / hipToAnkleDistance;

    // Calculate torso to vertical angle
    const torsoAngle = calculateAngle(
      { x: avgShoulder.x, y: avgShoulder.y - 1 }, // Point above shoulders (vertical reference)
      avgShoulder,
      avgHip
    );

    let feedback = "";

    // Check if user is on one leg
    if (normalizedAnkleHeightDiff < 0.2) {
      feedback = "Lift one leg behind you";
      return { repCount: this.repCounter, feedback };
    }

    // Check deadlift position
    if (torsoAngle > 150 && this.lastState === "bent") {
      this.repCounter++;
      this.lastState = "standing";
      feedback = "Good single leg deadlift!";
    } else if (torsoAngle < 110 && this.lastState !== "bent") {
      this.lastState = "bent";
      feedback = "Good hip hinge, now stand up";
    } else if (this.lastState === "standing" || !this.lastState) {
      feedback = "Hinge at the hips, keep back flat";
      if (!this.lastState) this.lastState = "standing";
    } else {
      feedback = "Stand up straight";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Reverse Fly
  detectReverseFly(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Calculate arm spread (distance between wrists relative to shoulder width)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const wristWidth = Math.abs(leftWrist.x - rightWrist.x);
    const normalizedWristWidth = wristWidth / shoulderWidth;

    let feedback = "";

    // Check fly movement
    if (normalizedWristWidth > 1.8 && this.lastState !== "spread") {
      this.repCounter++;
      this.lastState = "spread";
      feedback = "Good reverse fly!";
    } else if (normalizedWristWidth < 1.2 && this.lastState === "spread") {
      this.lastState = "center";
      feedback = "Ready for next rep";
    } else if (this.lastState === "spread") {
      feedback = "Bring arms together";
    } else {
      feedback = "Spread arms wider";
      if (!this.lastState) this.lastState = "center";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Plank Row
  detectPlankRow(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track full body position",
      };
    }

    // Check if in plank position first
    const avgShoulder = {
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const avgHip = {
      y: (leftHip.y + rightHip.y) / 2,
    };

    const avgAnkle = {
      y: (leftAnkle.y + rightAnkle.y) / 2,
    };

    // Check if body is horizontal
    const bodyAngleTop = calculateAngle(
      { x: avgShoulder.x, y: avgShoulder.y - 1 }, // Point above shoulders (vertical reference)
      avgShoulder,
      avgHip
    );

    const bodyAngleBottom = calculateAngle(avgShoulder, avgHip, avgAnkle);

    // Check which arm is performing the row
    const leftElbowBend = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowBend = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    let rowingSide = null;
    if (leftElbowBend < 100) rowingSide = "left";
    if (rightElbowBend < 100) rowingSide = "right";

    let feedback = "";

    // Check if in proper plank position
    if (bodyAngleTop < 160 || bodyAngleBottom < 160) {
      feedback = "Get in proper plank position, body straight";
      return { repCount: this.repCounter, feedback };
    }

    // Check row movement
    if (rowingSide && this.lastState !== "rowing") {
      this.repCounter++;
      this.lastState = "rowing";
      feedback = `Good ${rowingSide} arm row!`;
    } else if (!rowingSide && this.lastState === "rowing") {
      this.lastState = "plank";
      feedback = "Ready for next rep";
    } else if (this.lastState !== "rowing") {
      feedback = "Pull one arm up while maintaining plank";
      if (!this.lastState) this.lastState = "plank";
    } else {
      feedback = "Lower arm back to ground";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Y to T Raises
  detectYTWings(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Calculate arm angles
    const leftArmAngle = calculateAngle(
      { x: leftShoulder.x, y: leftShoulder.y - 1 }, // Point above shoulders (vertical reference)
      leftShoulder,
      leftElbow
    );

    const rightArmAngle = calculateAngle(
      { x: rightShoulder.x, y: rightShoulder.y - 1 }, // Point above shoulders (vertical reference)
      rightShoulder,
      rightElbow
    );

    // Calculate arm spread
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const wristWidth = Math.abs(leftWrist.x - rightWrist.x);
    const normalizedWristWidth = wristWidth / shoulderWidth;

    let feedback = "";

    // Detect Y position (arms raised diagonally)
    const inYPosition =
      leftArmAngle < 55 && rightArmAngle < 55 && normalizedWristWidth > 1.7;

    // Detect T position (arms horizontal)
    const inTPosition =
      leftArmAngle > 70 &&
      leftArmAngle < 110 &&
      rightArmAngle > 70 &&
      rightArmAngle < 110 &&
      normalizedWristWidth > 1.8;

    // Detect rest position (arms down)
    const inRestPosition = leftArmAngle > 160 && rightArmAngle > 160;

    if (inYPosition && (this.lastState === "rest" || this.lastState === "T")) {
      this.lastState = "Y";
      feedback = "Good Y position!";
      if (this.lastState === "T") this.repCounter++; // Count a rep when completing the sequence
    } else if (inTPosition && this.lastState === "Y") {
      this.lastState = "T";
      feedback = "Good T position!";
    } else if (inRestPosition && this.lastState === "T") {
      this.lastState = "rest";
      feedback = "Ready for next rep";
    } else if (!this.lastState || this.lastState === "rest") {
      feedback = "Raise arms in Y position";
      if (!this.lastState) this.lastState = "rest";
    } else if (this.lastState === "Y") {
      feedback = "Move to T position (arms horizontal)";
    } else {
      feedback = "Lower arms to rest";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Alternate Elevated Lunge
  detectElevatedLunge(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Calculate ankle height difference to detect elevation
    const ankleHeightDiff = Math.abs(leftAnkle.y - rightAnkle.y);
    const hipHeight = Math.abs(
      (leftHip.y + rightHip.y) / 2 - (leftAnkle.y + rightAnkle.y) / 2
    );
    const normalizedAnkleHeightDiff = ankleHeightDiff / hipHeight;

    let feedback = "";

    // Check if feet are at different heights (one foot elevated)
    if (normalizedAnkleHeightDiff < 0.15) {
      feedback = "Place one foot on an elevated surface";
      return { repCount: this.repCounter, feedback };
    }

    // Determine which leg is in lunge position
    let lungeLeg = null;
    if (leftKneeAngle < 130) lungeLeg = "left";
    if (rightKneeAngle < 130) lungeLeg = "right";

    if (lungeLeg && this.lastState !== "lunging") {
      this.repCounter++;
      this.lastState = "lunging";
      feedback = `Good ${lungeLeg} elevated lunge!`;
    } else if (!lungeLeg && this.lastState === "lunging") {
      this.lastState = "standing";
      feedback = "Ready for next rep";
    } else if (this.lastState === "lunging") {
      feedback = "Return to starting position";
    } else {
      feedback = "Lunge down, bend front knee";
      if (!this.lastState) this.lastState = "standing";
    }

    return { repCount: this.repCounter, feedback };
  }

  // Tricep Dips
  detectTricepDips(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");

    if (
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder ||
      !leftWrist ||
      !rightWrist
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    let feedback = "";

    // Detect dip movement
    if (avgElbowAngle < 110 && this.lastState !== "dipping") {
      this.lastState = "dipping";
      feedback = "Good dip depth";
    } else if (avgElbowAngle > 160 && this.lastState === "dipping") {
      this.repCounter++;
      this.lastState = "extended";
      feedback = "Good tricep dip!";
    } else if (this.lastState === "extended" || !this.lastState) {
      feedback = "Lower your body by bending elbows";
      if (!this.lastState) this.lastState = "extended";
    } else {
      feedback = "Push up by extending arms";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectBurpeeDBPress(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track full body" };
    }

    // Calculate height difference to detect squat/standing positions
    const hipHeight = (leftHip.y + rightHip.y) / 2;
    const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
    const ankleHeight = (leftAnkle.y + rightAnkle.y) / 2;

    // Hip to ankle height ratio (smaller when in squat position)
    const standRatio =
      (hipHeight - ankleHeight) / (shoulderHeight - ankleHeight);

    // Wrists above shoulders for press detection
    const wristsAboveShoulders =
      leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;

    // Track burpee stages: 0-standing, 1-squat, 2-plank, 3-squat, 4-press
    if (!this.burpeeStage) this.burpeeStage = 0;

    let feedback = "";

    // State machine for burpee with press
    switch (this.burpeeStage) {
      case 0: // Standing
        if (standRatio < 0.4) {
          this.burpeeStage = 1;
          feedback = "Good squat, now go down to plank";
        } else {
          feedback = "Start by squatting down";
        }
        break;

      case 1: // Squat position going to plank
        // Check if in plank - shoulders aligned with hips horizontally
        if (Math.abs(shoulderHeight - hipHeight) < 20) {
          this.burpeeStage = 2;
          feedback = "Good plank, now return to squat";
        } else {
          feedback = "Move into plank position";
        }
        break;

      case 2: // Plank position returning to squat
        if (standRatio < 0.4) {
          this.burpeeStage = 3;
          feedback = "Now stand up with press";
        } else {
          feedback = "Return to squat position";
        }
        break;

      case 3: // Squat returning to stand with press
        if (standRatio > 0.7 && wristsAboveShoulders) {
          this.burpeeStage = 0;
          this.repCounter++;
          feedback = "Good rep! Dumbbells pressed overhead";
        } else if (standRatio > 0.7) {
          feedback = "Stand tall and press dumbbells overhead";
        } else {
          feedback = "Stand up with dumbbell press";
        }
        break;
    }

    return { repCount: this.repCounter, feedback };
  }

  detectHighPulls(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Check if wrists are at shoulder height or higher (high pull position)
    const wristsAtShoulder =
      leftWrist.y <= leftShoulder.y + 20 &&
      rightWrist.y <= rightShoulder.y + 20;

    // Check if wrists are below waist (starting position)
    const wristsLow =
      leftWrist.y > leftShoulder.y + 100 &&
      rightWrist.y > rightShoulder.y + 100;

    let feedback = "";

    if (wristsAtShoulder && this.lastState !== "up") {
      this.lastState = "up";
      feedback = "Good high pull!";
    } else if (wristsLow && this.lastState === "up") {
      this.lastState = "down";
      this.repCounter++;
      feedback = "Lower weights controlled";
    } else if (this.lastState === "up") {
      feedback = "Lower weights to starting position";
    } else {
      feedback = "Pull weights up to chest/chin level";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectLungeTwist(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body position",
      };
    }

    // Initialize lunge side tracking if not present
    if (!this.lungeSide) this.lungeSide = "center";
    if (!this.twistComplete) this.twistComplete = false;

    // Detect lunge by knee position
    const leftLunge = leftKnee.y > rightKnee.y + 50;
    const rightLunge = rightKnee.y > leftKnee.y + 50;

    // Detect twist by shoulder alignment with hips
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );
    const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x);
    const twistAngle = Math.abs(shoulderAngle - hipAngle);
    const isTwisting = twistAngle > 0.3; // Approximately 17 degrees

    let feedback = "";

    // State machine for alternate lunge and twist
    if (this.lungeSide === "center") {
      if (leftLunge) {
        this.lungeSide = "left";
        feedback = "Left lunge, now twist";
      } else if (rightLunge) {
        this.lungeSide = "right";
        feedback = "Right lunge, now twist";
      } else {
        feedback = "Step into a lunge position";
      }
    } else if (this.lungeSide === "left") {
      if (isTwisting && !this.twistComplete) {
        this.twistComplete = true;
        feedback = "Good twist, return to center";
      } else if (!leftLunge) {
        if (this.twistComplete) {
          this.lungeSide = "center";
          this.twistComplete = false;
          this.repCounter++;
          feedback = "Good rep! Now alternate sides";
        } else {
          this.lungeSide = "center";
          feedback = "Lunge complete, but missing twist";
        }
      } else if (!this.twistComplete) {
        feedback = "Twist your torso";
      } else {
        feedback = "Return to standing position";
      }
    } else if (this.lungeSide === "right") {
      if (isTwisting && !this.twistComplete) {
        this.twistComplete = true;
        feedback = "Good twist, return to center";
      } else if (!rightLunge) {
        if (this.twistComplete) {
          this.lungeSide = "center";
          this.twistComplete = false;
          this.repCounter++;
          feedback = "Good rep! Now alternate sides";
        } else {
          this.lungeSide = "center";
          feedback = "Lunge complete, but missing twist";
        }
      } else if (!this.twistComplete) {
        feedback = "Twist your torso";
      } else {
        feedback = "Return to standing position";
      }
    }

    return { repCount: this.repCounter, feedback };
  }

  detectHeadCrusher(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const nose = getKeypointByName(smoothedKeypoints, "nose");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder ||
      !nose
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track arms and head",
      };
    }

    // Calculate the vertical position of wrists relative to head
    const wristsNearHead =
      Math.abs(leftWrist.y - nose.y) < 50 &&
      Math.abs(rightWrist.y - nose.y) < 50;

    // Calculate the vertical position of wrists relative to shoulders (extended arms)
    const armsExtended =
      leftWrist.y < leftShoulder.y - 100 &&
      rightWrist.y < rightShoulder.y - 100;

    let feedback = "";

    if (wristsNearHead && this.lastState !== "down") {
      this.lastState = "down";
      feedback = "Good, now extend arms";
    } else if (armsExtended && this.lastState === "down") {
      this.lastState = "up";
      this.repCounter++;
      feedback = "Good rep!";
    } else if (this.lastState === "down") {
      feedback = "Extend arms upward";
    } else {
      feedback = "Lower weights toward head";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectRussianTwist(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftHip ||
      !rightHip ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body position",
      };
    }

    // Initialize twist side tracking if not present
    if (!this.twistSide) this.twistSide = "center";

    // Calculate hip center position
    const hipCenterX = (leftHip.x + rightHip.x) / 2;

    // Calculate wrist position relative to hip center (for twist detection)
    const wristsToLeftSide =
      leftWrist.x < hipCenterX - 50 && rightWrist.x < hipCenterX - 50;

    const wristsToRightSide =
      leftWrist.x > hipCenterX + 50 && rightWrist.x > hipCenterX + 50;

    // Check if V-sit position (knees up)
    const shoulderToHipY =
      (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2;
    const isVSitPosition = Math.abs(shoulderToHipY) < 50; // Shoulders and hips at similar height

    let feedback = "";

    if (!isVSitPosition) {
      feedback = "Sit in V position with knees bent";
      return { repCount: this.repCounter, feedback };
    }

    // Detect twists and count reps
    if (wristsToLeftSide && this.twistSide !== "left") {
      if (this.twistSide === "right") {
        this.repCounter++;
        feedback = "Good rep!";
      } else {
        feedback = "Twist to the right side";
      }
      this.twistSide = "left";
    } else if (wristsToRightSide && this.twistSide !== "right") {
      if (this.twistSide === "left") {
        this.repCounter++;
        feedback = "Good rep!";
      } else {
        feedback = "Twist to the left side";
      }
      this.twistSide = "right";
    } else if (this.twistSide === "center") {
      feedback = "Start twisting to either side";
    } else if (this.twistSide === "left") {
      feedback = "Twist to the right side";
    } else {
      feedback = "Twist to the left side";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectTricepExtension(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Calculate elbow angle for tricep extension
    const leftElbowAngle = calculateAngle(
      [leftShoulder.x, leftShoulder.y],
      [leftElbow.x, leftElbow.y],
      [leftWrist.x, leftWrist.y]
    );

    const rightElbowAngle = calculateAngle(
      [rightShoulder.x, rightShoulder.y],
      [rightElbow.x, rightElbow.y],
      [rightWrist.x, rightWrist.y]
    );

    // Check if elbows are positioned above shoulders (proper tricep extension position)
    const elbowsOverhead =
      leftElbow.y < leftShoulder.y && rightElbow.y < rightShoulder.y;

    // Arms extended = large angle at elbow
    const armsExtended = leftElbowAngle > 150 && rightElbowAngle > 150;

    // Arms bent = small angle at elbow
    const armsBent = leftElbowAngle < 90 && rightElbowAngle < 90;

    let feedback = "";

    if (!elbowsOverhead) {
      feedback = "Position elbows above shoulders";
      return { repCount: this.repCounter, feedback };
    }

    if (armsBent && this.lastState !== "bent") {
      this.lastState = "bent";
      feedback = "Now extend arms";
    } else if (armsExtended && this.lastState === "bent") {
      this.lastState = "extended";
      this.repCounter++;
      feedback = "Good tricep extension!";
    } else if (this.lastState === "bent") {
      feedback = "Extend arms fully";
    } else {
      feedback = "Bend elbows behind head";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectCurlAbductor(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Track the exercise state if not initialized
    if (!this.curlState) this.curlState = "start"; // start -> curl -> abduct -> start

    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(
      [leftShoulder.x, leftShoulder.y],
      [leftElbow.x, leftElbow.y],
      [leftWrist.x, leftWrist.y]
    );

    const rightElbowAngle = calculateAngle(
      [rightShoulder.x, rightShoulder.y],
      [rightElbow.x, rightElbow.y],
      [rightWrist.x, rightWrist.y]
    );

    // Arms extended down (starting position)
    const armsDown =
      leftElbowAngle > 150 &&
      rightElbowAngle > 150 &&
      leftWrist.y > leftElbow.y &&
      rightWrist.y > rightElbow.y;

    // Arms curled (bicep curl position)
    const armsCurled = leftElbowAngle < 90 && rightElbowAngle < 90;

    // Arms abducted (wrists away from center line)
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const wristWidth = Math.abs(leftWrist.x - rightWrist.x);
    const armsAbducted = wristWidth > shoulderWidth * 1.5 && armsCurled;

    let feedback = "";

    // State machine for curl to abductor
    switch (this.curlState) {
      case "start":
        if (armsCurled && !armsAbducted) {
          this.curlState = "curl";
          feedback = "Good curl, now abduct arms outward";
        } else {
          feedback = "Start with a bicep curl";
        }
        break;

      case "curl":
        if (armsAbducted) {
          this.curlState = "abduct";
          feedback = "Good abduction, now lower arms";
        } else {
          feedback = "Abduct arms outward while keeping elbows bent";
        }
        break;

      case "abduct":
        if (armsDown) {
          this.curlState = "start";
          this.repCounter++;
          feedback = "Good rep! Repeat movement";
        } else {
          feedback = "Lower arms to starting position";
        }
        break;
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSquatPress(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track full body" };
    }

    // Initialize exercise state if needed
    if (!this.squatPressState) this.squatPressState = "stand"; // stand -> squat -> stand+press -> stand

    // Detect squat by knee angles and hip position
    const leftKneeAngle = calculateAngle(
      [leftHip.x, leftHip.y],
      [leftKnee.x, leftKnee.y],
      [leftAnkle.x, leftAnkle.y]
    );

    const rightKneeAngle = calculateAngle(
      [rightHip.x, rightHip.y],
      [rightKnee.x, rightKnee.y],
      [rightAnkle.x, rightAnkle.y]
    );

    const isSquatting = leftKneeAngle < 120 && rightKneeAngle < 120;

    // Detect shoulder press by wrist position relative to shoulders
    const wristsAboveShoulders =
      leftWrist.y < leftShoulder.y - 50 && rightWrist.y < rightShoulder.y - 50;

    let feedback = "";

    // State machine for squat to press
    switch (this.squatPressState) {
      case "stand":
        if (isSquatting) {
          this.squatPressState = "squat";
          feedback = "Good squat, now stand and press";
        } else {
          feedback = "Start with a squat";
        }
        break;

      case "squat":
        if (!isSquatting && wristsAboveShoulders) {
          this.squatPressState = "press";
          feedback = "Good press, complete the rep";
        } else if (!isSquatting) {
          feedback = "Stand and press weights overhead";
        } else {
          feedback = "Stand up from squat position";
        }
        break;

      case "press":
        if (!wristsAboveShoulders) {
          this.squatPressState = "stand";
          this.repCounter++;
          feedback = "Good rep! Repeat movement";
        } else {
          feedback = "Lower weights to shoulder level";
        }
        break;
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSingleSnatch(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track full body" };
    }

    // Initialize state tracking for active arm and exercise phase
    if (!this.snatchArm) this.snatchArm = "none"; // none, left, right
    if (!this.snatchState) this.snatchState = "start"; // start -> snatch -> press -> start

    // Detect low position (starting)
    const leftWristLow = leftWrist.y > leftHip.y;
    const rightWristLow = rightWrist.y > rightHip.y;

    // Detect shoulder level position (snatch)
    const leftWristAtShoulder = Math.abs(leftWrist.y - leftShoulder.y) < 30;
    const rightWristAtShoulder = Math.abs(rightWrist.y - rightShoulder.y) < 30;

    // Detect overhead position (press)
    const leftWristOverhead = leftWrist.y < leftShoulder.y - 50;
    const rightWristOverhead = rightWrist.y < rightShoulder.y - 50;

    let feedback = "";

    // Determine which arm is active if not yet set
    if (this.snatchArm === "none") {
      if (leftWristLow && !rightWristLow) {
        this.snatchArm = "left";
        feedback = "Start snatch with left arm";
      } else if (!leftWristLow && rightWristLow) {
        this.snatchArm = "right";
        feedback = "Start snatch with right arm";
      } else {
        feedback = "Start with one arm low, one arm high";
        return { repCount: this.repCounter, feedback };
      }
    }

    // State machine for single arm snatch to press
    if (this.snatchArm === "left") {
      switch (this.snatchState) {
        case "start":
          if (leftWristAtShoulder) {
            this.snatchState = "snatch";
            feedback = "Good snatch, now press overhead";
          } else if (leftWristOverhead) {
            this.snatchState = "press";
            feedback = "Now lower to complete the rep";
          } else {
            feedback = "Pull dumbbell to shoulder level";
          }
          break;

        case "snatch":
          if (leftWristOverhead) {
            this.snatchState = "press";
            feedback = "Good press, now lower to complete";
          } else {
            feedback = "Press dumbbell overhead";
          }
          break;

        case "press":
          if (leftWristLow) {
            this.snatchState = "start";
            this.repCounter++;
            feedback = "Good rep! Repeat movement";
          } else {
            feedback = "Lower dumbbell to starting position";
          }
          break;
      }
    } else if (this.snatchArm === "right") {
      switch (this.snatchState) {
        case "start":
          if (rightWristAtShoulder) {
            this.snatchState = "snatch";
            feedback = "Good snatch, now press overhead";
          } else if (rightWristOverhead) {
            this.snatchState = "press";
            feedback = "Now lower to complete the rep";
          } else {
            feedback = "Pull dumbbell to shoulder level";
          }
          break;

        case "snatch":
          if (rightWristOverhead) {
            this.snatchState = "press";
            feedback = "Good press, now lower to complete";
          } else {
            feedback = "Press dumbbell overhead";
          }
          break;

        case "press":
          if (rightWristLow) {
            this.snatchState = "start";
            this.repCounter++;
            feedback = "Good rep! Repeat movement";
          } else {
            feedback = "Lower dumbbell to starting position";
          }
          break;
      }
    }

    return { repCount: this.repCounter, feedback };
  }

  detectPullOver(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track upper body" };
    }

    // Check if lying on back (shoulders and hips at similar y positions)
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const isLyingFlat = Math.abs(shoulderY - hipY) < 30;

    if (!isLyingFlat) {
      return { repCount: this.repCounter, feedback: "Lie flat on your back" };
    }

    // Wrists position relative to shoulders for pullover motion
    const wristsAboveChest =
      leftWrist.y < shoulderY - 30 &&
      rightWrist.y < shoulderY - 30 &&
      Math.abs(leftWrist.x - rightWrist.x) < 50; // Hands together

    const wristsBehindHead =
      leftWrist.y > shoulderY + 30 &&
      rightWrist.y > shoulderY + 30 &&
      Math.abs(leftWrist.x - rightWrist.x) < 50; // Hands together

    let feedback = "";

    if (wristsAboveChest && this.lastState !== "chest") {
      this.lastState = "chest";
      feedback = "Good, now pull over behind head";
    } else if (wristsBehindHead && this.lastState === "chest") {
      this.lastState = "behind";
      this.repCounter++;
      feedback = "Good rep!";
    } else if (this.lastState === "chest") {
      feedback = "Lower weight behind head";
    } else {
      feedback = "Raise weight above chest";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectFlyBridge(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body position",
      };
    }

    // Check if in bridge position (hips elevated)
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipY = (leftHip.y + rightHip.y) / 2;
    const hipElevated = hipY < shoulderY - 20;

    // Calculate arm positions for fly movement
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const wristWidth = Math.abs(leftWrist.x - rightWrist.x);

    // Arms wide (fly out)
    const armsWide = wristWidth > shoulderWidth * 1.5;

    // Arms close (fly in)
    const armsClose = wristWidth < shoulderWidth * 0.8;

    let feedback = "";

    if (!hipElevated) {
      feedback = "Lift hips into bridge position";
      return { repCount: this.repCounter, feedback };
    }

    if (armsClose && this.lastState !== "close") {
      this.lastState = "close";
      feedback = "Good, now spread arms wide";
    } else if (armsWide && this.lastState === "close") {
      this.lastState = "wide";
      this.repCounter++;
      feedback = "Good rep!";
    } else if (this.lastState === "close") {
      feedback = "Spread arms wide for fly";
    } else {
      feedback = "Bring arms together";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectOverheadCircles(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Initialize position tracking
    if (!this.circlePositions) {
      this.circlePositions = [];
      this.circleQuadrants = {
        top: false,
        right: false,
        bottom: false,
        left: false,
      };
      this.circleComplete = false;
    }

    // Record wrist positions for tracking circle movement
    // Use average of both wrists
    const avgWristX = (leftWrist.x + rightWrist.x) / 2;
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;

    // Add current position to history (limit history to prevent memory issues)
    this.circlePositions.push({ x: avgWristX, y: avgWristY });
    if (this.circlePositions.length > 30) {
      this.circlePositions.shift();
    }

    // Calculate center point (around shoulder level)
    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const centerY = (leftShoulder.y + rightShoulder.y) / 2;

    // Check which quadrant the arms are in relative to center
    const inTopQuadrant = avgWristY < centerY - 50;
    const inRightQuadrant = avgWristX > centerX + 50;
    const inBottomQuadrant = avgWristY > centerY + 50;
    const inLeftQuadrant = avgWristX < centerX - 50;

    // Track if wrists have moved through each quadrant
    if (inTopQuadrant) this.circleQuadrants.top = true;
    if (inRightQuadrant) this.circleQuadrants.right = true;
    if (inBottomQuadrant) this.circleQuadrants.bottom = true;
    if (inLeftQuadrant) this.circleQuadrants.left = true;

    // Check if a complete circle has been made
    const hasCompletedCircle =
      this.circleQuadrants.top &&
      this.circleQuadrants.right &&
      this.circleQuadrants.bottom &&
      this.circleQuadrants.left;

    let feedback = "";

    if (hasCompletedCircle && !this.circleComplete) {
      this.circleComplete = true;
      this.repCounter++;
      feedback = "Good circle!";

      // Reset for next circle
      this.circleQuadrants = {
        top: false,
        right: false,
        bottom: false,
        left: false,
      };
      setTimeout(() => {
        this.circleComplete = false;
      }, 500);
    } else if (!hasCompletedCircle) {
      // Provide feedback on which direction to move
      if (!this.circleQuadrants.top) {
        feedback = "Raise arms overhead";
      } else if (!this.circleQuadrants.right) {
        feedback = "Move arms to the right";
      } else if (!this.circleQuadrants.bottom) {
        feedback = "Lower arms down";
      } else if (!this.circleQuadrants.left) {
        feedback = "Move arms to the left";
      } else {
        feedback = "Continue the circular motion";
      }
    } else {
      feedback = "Continue making circles";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectLRotation(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftWrist ||
      !rightWrist ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Initialize L-shape detection for each arm
    if (!this.lRotationState) {
      this.lRotationState = {
        left: "none", // none, l-shape, rotated
        right: "none",
        leftComplete: false,
        rightComplete: false,
      };
    }

    // Detect L-shape for both arms
    // Left arm L-shape: elbow bent at ~90 degrees, upper arm horizontal
    const leftUpperArmAngle =
      (Math.atan2(leftElbow.y - leftShoulder.y, leftElbow.x - leftShoulder.x) *
        180) /
      Math.PI;

    const leftLowerArmAngle =
      (Math.atan2(leftWrist.y - leftElbow.y, leftWrist.x - leftElbow.x) * 180) /
      Math.PI;

    // Normalize angles to 0-360
    const normLeftUpper = (leftUpperArmAngle + 360) % 360;
    const normLeftLower = (leftLowerArmAngle + 360) % 360;

    // L-shape: upper arm horizontal (0 or 180 ±30°), lower arm vertical (90 or 270 ±30°)
    const isLeftLShape =
      (Math.abs(normLeftUpper - 0) < 30 ||
        Math.abs(normLeftUpper - 180) < 30) &&
      (Math.abs(normLeftLower - 90) < 30 || Math.abs(normLeftLower - 270) < 30);

    // Rotated: both upper and lower arm not in L formation
    const isLeftRotated = !isLeftLShape;

    // Right arm calculations (similar logic)
    const rightUpperArmAngle =
      (Math.atan2(
        rightElbow.y - rightShoulder.y,
        rightElbow.x - rightShoulder.x
      ) *
        180) /
      Math.PI;

    const rightLowerArmAngle =
      (Math.atan2(rightWrist.y - rightElbow.y, rightWrist.x - rightElbow.x) *
        180) /
      Math.PI;

    const normRightUpper = (rightUpperArmAngle + 360) % 360;
    const normRightLower = (rightLowerArmAngle + 360) % 360;

    const isRightLShape =
      (Math.abs(normRightUpper - 0) < 30 ||
        Math.abs(normRightUpper - 180) < 30) &&
      (Math.abs(normRightLower - 90) < 30 ||
        Math.abs(normRightLower - 270) < 30);

    const isRightRotated = !isRightLShape;

    let feedback = "";

    // State machines for L rotation detection
    // Left arm
    if (isLeftLShape && this.lRotationState.left === "none") {
      this.lRotationState.left = "l-shape";
      feedback = "Good L position with left arm, now rotate";
    } else if (isLeftRotated && this.lRotationState.left === "l-shape") {
      this.lRotationState.left = "rotated";
      feedback = "Good rotation with left arm";
    } else if (isLeftLShape && this.lRotationState.left === "rotated") {
      this.lRotationState.left = "l-shape";
      this.lRotationState.leftComplete = true;
      feedback = "Left arm rotation complete";
    }

    // Right arm
    if (isRightLShape && this.lRotationState.right === "none") {
      this.lRotationState.right = "l-shape";
      feedback = "Good L position with right arm, now rotate";
    } else if (isRightRotated && this.lRotationState.right === "l-shape") {
      this.lRotationState.right = "rotated";
      feedback = "Good rotation with right arm";
    } else if (isRightLShape && this.lRotationState.right === "rotated") {
      this.lRotationState.right = "l-shape";
      this.lRotationState.rightComplete = true;
      feedback = "Right arm rotation complete";
    }

    // Count rep when both arms complete rotation
    if (this.lRotationState.leftComplete && this.lRotationState.rightComplete) {
      this.repCounter++;
      this.lRotationState.leftComplete = false;
      this.lRotationState.rightComplete = false;
      feedback = "Good rep! Repeat L rotations";
    } else if (
      this.lRotationState.left === "none" &&
      this.lRotationState.right === "none"
    ) {
      feedback = "Form L shapes with both arms";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSideFrontRaise(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");

    if (
      !leftWrist ||
      !rightWrist ||
      !leftShoulder ||
      !rightShoulder ||
      !leftElbow ||
      !rightElbow
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    // Initialize state tracking
    if (!this.raiseState) {
      this.raiseState = "down"; // down -> side -> front -> down
    }

    // Arms at sides (starting position)
    const armsDown =
      leftWrist.y > leftShoulder.y + 50 && rightWrist.y > rightShoulder.y + 50;

    // Arms raised to sides (side raise)
    const armsSideRaise =
      Math.abs(leftWrist.y - leftShoulder.y) < 30 &&
      Math.abs(rightWrist.y - rightShoulder.y) < 30 &&
      leftWrist.x < leftShoulder.x - 30 &&
      rightWrist.x > rightShoulder.x + 30;

    // Arms raised to front (front raise)
    const shoulderMidpointX = (leftShoulder.x + rightShoulder.x) / 2;
    const armsFrontRaise =
      Math.abs(leftWrist.y - leftShoulder.y) < 30 &&
      Math.abs(rightWrist.y - rightShoulder.y) < 30 &&
      Math.abs(leftWrist.x - shoulderMidpointX) < 50 &&
      Math.abs(rightWrist.x - shoulderMidpointX) < 50;

    let feedback = "";

    // State machine for side to front raise
    switch (this.raiseState) {
      case "down":
        if (armsSideRaise) {
          this.raiseState = "side";
          feedback = "Good side raise, now bring arms to front";
        } else if (armsFrontRaise) {
          this.raiseState = "front";
          feedback = "Good front raise, now lower arms";
        } else {
          feedback = "Start with arms at sides, then raise to shoulder height";
        }
        break;

      case "side":
        if (armsFrontRaise) {
          this.raiseState = "front";
          feedback = "Good transition to front, now lower arms";
        } else if (armsDown) {
          this.raiseState = "down";
          feedback = "Raise arms to the side first";
        } else {
          feedback = "Bring arms forward to shoulder height";
        }
        break;

      case "front":
        if (armsDown) {
          this.raiseState = "down";
          this.repCounter++;
          feedback = "Good rep! Repeat movement";
        } else {
          feedback = "Lower arms to complete the rep";
        }
        break;
    }

    return { repCount: this.repCounter, feedback };
  }

  //------------------------------------------------------------------------------
  // ================== BODYWEIGHT/WEIGHTFREE TRAINING EXERCISES ================
  //------------------------------------------------------------------------------

  detectPlank(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { timeHeld: this.timer, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { timeHeld: this.timer, feedback: "Cannot track body position" };
    }

    // Calculate body angle to check if body is straight
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    const ankleMidpoint = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2,
    };

    // Check if shoulders, hips, and ankles form a straight line
    const shoulderToHipAngle = Math.atan2(
      hipMidpoint.y - shoulderMidpoint.y,
      hipMidpoint.x - shoulderMidpoint.x
    );
    const hipToAnkleAngle = Math.atan2(
      ankleMidpoint.y - hipMidpoint.y,
      ankleMidpoint.x - hipMidpoint.x
    );

    const angleDifference = Math.abs(shoulderToHipAngle - hipToAnkleAngle);

    // Check if body is parallel to ground
    const isHorizontal = Math.abs(hipMidpoint.y - shoulderMidpoint.y) < 0.15; // Allowing slight variation

    let feedback = "";

    if (angleDifference < 0.15 && isHorizontal) {
      // Proper plank form
      this.timer += this.frameTime;
      feedback = "Good plank form!";
    } else if (!isHorizontal) {
      this.timer = 0;
      feedback = "Keep your body parallel to the ground";
    } else {
      this.timer = 0;
      feedback = "Straighten your body";
    }

    return { timeHeld: this.timer, feedback };
  }

  detectHipBridgeHold(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { timeHeld: this.timer, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee
    ) {
      return { timeHeld: this.timer, feedback: "Cannot track body position" };
    }

    // Calculate midpoints
    const shoulderMidpoint = {
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const hipMidpoint = {
      y: (leftHip.y + rightHip.y) / 2,
    };

    const kneeMidpoint = {
      y: (leftKnee.y + rightKnee.y) / 2,
    };

    // Hip bridge requires hips to be elevated above knees and shoulders
    const isHipElevated =
      hipMidpoint.y < shoulderMidpoint.y && hipMidpoint.y < kneeMidpoint.y;

    // Calculate hip to knee angle to ensure proper form
    const leftHipKneeAngle = calculateAngle(leftHip, leftKnee, leftShoulder);
    const rightHipKneeAngle = calculateAngle(
      rightHip,
      rightKnee,
      rightShoulder
    );

    // Proper hip bridge should have approximately 90 degree angles at knees
    const properKneeAngle =
      Math.abs(leftHipKneeAngle - 90) < 20 &&
      Math.abs(rightHipKneeAngle - 90) < 20;

    let feedback = "";

    if (isHipElevated && properKneeAngle) {
      this.timer += this.frameTime;
      feedback = "Good hip bridge form!";
    } else if (!isHipElevated) {
      this.timer = 0;
      feedback = "Raise your hips higher";
    } else {
      this.timer = 0;
      feedback = "Adjust your knee position";
    }

    return { timeHeld: this.timer, feedback };
  }

  detectSuperman(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { timeHeld: this.timer, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftWrist ||
      !rightWrist ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { timeHeld: this.timer, feedback: "Cannot track body position" };
    }

    // Calculate midpoints
    const shoulderMidpoint = {
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const hipMidpoint = {
      y: (leftHip.y + rightHip.y) / 2,
    };

    const wristMidpoint = {
      y: (leftWrist.y + rightWrist.y) / 2,
    };

    const ankleMidpoint = {
      y: (leftAnkle.y + rightAnkle.y) / 2,
    };

    // Superman pose: arms and legs extended, chest and thighs off ground
    // Arms should be extended forward (wrists above or below shoulders)
    const armsExtended = wristMidpoint.y < shoulderMidpoint.y;

    // Legs should be extended (ankles above or level with hips)
    const legsExtended = ankleMidpoint.y <= hipMidpoint.y + 0.1;

    // Chest should be lifted (shoulders above hips)
    const chestLifted = shoulderMidpoint.y < hipMidpoint.y;

    let feedback = "";

    if (armsExtended && legsExtended && chestLifted) {
      this.timer += this.frameTime;
      feedback = "Great superman form!";
    } else if (!armsExtended) {
      this.timer = 0;
      feedback = "Extend your arms forward";
    } else if (!legsExtended) {
      this.timer = 0;
      feedback = "Lift your legs higher";
    } else if (!chestLifted) {
      this.timer = 0;
      feedback = "Lift your chest";
    } else {
      this.timer = 0;
      feedback = "Adjust your position";
    }

    return { timeHeld: this.timer, feedback };
  }

  detectFlutterKicks(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { timeHeld: this.timer, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { timeHeld: this.timer, feedback: "Cannot track legs" };
    }

    // Calculate the vertical difference between ankles (to detect alternating leg movement)
    const ankleYDifference = Math.abs(leftAnkle.y - rightAnkle.y);

    // Ensure legs are relatively straight
    const leftLegStraightness = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightLegStraightness = calculateAngle(
      rightHip,
      rightKnee,
      rightAnkle
    );

    const legsAreRelativelyStraight =
      leftLegStraightness > 160 && rightLegStraightness > 160;

    // Check that legs are low (flutter kicks are typically performed close to ground)
    const hipMidpoint = {
      y: (leftHip.y + rightHip.y) / 2,
    };

    const ankleMidpoint = {
      y: (leftAnkle.y + rightAnkle.y) / 2,
    };

    const legsLowEnough = ankleMidpoint.y > hipMidpoint.y;

    // Flutter kicks require alternating legs with appropriate distance between them
    const properAlternatingMovement =
      ankleYDifference > 0.1 && ankleYDifference < 0.4;

    let feedback = "";

    if (
      legsAreRelativelyStraight &&
      legsLowEnough &&
      properAlternatingMovement
    ) {
      this.timer += this.frameTime;

      // Track movement speed
      if (
        this.previousAnkleDifference &&
        ((this.previousAnkleDifference < 0.1 && ankleYDifference > 0.2) ||
          (this.previousAnkleDifference > 0.2 && ankleYDifference < 0.1))
      ) {
        this.kickCounter++;
      }

      this.previousAnkleDifference = ankleYDifference;

      const kicksPerSecond = this.kickCounter / (this.timer / 1000);

      if (kicksPerSecond < 0.5) {
        feedback = "Speed up your kicks";
      } else if (kicksPerSecond > 3) {
        feedback = "Good pace, maintain control";
      } else {
        feedback = "Good flutter kicks!";
      }
    } else if (!legsAreRelativelyStraight) {
      this.timer = 0;
      feedback = "Keep your legs straighter";
    } else if (!legsLowEnough) {
      this.timer = 0;
      feedback = "Keep your legs lower";
    } else {
      this.timer = 0;
      feedback = "Alternate legs with small movements";
    }

    return { timeHeld: this.timer, kickCount: this.kickCounter, feedback };
  }

  detectWindshieldWipers(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { timeHeld: this.timer, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { timeHeld: this.timer, feedback: "Cannot track legs" };
    }

    // Calculate hip midpoint
    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    // Calculate ankle midpoint
    const ankleMidpoint = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2,
    };

    // For windshield wipers, legs should be extended and moving side to side
    // Check leg extension
    const leftLegExtension = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightLegExtension = calculateAngle(rightHip, rightKnee, rightAnkle);

    const legsExtended = leftLegExtension > 150 && rightLegExtension > 150;

    // Check lateral movement (x-axis difference between current and previous position)
    if (!this.previousAnkleMidpoint) {
      this.previousAnkleMidpoint = ankleMidpoint;
    }

    const lateralMovement = Math.abs(
      ankleMidpoint.x - this.previousAnkleMidpoint.x
    );

    // Track the direction of movement
    const movingRight = ankleMidpoint.x > this.previousAnkleMidpoint.x;

    // If direction changes, increment wiper count
    if (
      this.lastWiperDirection !== undefined &&
      this.lastWiperDirection !== movingRight
    ) {
      this.wiperCount++;
    }

    this.lastWiperDirection = movingRight;
    this.previousAnkleMidpoint = ankleMidpoint;

    let feedback = "";

    if (legsExtended && lateralMovement > 0.01) {
      this.timer += this.frameTime;

      if (lateralMovement < 0.05) {
        feedback = "Increase your range of motion";
      } else if (this.wiperCount / (this.timer / 1000) < 0.3) {
        feedback = "Try to move a bit faster";
      } else {
        feedback = "Good windshield wipers!";
      }
    } else if (!legsExtended) {
      this.timer = 0;
      feedback = "Keep your legs more extended";
    } else {
      this.timer = 0;
      feedback = "Move your legs side to side";
    }

    return { timeHeld: this.timer, wiperCount: this.wiperCount, feedback };
  }

  detectSidePlankDips(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { timeHeld: this.timer, feedback: "No data" };

    // For side plank, we need to detect which side the person is facing
    // We'll check shoulder alignment to determine this
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { timeHeld: this.timer, feedback: "Cannot track body position" };
    }

    // Determine which side the plank is on by checking which shoulder is more visible
    const isLeftSidePlank = leftShoulder.score > rightShoulder.score;

    // Reference points based on the side
    const topShoulder = isLeftSidePlank ? rightShoulder : leftShoulder;
    const bottomShoulder = isLeftSidePlank ? leftShoulder : rightShoulder;
    const topHip = isLeftSidePlank ? rightHip : leftHip;
    const bottomHip = isLeftSidePlank ? leftHip : rightHip;
    const topAnkle = isLeftSidePlank ? rightAnkle : leftAnkle;
    const bottomAnkle = isLeftSidePlank ? leftAnkle : rightAnkle;

    // Check if body is aligned for side plank
    const shoulderHipAlignment = Math.abs(topShoulder.x - topHip.x) < 0.15;
    const hipAnkleAlignment = Math.abs(topHip.x - topAnkle.x) < 0.2;

    // Track hip height for dips
    if (!this.previousHipHeight) {
      this.previousHipHeight = topHip.y;
      this.lowestHipPosition = topHip.y;
      this.highestHipPosition = topHip.y;
    }

    // Update highest and lowest points
    if (topHip.y < this.highestHipPosition) {
      this.highestHipPosition = topHip.y;
    }

    if (topHip.y > this.lowestHipPosition) {
      this.lowestHipPosition = topHip.y;
    }

    // Calculate dip range
    const dipRange = Math.abs(this.highestHipPosition - this.lowestHipPosition);

    // Detect direction change for counting dips
    const movingDown = topHip.y > this.previousHipHeight;

    if (
      this.lastDipDirection !== undefined &&
      this.lastDipDirection !== movingDown
    ) {
      if (!movingDown) {
        // Changing from down to up completes a dip
        this.dipCount++;
      }
    }

    this.lastDipDirection = movingDown;
    this.previousHipHeight = topHip.y;

    let feedback = "";

    if (shoulderHipAlignment && hipAnkleAlignment) {
      this.timer += this.frameTime;

      if (dipRange < 0.05) {
        feedback = "Increase your hip dip range";
      } else if (this.dipCount / (this.timer / 1000) < 0.2) {
        feedback = "Try to dip at a steady pace";
      } else {
        feedback = `Good side plank dips on ${isLeftSidePlank ? "left" : "right"
          } side!`;
      }
    } else if (!shoulderHipAlignment) {
      this.timer = 0;
      feedback = "Align your shoulders and hips";
    } else if (!hipAnkleAlignment) {
      this.timer = 0;
      feedback = "Keep your body in a straight line";
    } else {
      this.timer = 0;
      feedback = "Adjust your side plank position";
    }

    return { timeHeld: this.timer, dipCount: this.dipCount, feedback };
  }

  detectPushUp(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");

    if (!leftElbow || !rightElbow || !leftShoulder || !leftWrist) {
      return { repCount: this.repCounter, feedback: "Cannot track arms" };
    }

    const angle = calculateAngle(leftShoulder, leftElbow, leftWrist);

    let feedback = "";

    if (angle < 90 && this.lastState !== "down") {
      this.repCounter++;
      this.lastState = "down";
      feedback = "Good push-up!";
    } else if (angle > 160 && this.lastState === "down") {
      this.lastState = "up";
      feedback = "Ready for next rep";
    } else if (this.lastState === "down") {
      feedback = "Push back up";
    } else if (angle > 120) {
      feedback = "Lower your body";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectRussianTwistBodyweight(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftWrist ||
      !rightWrist ||
      !leftHip ||
      !rightHip
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track upper body" };
    }

    // Calculate midpoints
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    const wristMidpoint = {
      x: (leftWrist.x + rightWrist.x) / 2,
      y: (leftWrist.y + rightWrist.y) / 2,
    };

    // For Russian twists, we need to detect the rotational movement
    // Track the lateral position of wrists relative to shoulders
    const wristShoulderXOffset = wristMidpoint.x - shoulderMidpoint.x;

    // Track direction of rotation
    if (this.lastWristOffset === undefined) {
      this.lastWristOffset = wristShoulderXOffset;
      this.maxRightRotation = 0;
      this.maxLeftRotation = 0;
    }

    // Update maximum rotation extents
    if (wristShoulderXOffset > this.maxRightRotation) {
      this.maxRightRotation = wristShoulderXOffset;
    }

    if (wristShoulderXOffset < this.maxLeftRotation) {
      this.maxLeftRotation = wristShoulderXOffset;
    }

    // Calculate rotation range
    const rotationRange = this.maxRightRotation - this.maxLeftRotation;

    // Detect direction change for counting reps
    const isRotatingRight = wristShoulderXOffset > this.lastWristOffset;

    // Check if seated in V position (torso leaning back)
    const isSeated = shoulderMidpoint.y > hipMidpoint.y - 0.1;

    // Check if direction changed and passed midpoint (half rep)
    if (
      this.lastRotationDirection !== undefined &&
      this.lastRotationDirection !== isRotatingRight &&
      ((isRotatingRight && wristShoulderXOffset > 0) ||
        (!isRotatingRight && wristShoulderXOffset < 0))
    ) {
      this.halfRepCounter++;

      // Two half reps make one full rep
      if (this.halfRepCounter % 2 === 0) {
        this.repCounter++;
      }
    }

    this.lastRotationDirection = isRotatingRight;
    this.lastWristOffset = wristShoulderXOffset;

    let feedback = "";

    if (isSeated) {
      if (rotationRange < 0.2) {
        feedback = "Rotate further to each side";
      } else if (Math.abs(wristShoulderXOffset) < 0.05) {
        feedback = "Twist to the side";
      } else if (isRotatingRight) {
        feedback = "Twisting right";
      } else {
        feedback = "Twisting left";
      }
    } else {
      feedback = "Lean back in V-sit position";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectLegRaiseThrust(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body position",
      };
    }

    // Calculate midpoints
    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    const kneeMidpoint = {
      x: (leftKnee.x + rightKnee.x) / 2,
      y: (leftKnee.y + rightKnee.y) / 2,
    };

    const ankleMidpoint = {
      x: (leftAnkle.x + rightAnkle.x) / 2,
      y: (leftAnkle.y + rightAnkle.y) / 2,
    };

    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };

    // Track leg position relative to hip
    const legHeight = hipMidpoint.y - ankleMidpoint.y;

    // Track hip thrust (hip height relative to shoulders)
    const hipThrust = shoulderMidpoint.y - hipMidpoint.y;

    // Check if legs are relatively straight
    const leftLegStraightness = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightLegStraightness = calculateAngle(
      rightHip,
      rightKnee,
      rightAnkle
    );

    const legsAreStraight =
      leftLegStraightness > 150 && rightLegStraightness > 150;

    // Track the raising and lowering motion
    if (this.lastLegHeight === undefined) {
      this.lastLegHeight = legHeight;
      this.lastHipThrust = hipThrust;
      this.legRaisePhase = false;
      this.hipThrustPhase = false;
    }

    const isRaisingLegs = legHeight > this.lastLegHeight;
    const isThrusting = hipThrust > this.lastHipThrust;

    // State machine for the exercise
    // Phase 1: Leg raise
    // Phase 2: Hip thrust
    // Both phases must be completed for a rep

    if (!this.legRaisePhase && isRaisingLegs && legHeight > 0.2) {
      this.legRaisePhase = true;
    } else if (
      this.legRaisePhase &&
      !this.hipThrustPhase &&
      isThrusting &&
      hipThrust > 0.05
    ) {
      this.hipThrustPhase = true;
    } else if (
      this.legRaisePhase &&
      this.hipThrustPhase &&
      !isRaisingLegs &&
      !isThrusting &&
      legHeight < 0.1 &&
      hipThrust < 0.02
    ) {
      // Complete rep when legs are lowered and hips return to ground
      this.repCounter++;
      this.legRaisePhase = false;
      this.hipThrustPhase = false;
    }

    this.lastLegHeight = legHeight;
    this.lastHipThrust = hipThrust;

    let feedback = "";

    if (legsAreStraight) {
      if (!this.legRaisePhase) {
        feedback = "Raise your legs";
      } else if (!this.hipThrustPhase) {
        feedback = "Now thrust your hips upward";
      } else {
        feedback = "Great form! Lower slowly";
      }
    } else {
      feedback = "Keep your legs straighter";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectChairSquat(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate hip height
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    // Calculate knee height
    const kneeHeight = (leftKnee.y + rightKnee.y) / 2;

    // Calculate ankle height
    const ankleHeight = (leftAnkle.y + rightAnkle.y) / 2;

    // Calculate knee angle (to detect squat depth)
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Chair squat is detected by tracking vertical hip movement and knee angle
    // Deep squat should have knee angle around 90 degrees

    if (this.lastHipHeight === undefined) {
      this.lastHipHeight = hipHeight;
      this.squatState = "standing";
      this.minKneeAngle = 180;
    }

    const isSquatting = hipHeight > this.lastHipHeight;

    // Update minimum knee angle
    if (kneeAngle < this.minKneeAngle) {
      this.minKneeAngle = kneeAngle;
    }

    // State machine for squat
    if (this.squatState === "standing" && isSquatting && kneeAngle < 150) {
      this.squatState = "descending";
    } else if (
      this.squatState === "descending" &&
      !isSquatting &&
      this.minKneeAngle < 120
    ) {
      this.squatState = "ascending";
    } else if (this.squatState === "ascending" && kneeAngle > 160) {
      this.repCounter++;
      this.squatState = "standing";
      this.minKneeAngle = 180;
    }

    this.lastHipHeight = hipHeight;

    let feedback = "";

    if (this.squatState === "standing") {
      feedback = "Start squatting down";
    } else if (this.squatState === "descending") {
      if (kneeAngle > 120) {
        feedback = "Squat deeper";
      } else {
        feedback = "Good depth, push back up";
      }
    } else if (this.squatState === "ascending") {
      feedback = "Stand up fully to complete rep";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectReverseLunge(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Calculate horizontal distance between feet (for lunge stance)
    const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);

    // Calculate vertical hip position
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    // For reverse lunge, we need to detect:
    // 1. Stepping back (one foot behind the other)
    // 2. Lowering into lunge position (both knees bent)
    // 3. Returning to standing position

    if (this.lastHipHeight === undefined) {
      this.lastHipHeight = hipHeight;
      this.lungeState = "standing";
      this.minKneeAngle = 180;
      this.maxAnkleDistance = 0;
    }

    // Update tracking variables
    if (ankleDistance > this.maxAnkleDistance) {
      this.maxAnkleDistance = ankleDistance;
    }

    this.minKneeAngle = Math.min(
      this.minKneeAngle,
      Math.min(leftKneeAngle, rightKneeAngle)
    );

    const isLowering = hipHeight > this.lastHipHeight;
    const isRising = hipHeight < this.lastHipHeight && hipHeight < 0.6; // Threshold to detect rising

    // State machine for lunge
    if (this.lungeState === "standing" && ankleDistance > 0.3 && isLowering) {
      this.lungeState = "stepping";
    } else if (
      this.lungeState === "stepping" &&
      this.minKneeAngle < 120 &&
      ankleDistance > 0.3
    ) {
      this.lungeState = "lowering";
    } else if (this.lungeState === "lowering" && isRising) {
      this.lungeState = "rising";
    } else if (
      this.lungeState === "rising" &&
      ankleDistance < 0.2 &&
      Math.min(leftKneeAngle, rightKneeAngle) > 160
    ) {
      this.repCounter++;
      this.lungeState = "standing";
      this.minKneeAngle = 180;
      this.maxAnkleDistance = 0;
    }

    this.lastHipHeight = hipHeight;

    let feedback = "";

    if (this.lungeState === "standing") {
      feedback = "Step one leg back into lunge position";
    } else if (this.lungeState === "stepping") {
      feedback = "Lower into lunge, bend both knees";
    } else if (this.lungeState === "lowering") {
      feedback = "Good depth, push back up";
    } else if (this.lungeState === "rising") {
      feedback = "Return to standing position";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectFireHydrants(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // First, detect which leg is performing the fire hydrant
    // This is typically the leg that moves outward from the hip
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate the horizontal distance of knee from hip for both legs
    const leftKneeOffset = Math.abs(leftKnee.x - leftHip.x);
    const rightKneeOffset = Math.abs(rightKnee.x - rightHip.x);

    // The working leg is the one with greater knee offset from hip
    const isLeftLegWorking = leftKneeOffset > rightKneeOffset;

    // Get the appropriate hip, knee, and ankle based on working leg
    const workingHip = isLeftLegWorking ? leftHip : rightHip;
    const workingKnee = isLeftLegWorking ? leftKnee : rightKnee;
    const workingAnkle = isLeftLegWorking ? leftAnkle : rightAnkle;

    // Calculate the vertical and horizontal offset of knee from hip
    const kneeHorizontalOffset = Math.abs(workingKnee.x - workingHip.x);
    const kneeVerticalOffset = Math.abs(workingKnee.y - workingHip.y);

    // Calculate angle between hip and knee in horizontal plane
    const kneeOutwardAngle =
      Math.atan2(kneeHorizontalOffset, kneeVerticalOffset) * (180 / Math.PI);

    if (!this.maxKneeAngle) {
      this.maxKneeAngle = 0;
      this.minKneeAngle = 90;
      this.fireHydrantState = "starting";
      this.previousLegWorking = isLeftLegWorking;
    }

    // Detect if user switched legs
    if (this.previousLegWorking !== isLeftLegWorking) {
      this.maxKneeAngle = 0;
      this.minKneeAngle = 90;
      this.fireHydrantState = "starting";
      this.previousLegWorking = isLeftLegWorking;
    }

    // Update max and min angles
    if (kneeOutwardAngle > this.maxKneeAngle) {
      this.maxKneeAngle = kneeOutwardAngle;
    }

    if (kneeOutwardAngle < this.minKneeAngle) {
      this.minKneeAngle = kneeOutwardAngle;
    }

    // Is knee moving outward or inward
    const isMovingOutward = kneeOutwardAngle > this.lastKneeAngle;

    // State machine for fire hydrant
    if (
      this.fireHydrantState === "starting" &&
      isMovingOutward &&
      kneeOutwardAngle > 30
    ) {
      this.fireHydrantState = "raising";
    } else if (
      this.fireHydrantState === "raising" &&
      !isMovingOutward &&
      this.maxKneeAngle > 45
    ) {
      this.fireHydrantState = "lowering";
    } else if (this.fireHydrantState === "lowering" && kneeOutwardAngle < 20) {
      this.repCounter++;
      this.fireHydrantState = "starting";
      this.maxKneeAngle = 0;
      this.minKneeAngle = 90;
    }

    this.lastKneeAngle = kneeOutwardAngle;

    let feedback = "";

    if (this.fireHydrantState === "starting") {
      feedback = `Start raising your ${isLeftLegWorking ? "left" : "right"
        } leg outward`;
    } else if (this.fireHydrantState === "raising") {
      if (this.maxKneeAngle < 45) {
        feedback = "Raise your leg higher";
      } else {
        feedback = "Good height, hold briefly";
      }
    } else if (this.fireHydrantState === "lowering") {
      feedback = "Lower your leg to complete the rep";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectLungePulse(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate horizontal distance between feet (for lunge stance)
    const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);

    // Check if in lunge stance
    const isInLungeStance = ankleDistance > 0.3;

    if (!isInLungeStance) {
      return {
        repCount: this.repCounter,
        feedback: "Get into lunge position, one foot forward",
      };
    }

    // Calculate vertical hip position
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    // For lunge pulses, we need to detect small up and down movements while in lunge position
    if (this.lastHipHeight === undefined) {
      this.lastHipHeight = hipHeight;
      this.pulseDirection = null;
      this.pulseRange = 0;
      this.minHipHeight = hipHeight;
      this.maxHipHeight = hipHeight;
    }

    // Update min and max hip heights to track pulse range
    if (hipHeight < this.minHipHeight) {
      this.minHipHeight = hipHeight;
    }

    if (hipHeight > this.maxHipHeight) {
      this.maxHipHeight = hipHeight;
    }

    // Calculate the pulse range
    this.pulseRange = this.maxHipHeight - this.minHipHeight;

    // Detect direction change
    const isMovingUp = hipHeight < this.lastHipHeight;

    if (this.pulseDirection === "down" && isMovingUp) {
      this.pulseDirection = "up";

      // Count the pulse rep (bottom of movement)
      if (this.pulseRange > 0.02 && this.pulseRange < 0.15) {
        this.repCounter++;

        // Reset the tracking for next pulse
        this.minHipHeight = hipHeight;
        this.maxHipHeight = hipHeight;
        this.pulseRange = 0;
      }
    } else if (this.pulseDirection === "up" && !isMovingUp) {
      this.pulseDirection = "down";
    } else if (this.pulseDirection === null) {
      this.pulseDirection = isMovingUp ? "up" : "down";
    }

    this.lastHipHeight = hipHeight;

    let feedback = "";

    // Calculate knee angles to check lunge form
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const minKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);

    if (minKneeAngle > 140) {
      feedback = "Bend your knees more";
    } else if (this.pulseRange > 0.15) {
      feedback = "Use smaller pulse movements";
    } else if (this.pulseRange < 0.02) {
      feedback = "Pulse up and down slightly";
    } else if (this.pulseDirection === "down") {
      feedback = "Pulse down";
    } else {
      feedback = "Pulse up";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSumoSquatBodyweight(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate hip height
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    // Calculate horizontal distance between feet (for sumo stance)
    const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);

    // Sumo squat requires a wide stance
    const isWideStance = ankleDistance > 0.3;

    if (!isWideStance) {
      return {
        repCount: this.repCounter,
        feedback: "Widen your stance for sumo position",
      };
    }

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Check for toe position (should be turned outward in sumo)
    // This is an approximation as we don't have direct toe keypoints
    const leftKneeToAnkleVector = {
      x: leftAnkle.x - leftKnee.x,
      y: leftAnkle.y - leftKnee.y,
    };

    const rightKneeToAnkleVector = {
      x: rightAnkle.x - rightKnee.x,
      y: rightAnkle.y - rightKnee.y,
    };

    // Detect if feet are turned outward
    const leftFootAngle =
      Math.atan2(leftKneeToAnkleVector.y, leftKneeToAnkleVector.x) *
      (180 / Math.PI);
    const rightFootAngle =
      Math.atan2(rightKneeToAnkleVector.y, rightKneeToAnkleVector.x) *
      (180 / Math.PI);

    // Feet should be pointing outward in sumo squat
    const feetPointingOutward = leftFootAngle < -10 && rightFootAngle > 10;

    // For the squat detection
    if (this.lastHipHeight === undefined) {
      this.lastHipHeight = hipHeight;
      this.squatState = "standing";
      this.minKneeAngle = 180;
    }

    const isSquatting = hipHeight > this.lastHipHeight;

    // Update min knee angle
    const kneeAngle = Math.min(leftKneeAngle, rightKneeAngle);
    if (kneeAngle < this.minKneeAngle) {
      this.minKneeAngle = kneeAngle;
    }

    // State machine for squat
    if (this.squatState === "standing" && isSquatting && kneeAngle < 150) {
      this.squatState = "descending";
    } else if (
      this.squatState === "descending" &&
      !isSquatting &&
      this.minKneeAngle < 120
    ) {
      this.squatState = "ascending";
    } else if (this.squatState === "ascending" && kneeAngle > 160) {
      this.repCounter++;
      this.squatState = "standing";
      this.minKneeAngle = 180;
    }

    this.lastHipHeight = hipHeight;

    let feedback = "";

    if (!feetPointingOutward) {
      feedback = "Turn your toes outward";
    } else if (this.squatState === "standing") {
      feedback = "Begin squatting down with knees out";
    } else if (this.squatState === "descending") {
      if (kneeAngle > 120) {
        feedback = "Squat deeper, knees out";
      } else {
        feedback = "Good depth, push through heels";
      }
    } else if (this.squatState === "ascending") {
      feedback = "Stand tall to complete rep";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectCurtsyLunge(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate hip height for vertical movement tracking
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    // Detect which leg is crossing behind (the working leg in curtsy lunge)
    // In a curtsy lunge, one leg crosses behind the other
    const ankleXDifference = leftAnkle.x - rightAnkle.x;
    const kneeXDifference = leftKnee.x - rightKnee.x;

    // If ankle and knee x-positions don't align in same order, a leg is likely crossing
    const isCrossed = ankleXDifference * kneeXDifference < 0;

    if (!isCrossed) {
      return {
        repCount: this.repCounter,
        feedback: "Cross one leg behind the other for curtsy position",
      };
    }

    // Determine which leg is crossing behind
    const isLeftLegCrossing =
      Math.abs(leftAnkle.x - rightHip.x) < Math.abs(rightAnkle.x - leftHip.x);

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Track vertical movement for curtsy lunge
    if (this.lastHipHeight === undefined) {
      this.lastHipHeight = hipHeight;
      this.curtsyState = "standing";
      this.minKneeAngle = 180;
      this.previousLegCrossing = isLeftLegCrossing;
    }

    // Detect if user switched legs
    if (this.previousLegCrossing !== isLeftLegCrossing) {
      this.curtsyState = "standing";
      this.minKneeAngle = 180;
      this.previousLegCrossing = isLeftLegCrossing;
    }

    const isLowering = hipHeight > this.lastHipHeight;

    // Update min knee angle
    const frontKneeAngle = isLeftLegCrossing ? rightKneeAngle : leftKneeAngle;
    if (frontKneeAngle < this.minKneeAngle) {
      this.minKneeAngle = frontKneeAngle;
    }

    // State machine for curtsy lunge
    if (this.curtsyState === "standing" && isLowering && frontKneeAngle < 150) {
      this.curtsyState = "lowering";
    } else if (
      this.curtsyState === "lowering" &&
      !isLowering &&
      this.minKneeAngle < 120
    ) {
      this.curtsyState = "rising";
    } else if (this.curtsyState === "rising" && frontKneeAngle > 160) {
      this.repCounter++;
      this.curtsyState = "standing";
      this.minKneeAngle = 180;
    }

    this.lastHipHeight = hipHeight;

    let feedback = "";

    if (this.curtsyState === "standing") {
      feedback = `Lower into curtsy with ${isLeftLegCrossing ? "left" : "right"
        } leg behind`;
    } else if (this.curtsyState === "lowering") {
      if (frontKneeAngle > 120) {
        feedback = "Lower deeper, keep front knee aligned";
      } else {
        feedback = "Good depth, hold briefly";
      }
    } else if (this.curtsyState === "rising") {
      feedback = "Stand tall to complete rep";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSquatPulse(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate knee angle (angle between hip, knee, and ankle)
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    let feedback = "";

    // For squat pulse, we're looking for small changes in knee angle in the squatted position
    // Define squatted position as knee angle around 100-140 degrees
    if (avgKneeAngle > 100 && avgKneeAngle < 140) {
      // Track small changes in angle for pulses
      if (!this.lastKneeAngle) {
        this.lastKneeAngle = avgKneeAngle;
      }

      // Detect pulse based on change in knee angle direction
      const angleChange = avgKneeAngle - this.lastKneeAngle;

      // Detect change in direction for pulse
      if (angleChange > 5 && this.lastDirection === "down") {
        this.lastDirection = "up";
        this.repCounter++;
        feedback = "Good pulse!";
      } else if (angleChange < -5 && this.lastDirection === "up") {
        this.lastDirection = "down";
        feedback = "Ready for next pulse";
      } else if (!this.lastDirection) {
        this.lastDirection = angleChange > 0 ? "up" : "down";
        feedback = "Maintain squat position and pulse";
      }

      this.lastKneeAngle = avgKneeAngle;
    } else if (avgKneeAngle >= 140) {
      feedback = "Lower down into squat position";
      this.lastDirection = null;
    } else {
      feedback = "Squat too deep, come up slightly";
      this.lastDirection = null;
    }

    return { repCount: this.repCounter, feedback };
  }

  detectStandingLegRaise(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate the distance between ankles to detect leg raise
    const ankleDistance = Math.sqrt(
      Math.pow(leftAnkle.x - rightAnkle.x, 2) +
      Math.pow(leftAnkle.y - rightAnkle.y, 2)
    );

    // Calculate hip width for normalization
    const hipWidth = Math.abs(leftHip.x - rightHip.x);

    // Normalize ankle distance with hip width
    const normalizedDistance = ankleDistance / hipWidth;

    let feedback = "";

    // Check if legs are raised to the side
    if (normalizedDistance > 2.0 && this.lastState !== "raised") {
      this.repCounter++;
      this.lastState = "raised";
      feedback = "Good leg raise!";
    } else if (normalizedDistance < 1.3 && this.lastState === "raised") {
      this.lastState = "center";
      feedback = "Ready for next rep";
    } else if (this.lastState === "raised") {
      feedback = "Bring legs together";
    } else {
      feedback = "Raise leg to the side";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectCalfRaises(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftHeel = getKeypointByName(smoothedKeypoints, "left_heel");
    const rightHeel = getKeypointByName(smoothedKeypoints, "right_heel");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (!leftAnkle || !rightAnkle || !leftShoulder || !rightShoulder) {
      return { repCount: this.repCounter, feedback: "Cannot track body" };
    }

    // Use shoulders to ankles vertical distance as reference
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
    const referenceHeight = Math.abs(shoulderY - ankleY);

    // Calculate the current heel lift by checking vertical distance
    // between ankles and heels
    const heelLift =
      leftHeel && rightHeel
        ? (leftAnkle.y - leftHeel.y + (rightAnkle.y - rightHeel.y)) / 2
        : 0;

    // Normalize heel lift with reference height
    const normalizedLift = heelLift / referenceHeight;

    let feedback = "";

    // Detect raised heels for calf raise
    if (normalizedLift > 0.08 && this.lastState !== "raised") {
      this.repCounter++;
      this.lastState = "raised";
      feedback = "Good calf raise!";
    } else if (normalizedLift < 0.03 && this.lastState === "raised") {
      this.lastState = "flat";
      feedback = "Ready for next rep";
    } else if (this.lastState === "raised") {
      feedback = "Lower heels to ground";
    } else {
      feedback = "Raise up onto toes";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectAssistedKickbacks(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // For kickbacks, we need to detect which leg is being used
    // For simplicity, let's track both legs and detect the one that's moving more

    // Calculate angles between hip, knee, and ankle for both legs
    const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Store the previous angles if not stored
    if (!this.prevLeftAngle) this.prevLeftAngle = leftLegAngle;
    if (!this.prevRightAngle) this.prevRightAngle = rightLegAngle;

    // Calculate change in angles
    const leftAngleChange = Math.abs(leftLegAngle - this.prevLeftAngle);
    const rightAngleChange = Math.abs(rightLegAngle - this.prevRightAngle);

    // Determine which leg is active
    const activeLeg = leftAngleChange > rightAngleChange ? "left" : "right";
    const activeAngle = activeLeg === "left" ? leftLegAngle : rightLegAngle;

    let feedback = "";

    // Kickback is detected when leg is extended (angle close to 180 degrees)
    if (activeAngle > 160 && this.lastState !== "extended") {
      this.repCounter++;
      this.lastState = "extended";
      feedback = `Good kickback with ${activeLeg} leg!`;
    } else if (activeAngle < 130 && this.lastState === "extended") {
      this.lastState = "bent";
      feedback = "Ready for next rep";
    } else if (this.lastState === "extended") {
      feedback = "Bring leg back";
    } else {
      feedback = "Extend leg back";
    }

    // Update previous angles
    this.prevLeftAngle = leftLegAngle;
    this.prevRightAngle = rightLegAngle;

    return { repCount: this.repCounter, feedback };
  }

  detectClockLunge(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate center point between hips
    const centerX = (leftHip.x + rightHip.x) / 2;
    const centerY = (leftHip.y + rightHip.y) / 2;

    // Calculate angle of each ankle relative to center
    const leftAnkleAngle =
      (Math.atan2(leftAnkle.y - centerY, leftAnkle.x - centerX) * 180) /
      Math.PI;
    const rightAnkleAngle =
      (Math.atan2(rightAnkle.y - centerY, rightAnkle.x - centerX) * 180) /
      Math.PI;

    // Normalize angles to 0-360
    const normalizedLeftAngle = (leftAnkleAngle + 360) % 360;
    const normalizedRightAngle = (rightAnkleAngle + 360) % 360;

    // Calculate knee angles to detect proper lunge depth
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Track the "clock positions" that have been completed
    if (!this.clockPositions) {
      this.clockPositions = new Set();
    }

    // Define clock positions (typically 12, 3, 6, 9 for simplified clock lunges)
    const clockPositions = {
      12: { min: 345, max: 15 },
      3: { min: 75, max: 105 },
      6: { min: 165, max: 195 },
      9: { min: 255, max: 285 },
    };

    let currentPosition = null;
    let feedback = "";

    // Check if either leg is in a clock position
    for (const [position, angles] of Object.entries(clockPositions)) {
      // Special case for position 12 which crosses 0/360 boundary
      if (position === "12") {
        if (
          normalizedLeftAngle >= angles.min ||
          normalizedLeftAngle <= angles.max ||
          normalizedRightAngle >= angles.min ||
          normalizedRightAngle <= angles.max
        ) {
          currentPosition = position;
          break;
        }
      } else {
        if (
          (normalizedLeftAngle >= angles.min &&
            normalizedLeftAngle <= angles.max) ||
          (normalizedRightAngle >= angles.min &&
            normalizedRightAngle <= angles.max)
        ) {
          currentPosition = position;
          break;
        }
      }
    }

    // Check if in lunge position based on knee angle
    const inLungePosition = leftKneeAngle < 130 || rightKneeAngle < 130;

    if (currentPosition && inLungePosition) {
      // If this is a new position
      if (!this.clockPositions.has(currentPosition)) {
        this.clockPositions.add(currentPosition);
        this.repCounter++;
        feedback = `Good lunge at ${currentPosition} o'clock!`;
      } else {
        feedback = `Holding ${currentPosition} o'clock position`;
      }
    } else if (this.lastState === "lunge" && !inLungePosition) {
      this.lastState = "standing";
      feedback = "Return to center";
    } else if (currentPosition && !inLungePosition) {
      feedback = `Deepen lunge at ${currentPosition} o'clock`;
    } else {
      feedback = "Move to next clock position";
      this.lastState = "standing";
    }

    // Reset positions if all clock positions completed
    if (this.clockPositions.size >= 4) {
      this.clockPositions.clear();
      feedback = "Great job! Clock completed. Starting next round.";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectHipBridgeCircle(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track hips/shoulders",
      };
    }

    // Calculate the midpoint of hips
    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;

    // Calculate the midpoint of shoulders
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

    // Calculate the height of hips relative to shoulders
    // In a bridge, hips should be elevated
    const hipHeight = shoulderMidY - hipMidY;

    // Calculate shoulder width for normalization
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    // Normalize hip height
    const normalizedHeight = hipHeight / shoulderWidth;

    // Track the trajectory of hips for circle detection
    if (!this.hipPositions) {
      this.hipPositions = [];
    }

    // Only track positions when hips are elevated (in bridge position)
    if (normalizedHeight > 0.3) {
      // Add current position to trajectory
      this.hipPositions.push({ x: hipMidX, y: hipMidY });

      // Keep only last 20 positions to detect recent movement
      if (this.hipPositions.length > 20) {
        this.hipPositions.shift();
      }

      // Detect circular motion by calculating direction changes
      if (this.hipPositions.length >= 10) {
        const directions = [];
        for (let i = 2; i < this.hipPositions.length; i++) {
          const prev = this.hipPositions[i - 2];
          const curr = this.hipPositions[i];

          // Calculate direction vector
          const dirX = curr.x - prev.x;
          const dirY = curr.y - prev.y;

          // Calculate angle of movement
          const angle = (Math.atan2(dirY, dirX) * 180) / Math.PI;
          directions.push((angle + 360) % 360);
        }

        // Check if directions cover at least 270 degrees (3/4 of circle)
        const minAngle = Math.min(...directions);
        const maxAngle = Math.max(...directions);
        const angleRange = maxAngle - minAngle;

        // If we've completed circle motion
        if (
          angleRange > 270 ||
          (this.lastCircleTime && Date.now() - this.lastCircleTime > 2000)
        ) {
          this.repCounter++;
          this.lastCircleTime = Date.now();
          this.hipPositions = []; // Reset for next circle
          return { repCount: this.repCounter, feedback: "Great hip circle!" };
        }
      }

      return { repCount: this.repCounter, feedback: "Continue circling hips" };
    } else {
      this.hipPositions = []; // Reset when not in bridge
      return {
        repCount: this.repCounter,
        feedback: "Lift hips higher into bridge position",
      };
    }
  }

  detectKneePushUp(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftElbow ||
      !rightElbow ||
      !leftWrist ||
      !rightWrist
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track upper body" };
    }

    // Calculate elbow angles
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    // Average elbow angle
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // Check if knees are on the ground - may need adjustment based on camera angle
    const kneePosition =
      leftKnee && rightKnee ? (leftKnee.y + rightKnee.y) / 2 : null;

    let feedback = "";

    // Knee push-up is a push-up with knees on ground
    // Detect down position (arms bent)
    if (avgElbowAngle < 100 && this.lastState !== "down") {
      this.lastState = "down";
      feedback = "Good depth";
    }
    // Detect up position (arms extended)
    else if (avgElbowAngle > 160 && this.lastState === "down") {
      this.repCounter++;
      this.lastState = "up";
      feedback = "Good knee push-up!";
    }
    // Guidance based on current position
    else if (this.lastState === "down") {
      feedback = "Push up";
    } else {
      feedback = "Lower down";
    }

    // Check if knees are properly positioned
    if (kneePosition && leftShoulder && rightShoulder) {
      const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      if (kneePosition < shoulderY) {
        feedback += ". Ensure knees are on ground";
      }
    }

    return { repCount: this.repCounter, feedback };
  }

  detectWideNarrowPushUp(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftElbow ||
      !rightElbow ||
      !leftWrist ||
      !rightWrist
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track upper body" };
    }

    // Calculate elbow angles to detect push-up
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    // Average elbow angle
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // Calculate hand position (wide vs narrow)
    const handDistance = Math.sqrt(
      Math.pow(leftWrist.x - rightWrist.x, 2) +
      Math.pow(leftWrist.y - rightWrist.y, 2)
    );

    // Calculate shoulder width for normalization
    const shoulderWidth = Math.sqrt(
      Math.pow(leftShoulder.x - rightShoulder.x, 2) +
      Math.pow(leftShoulder.y - rightShoulder.y, 2)
    );

    // Normalize hand distance
    const normalizedHandDistance = handDistance / shoulderWidth;

    // Initialize hand position state if not set
    if (!this.handPosition) {
      this.handPosition = normalizedHandDistance > 1.2 ? "wide" : "narrow";
    }

    let feedback = "";

    // Detect push-up movement
    if (avgElbowAngle < 100 && this.lastState !== "down") {
      this.lastState = "down";
      feedback = `Good ${this.handPosition} position, now push up`;
    } else if (avgElbowAngle > 160 && this.lastState === "down") {
      this.repCounter++;
      this.lastState = "up";

      // Check if hand position should change for next rep
      if (this.handPosition === "wide") {
        this.handPosition = "narrow";
        feedback = "Good wide push-up! Now bring hands closer together";
      } else {
        this.handPosition = "wide";
        feedback = "Good narrow push-up! Now move hands wider apart";
      }
    }
    // Guidance based on current state
    else if (this.lastState === "up") {
      // Check if hands are in correct position for next rep
      if (
        (this.handPosition === "wide" && normalizedHandDistance < 1.2) ||
        (this.handPosition === "narrow" && normalizedHandDistance > 1.2)
      ) {
        feedback = `Adjust hand position to ${this.handPosition} stance`;
      } else {
        feedback = "Lower down";
      }
    } else {
      feedback = "Get in push-up position";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSpidermanPushUp(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftElbow ||
      !rightElbow ||
      !leftWrist ||
      !rightWrist
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track upper body" };
    }

    // Calculate elbow angles to detect push-up
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );

    // Average elbow angle
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // Initialize active leg if not set
    if (!this.activeLeg) {
      this.activeLeg = "left";
    }

    // Calculate knee position relative to hip for each leg
    const leftKneeToHipX = leftKnee && leftHip ? leftKnee.x - leftHip.x : 0;
    const rightKneeToHipX =
      rightKnee && rightHip ? rightKnee.x - rightHip.x : 0;

    // Normalize with shoulder width
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const normalizedLeftKneePosition = leftKneeToHipX / shoulderWidth;
    const normalizedRightKneePosition = rightKneeToHipX / shoulderWidth;

    let feedback = "";

    // Check if either knee is brought forward (Spiderman style)
    const leftKneeForward = normalizedLeftKneePosition > 0.4;
    const rightKneeForward = normalizedRightKneePosition > 0.4;
    const kneeIsForward =
      this.activeLeg === "left" ? leftKneeForward : rightKneeForward;

    // Detect push-up phases
    if (avgElbowAngle < 100 && kneeIsForward && this.lastState !== "down") {
      this.lastState = "down";
      feedback = `Good Spiderman position with ${this.activeLeg} knee`;
    } else if (avgElbowAngle > 160 && this.lastState === "down") {
      this.repCounter++;
      this.lastState = "up";

      // Switch legs for next rep
      this.activeLeg = this.activeLeg === "left" ? "right" : "left";
      feedback = `Good Spiderman push-up! Next rep bring ${this.activeLeg} knee forward`;
    }
    // Provide guidance based on current state
    else if (this.lastState === "up" && !kneeIsForward) {
      feedback = `Bring ${this.activeLeg} knee toward ${this.activeLeg} elbow`;
    } else if (this.lastState === "up" && kneeIsForward) {
      feedback = "Lower down";
    } else if (this.lastState === "down") {
      feedback = "Push up";
    } else {
      feedback = "Get in push-up position";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectForwardBackLunge(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Calculate ankle distances (forward/backward)
    const ankleDistance = Math.abs(leftAnkle.y - rightAnkle.y);

    // Calculate hip width for normalization
    const hipWidth = Math.abs(leftHip.x - rightHip.x);

    // Normalize ankle distance
    const normalizedDistance = ankleDistance / hipWidth;

    // Initialize lunge stage if not set
    if (!this.lungeStage) {
      this.lungeStage = "forward";
    }

    let feedback = "";

    // Detect if in lunge position (one knee bent)
    const inLungePosition =
      (leftKneeAngle < 130 || rightKneeAngle < 130) && normalizedDistance > 1.0;

    if (inLungePosition && this.lastState !== "lunge") {
      this.lastState = "lunge";

      // Check which leg is forward based on ankle Y position (lower Y is forward in image)
      const forwardLeg = leftAnkle.y < rightAnkle.y ? "left" : "right";

      // Determine if this is a forward or backward lunge
      if (this.lungeStage === "forward") {
        feedback = `Good forward lunge with ${forwardLeg} leg forward`;
        this.lastForwardLeg = forwardLeg;
        this.lungeStage = "back";
      } else {
        // For backward lunge, opposite leg should be forward
        if (forwardLeg !== this.lastForwardLeg) {
          this.repCounter++;
          feedback = `Good backward lunge with ${forwardLeg} leg forward`;
        } else {
          feedback = `Switch legs for backward lunge`;
        }
        this.lungeStage = "forward";
      }
    } else if (!inLungePosition && this.lastState === "lunge") {
      this.lastState = "standing";
      feedback = "Return to standing position";
    } else if (this.lastState === "standing" || !this.lastState) {
      feedback =
        this.lungeStage === "forward"
          ? "Step forward into lunge position"
          : "Step backward into lunge position";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectBird(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftWrist ||
      !rightWrist ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track body" };
    }

    // Calculate arm extension - looking at elbows
    const leftElbowAngle = leftElbow
      ? calculateAngle(leftShoulder, leftElbow, leftWrist)
      : 0;
    const rightElbowAngle = rightElbow
      ? calculateAngle(rightShoulder, rightElbow, rightWrist)
      : 0;

    // Calculate leg extension - looking at knees
    const leftKneeAngle = leftKnee
      ? calculateAngle(leftHip, leftKnee, leftAnkle)
      : 0;
    const rightKneeAngle = rightKnee
      ? calculateAngle(rightHip, rightKnee, rightAnkle)
      : 0;

    // Bird pose requires opposite arm and leg to be extended
    // For simplicity, let's check if any arm and opposite leg are extended
    const leftArmExtended = leftElbowAngle > 160;
    const rightArmExtended = rightElbowAngle > 160;
    const leftLegExtended = leftKneeAngle > 160;
    const rightLegExtended = rightKneeAngle > 160;

    let feedback = "";

    // Check for correct "bird" pose (opposite limbs extended)
    const correctLeftBird = leftArmExtended && rightLegExtended;
    const correctRightBird = rightArmExtended && leftLegExtended;

    if (
      (correctLeftBird || correctRightBird) &&
      this.lastState !== "extended"
    ) {
      this.repCounter++;
      this.lastState = "extended";
      feedback = "Good bird pose!";
    } else if (
      !(correctLeftBird || correctRightBird) &&
      this.lastState === "extended"
    ) {
      this.lastState = "retracted";
      feedback = "Return to starting position";
    } else if (this.lastState === "retracted" || !this.lastState) {
      feedback = "Extend opposite arm and leg";

      // More specific feedback
      if (leftArmExtended && !rightLegExtended) {
        feedback = "Extend right leg while keeping left arm extended";
      } else if (rightArmExtended && !leftLegExtended) {
        feedback = "Extend left leg while keeping right arm extended";
      } else if (leftLegExtended && !rightArmExtended) {
        feedback = "Extend right arm while keeping left leg extended";
      } else if (rightLegExtended && !leftArmExtended) {
        feedback = "Extend left arm while keeping right leg extended";
      }
    }

    return { repCount: this.repCounter, feedback };
  }

  detectBurpeePushUp(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return { repCount: this.repCounter, feedback: "Cannot track body" };
    }

    // Init state tracking if needed
    if (!this.burpeeStage) {
      this.burpeeStage = "standing";
    }

    // Calculate height (vertical position) of key points
    const shoulderHeight = (leftShoulder.y + rightShoulder.y) / 2;
    const hipHeight = (leftHip.y + rightHip.y) / 2;
    const kneeHeight =
      leftKnee && rightKnee ? (leftKnee.y + rightKnee.y) / 2 : null;

    // Calculate elbow angles for push-up detection
    const leftElbowAngle = leftElbow
      ? calculateAngle(leftShoulder, leftElbow, leftWrist)
      : 180;
    const rightElbowAngle = rightElbow
      ? calculateAngle(rightShoulder, rightElbow, rightWrist)
      : 180;
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    let feedback = "";

    // State machine for burpee to push-up
    switch (this.burpeeStage) {
      case "standing":
        // Detect squat down (hips getting lower)
        if (hipHeight > shoulderHeight + 50) {
          this.burpeeStage = "squat";
          feedback = "Good squat, now get into plank";
        } else {
          feedback = "Squat down";
        }
        break;

      case "squat":
        // Detect plank position (shoulders and hips roughly level)
        if (
          Math.abs(shoulderHeight - hipHeight) < 50 &&
          leftWrist &&
          rightWrist &&
          leftWrist.y > shoulderHeight &&
          rightWrist.y > shoulderHeight
        ) {
          this.burpeeStage = "plank";
          feedback = "Good plank, now do a push-up";
        } else {
          feedback = "Place hands on ground and kick legs back";
        }
        break;

      case "plank":
        // Detect push-up down position
        if (avgElbowAngle < 120) {
          this.burpeeStage = "push_down";
          feedback = "Good push-up depth, now push up";
        } else {
          feedback = "Lower chest toward ground";
        }
        break;

      case "push_down":
        // Detect push-up up position
        if (avgElbowAngle > 160) {
          this.burpeeStage = "push_up";
          feedback = "Good push-up, now jump feet forward";
        } else {
          feedback = "Push up";
        }
        break;

      case "push_up":
        // Detect feet jump forward (knees close to hands)
        if (kneeHeight && Math.abs(kneeHeight - shoulderHeight) < 100) {
          this.burpeeStage = "feet_forward";
          feedback = "Good, now stand up";
        } else {
          feedback = "Jump feet forward toward hands";
        }
        break;

      case "feet_forward":
        // Detect standing up (shoulders above hips)
        if (shoulderHeight < hipHeight - 50) {
          this.burpeeStage = "standing";
          this.repCounter++;
          feedback = "Great burpee to push-up!";
        } else {
          feedback = "Stand up straight";
        }
        break;
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSplitJackKnife(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track body" };
    }

    // Calculate angles and positions for split jack knife
    // Calculate hip-shoulder angle to detect sitting up
    const leftTorsoAngle = calculateAngle(leftHip, leftShoulder, {
      x: leftShoulder.x,
      y: leftShoulder.y - 10,
    });
    const rightTorsoAngle = calculateAngle(rightHip, rightShoulder, {
      x: rightShoulder.x,
      y: rightShoulder.y - 10,
    });
    const avgTorsoAngle = (leftTorsoAngle + rightTorsoAngle) / 2;

    // Calculate leg spread (for split position)
    const legSpread = Math.sqrt(
      Math.pow(leftAnkle.x - rightAnkle.x, 2) +
      Math.pow(leftAnkle.y - rightAnkle.y, 2)
    );

    // Normalize leg spread with hip width
    const hipWidth = Math.sqrt(
      Math.pow(leftHip.x - rightHip.x, 2) + Math.pow(leftHip.y - rightHip.y, 2)
    );
    const normalizedLegSpread = legSpread / hipWidth;

    let feedback = "";

    // For split jack knife, we need to detect:
    // 1. Lying down with legs together
    // 2. Sitting up while spreading legs (the jack knife)

    // Check if person is sitting up (smaller angle between torso and vertical)
    const sittingUp = avgTorsoAngle < 45;
    // Check if legs are spread apart
    const legsSplit = normalizedLegSpread > 1.5;

    // State machine for split jack knife
    if (sittingUp && legsSplit && this.lastState !== "up_split") {
      this.repCounter++;
      this.lastState = "up_split";
      feedback = "Good split jack knife!";
    } else if (!sittingUp && !legsSplit && this.lastState === "up_split") {
      this.lastState = "down_closed";
      feedback = "Good, ready for next rep";
    } else if (this.lastState === "up_split") {
      feedback = "Lower back down and bring legs together";
    } else if (this.lastState === "down_closed" || !this.lastState) {
      feedback = "Sit up while spreading legs apart";
    } else if (sittingUp && !legsSplit) {
      feedback = "Spread legs while sitting up";
    } else if (!sittingUp && legsSplit) {
      feedback = "Bring legs together while lying back";
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSprinterTucks(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track body" };
    }

    // Init active knee if not set
    if (!this.activeKnee) {
      this.activeKnee = "left";
    }

    // Calculate knee height relative to hip
    const leftKneeHeight = leftHip.y - leftKnee.y;
    const rightKneeHeight = rightHip.y - rightKnee.y;

    // Calculate torso height for normalization
    const torsoHeight =
      (leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2;

    // Normalize knee heights
    const normalizedLeftKneeHeight = leftKneeHeight / Math.abs(torsoHeight);
    const normalizedRightKneeHeight = rightKneeHeight / Math.abs(torsoHeight);

    let feedback = "";

    // For sprinter tucks, we're looking for alternating knee tucks
    // Check if active knee is tucked
    const leftKneeTucked = normalizedLeftKneeHeight > 0.6;
    const rightKneeTucked = normalizedRightKneeHeight > 0.6;
    const activeTucked =
      this.activeKnee === "left" ? leftKneeTucked : rightKneeTucked;

    if (activeTucked && this.lastState !== "tucked") {
      this.repCounter++;
      this.lastState = "tucked";

      // Switch active knee for next rep
      feedback = `Good ${this.activeKnee} knee tuck!`;
      this.activeKnee = this.activeKnee === "left" ? "right" : "left";
    } else if (
      !leftKneeTucked &&
      !rightKneeTucked &&
      this.lastState === "tucked"
    ) {
      this.lastState = "extended";
      feedback = `Now tuck ${this.activeKnee} knee next`;
    } else if (this.lastState === "tucked") {
      feedback = "Extend both legs";
    } else if (this.lastState === "extended" || !this.lastState) {
      feedback = `Tuck ${this.activeKnee} knee toward chest`;
    }

    return { repCount: this.repCounter, feedback };
  }

  detectSingleLegBridge(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");

    if (
      !leftShoulder ||
      !rightShoulder ||
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track body" };
    }

    // Init active leg if not set
    if (!this.activeLeg) {
      this.activeLeg = "left";
    }

    // Calculate hip height relative to shoulders
    const hipHeight =
      (leftHip.y + rightHip.y) / 2 - (leftShoulder.y + rightShoulder.y) / 2;

    // Calculate shoulder width for normalization
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    // Normalize hip height
    const normalizedHipHeight = hipHeight / shoulderWidth;

    // Calculate leg extension
    const leftLegExtended = calculateAngle(leftHip, leftKnee, leftAnkle) > 160;
    const rightLegExtended =
      calculateAngle(rightHip, rightKnee, rightAnkle) > 160;

    // Check if active leg is extended for single leg bridge
    const activeLegExtended =
      this.activeLeg === "left" ? leftLegExtended : rightLegExtended;

    let feedback = "";

    // For single leg bridge, we're looking for:
    // 1. Hips elevated (bridge position)
    // 2. One leg extended

    // Check if in bridge position (hips elevated)
    const inBridgePosition = normalizedHipHeight < -0.2;

    if (inBridgePosition && activeLegExtended && this.lastState !== "bridged") {
      this.repCounter++;
      this.lastState = "bridged";
      feedback = `Good single leg bridge with ${this.activeLeg} leg!`;
    } else if (!inBridgePosition && this.lastState === "bridged") {
      this.lastState = "lowered";

      // Switch active leg for next rep
      this.activeLeg = this.activeLeg === "left" ? "right" : "left";
      feedback = `Lower hips, next use ${this.activeLeg} leg`;
    } else if (this.lastState === "bridged") {
      feedback = "Lower hips";
    } else if (this.lastState === "lowered" || !this.lastState) {
      if (!inBridgePosition) {
        feedback = "Lift hips into bridge position";
      } else if (!activeLegExtended) {
        feedback = `Extend ${this.activeLeg} leg`;
      }
    }

    return { repCount: this.repCounter, feedback };
  }

  detectAssistedLunge(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftKnee = getKeypointByName(smoothedKeypoints, "left_knee");
    const rightKnee = getKeypointByName(smoothedKeypoints, "right_knee");
    const leftAnkle = getKeypointByName(smoothedKeypoints, "left_ankle");
    const rightAnkle = getKeypointByName(smoothedKeypoints, "right_ankle");
    const leftWrist = getKeypointByName(smoothedKeypoints, "left_wrist");
    const rightWrist = getKeypointByName(smoothedKeypoints, "right_wrist");

    if (
      !leftHip ||
      !rightHip ||
      !leftKnee ||
      !rightKnee ||
      !leftAnkle ||
      !rightAnkle
    ) {
      return { repCount: this.repCounter, feedback: "Cannot track legs" };
    }

    // Calculate knee angles
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

    // Calculate ankle distance (for stance width)
    const ankleDistance = Math.sqrt(
      Math.pow(leftAnkle.x - rightAnkle.x, 2) +
      Math.pow(leftAnkle.y - rightAnkle.y, 2)
    );

    // Calculate hip width for normalization
    const hipWidth = Math.abs(leftHip.x - rightHip.x);

    // Normalize ankle distance
    const normalizedDistance = ankleDistance / hipWidth;

    // Check if hands are positioned for assistance
    const handsLow =
      leftWrist &&
      rightWrist &&
      leftWrist.y > leftHip.y &&
      rightWrist.y > rightHip.y;

    let feedback = "";

    // Detect if in lunge position (one knee bent)
    const leftLunge = leftKneeAngle < 120;
    const rightLunge = rightKneeAngle < 120;
    const inLungePosition =
      (leftLunge || rightLunge) && normalizedDistance > 1.2;

    if (inLungePosition && handsLow && this.lastState !== "lunge") {
      this.repCounter++;
      this.lastState = "lunge";

      // Identify which leg is in lunge
      const lungeLeg = leftLunge ? "left" : "right";
      feedback = `Good assisted lunge with ${lungeLeg} leg forward`;
    } else if (!inLungePosition && this.lastState === "lunge") {
      this.lastState = "standing";
      feedback = "Return to standing position";
    } else if (inLungePosition && !handsLow && this.lastState !== "lunge") {
      feedback = "Lower hands for support";
    } else if (this.lastState === "standing" || !this.lastState) {
      if (normalizedDistance < 1.2) {
        feedback = "Widen stance";
      } else if (!handsLow) {
        feedback = "Lower hands for support";
      } else {
        feedback = "Bend front knee into lunge";
      }
    }

    return { repCount: this.repCounter, feedback };
  }

  detectStandingCrunch(keypoints) {
    const smoothedKeypoints = this.getSmoothedKeypoints();
    if (!smoothedKeypoints)
      return { repCount: this.repCounter, feedback: "No data" };

    // Get necessary keypoints
    const nose = getKeypointByName(smoothedKeypoints, "nose");
    const leftHip = getKeypointByName(smoothedKeypoints, "left_hip");
    const rightHip = getKeypointByName(smoothedKeypoints, "right_hip");
    const leftElbow = getKeypointByName(smoothedKeypoints, "left_elbow");
    const rightElbow = getKeypointByName(smoothedKeypoints, "right_elbow");
    const leftShoulder = getKeypointByName(smoothedKeypoints, "left_shoulder");
    const rightShoulder = getKeypointByName(
      smoothedKeypoints,
      "right_shoulder"
    );

    // Check if we have all required keypoints
    if (
      !nose ||
      !leftHip ||
      !rightHip ||
      !leftElbow ||
      !rightElbow ||
      !leftShoulder ||
      !rightShoulder
    ) {
      return {
        repCount: this.repCounter,
        feedback: "Cannot track body position",
      };
    }

    // Calculate hip center
    const hipCenterX = (leftHip.x + rightHip.x) / 2;
    const hipCenterY = (leftHip.y + rightHip.y) / 2;

    // Calculate shoulder center
    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;

    // Calculate elbow to hip distance (use minimum to detect when either side crunches)
    const leftElbowToHipDistance = Math.sqrt(
      Math.pow(leftElbow.x - hipCenterX, 2) +
      Math.pow(leftElbow.y - hipCenterY, 2)
    );
    const rightElbowToHipDistance = Math.sqrt(
      Math.pow(rightElbow.x - hipCenterX, 2) +
      Math.pow(rightElbow.y - hipCenterY, 2)
    );
    const minElbowToHipDistance = Math.min(
      leftElbowToHipDistance,
      rightElbowToHipDistance
    );

    // Calculate shoulder width as reference distance
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    // Normalize the elbow-to-hip distance relative to shoulder width
    const normalizedElbowToHipDistance = minElbowToHipDistance / shoulderWidth;

    // Define threshold for crunch detection
    const crunchThreshold = 0.8; // Adjust based on testing
    const resetThreshold = 1.5; // Adjust based on testing

    let feedback = "";

    // Detect crunch and count reps
    if (
      normalizedElbowToHipDistance < crunchThreshold &&
      this.lastState !== "crunched"
    ) {
      this.repCounter++;
      this.lastState = "crunched";
      feedback = "Good side crunch!";
    } else if (
      normalizedElbowToHipDistance > resetThreshold &&
      this.lastState === "crunched"
    ) {
      this.lastState = "extended";
      feedback = "Ready for next rep";
    } else if (this.lastState === "crunched") {
      feedback = "Return to starting position";
    } else if (this.lastState === "extended" || !this.lastState) {
      feedback = "Bring elbow toward hip";
    }

    return { repCount: this.repCounter, feedback };
  }

  //------------------------------------------------------------------------------
  // ================== YOGA ================
  //------------------------------------------------------------------------------
  // Base function for detecting yoga poses with a time requirement
  detectYogaPose(pose, conditions, requiredDuration = 3000) {
    // If no pose data is available, return early
    if (!pose || !pose.keypoints || pose.keypoints.length === 0) {
      return { inPosition: false, timer: 0, feedback: "No pose detected" };
    }

    // Get the keypoints from the pose
    const keypoints = this.getKeypoints(pose);
    if (!keypoints) {
      return {
        inPosition: false,
        timer: 0,
        feedback: "Cannot detect body keypoints",
      };
    }

    // Check all conditions for the pose
    const [isInPosition, feedback] = this.checkPoseConditions(
      keypoints,
      conditions
    );

    // Update timer and status based on position
    const now = Date.now();
    if (isInPosition) {
      if (!this.poseTimer) {
        this.poseTimer = now;
      }
      const elapsedTime = now - this.poseTimer;

      if (elapsedTime >= requiredDuration) {
        return {
          inPosition: true,
          timer: elapsedTime,
          feedback: "Great form! Hold position.",
        };
      } else {
        return {
          inPosition: false,
          timer: elapsedTime,
          feedback: `Good! Hold for ${Math.ceil(
            (requiredDuration - elapsedTime) / 1000
          )} more seconds. ${feedback}`,
        };
      }
    } else {
      this.poseTimer = null;
      return { inPosition: false, timer: 0, feedback };
    }
  }

  // Helper to check multiple conditions and provide specific feedback
  checkPoseConditions(keypoints, conditions) {
    for (const condition of conditions) {
      const [check, feedback] = condition(keypoints);
      if (!check) {
        return [false, feedback];
      }
    }
    return [true, "Looking good!"];
  }

  // Child Pose Detection
  detectChildPose(pose) {
    const conditions = [
      // Head should be low (below shoulders)
      (kp) => {
        const headY = kp.nose.y;
        const shoulderY = (kp.leftShoulder.y + kp.rightShoulder.y) / 2;
        return [headY > shoulderY, "Lower your head toward the ground"];
      },

      // Arms should be extended forward or alongside body
      (kp) => {
        const wristsForward =
          kp.leftWrist.y < kp.leftShoulder.y &&
          kp.rightWrist.y < kp.rightShoulder.y;
        const wristsAlongside =
          Math.abs(kp.leftWrist.y - kp.leftHip.y) < 0.1 &&
          Math.abs(kp.rightWrist.y - kp.rightHip.y) < 0.1;
        return [
          wristsForward || wristsAlongside,
          "Extend arms forward or rest alongside your body",
        ];
      },

      // Hips should be elevated and near the heels
      (kp) => {
        const hipY = (kp.leftHip.y + kp.rightHip.y) / 2;
        const kneeY = (kp.leftKnee.y + kp.rightKnee.y) / 2;
        const ankleY = (kp.leftAnkle.y + kp.rightAnkle.y) / 2;
        return [
          Math.abs(hipY - ankleY) < 0.15 && hipY < kneeY,
          "Bring your hips back toward your heels",
        ];
      },

      // Knees should be apart
      (kp) => {
        const kneeDistance = Math.abs(kp.leftKnee.x - kp.rightKnee.x);
        const shoulderWidth = Math.abs(kp.leftShoulder.x - kp.rightShoulder.x);
        return [
          kneeDistance > shoulderWidth * 0.5,
          "Keep knees hip-width apart or wider",
        ];
      },
    ];

    return this.detectYogaPose(pose, conditions, 5000); // Hold for 5 seconds
  }

  // Downward Facing Dog Detection
  detectDownwardDog(pose) {
    const conditions = [
      // Body should form an inverted V shape
      (kp) => {
        const shoulderToHipAngle = this.calculateAngle(
          kp.leftShoulder,
          kp.leftHip,
          kp.leftKnee
        );
        return [
          shoulderToHipAngle > 120 && shoulderToHipAngle < 160,
          "Form an inverted V shape with your body",
        ];
      },

      // Arms should be straight and aligned with torso
      (kp) => {
        const armAngle = this.calculateAngle(
          kp.leftShoulder,
          kp.leftElbow,
          kp.leftWrist
        );
        return [
          armAngle > 160,
          "Straighten your arms and press firmly into the ground",
        ];
      },

      // Legs should be relatively straight
      (kp) => {
        const legAngle = this.calculateAngle(
          kp.leftHip,
          kp.leftKnee,
          kp.leftAnkle
        );
        return [
          legAngle > 140,
          "Straighten your legs more, pressing heels toward the ground",
        ];
      },

      // Head aligned with arms (not dropping)
      (kp) => {
        const neckAligned =
          kp.nose.y > kp.leftShoulder.y && kp.nose.y > kp.rightShoulder.y;
        return [
          neckAligned,
          "Relax your neck, let your head hang naturally between your arms",
        ];
      },
    ];

    return this.detectYogaPose(pose, conditions, 5000); // Hold for 5 seconds
  }

  // Butterfly Stretch Detection
  detectButterfly(pose) {
    const conditions = [
      // Person should be seated
      (kp) => {
        const isSeated =
          kp.leftHip.y > kp.leftKnee.y && kp.rightHip.y > kp.rightKnee.y;
        return [isSeated, "Sit on the floor with your back straight"];
      },

      // Knees should be out to the sides
      (kp) => {
        const kneeWidth = Math.abs(kp.leftKnee.x - kp.rightKnee.x);
        const hipWidth = Math.abs(kp.leftHip.x - kp.rightHip.x);
        return [
          kneeWidth > hipWidth * 1.5,
          "Bring your knees wider to the sides",
        ];
      },

      // Feet should be brought together
      (kp) => {
        const ankleDistance = Math.abs(kp.leftAnkle.x - kp.rightAnkle.x);
        const hipWidth = Math.abs(kp.leftHip.x - kp.rightHip.x);
        return [
          ankleDistance < hipWidth * 0.5,
          "Bring the soles of your feet together",
        ];
      },

      // Upper body should be upright
      (kp) => {
        const shoulderY = (kp.leftShoulder.y + kp.rightShoulder.y) / 2;
        const hipY = (kp.leftHip.y + kp.rightHip.y) / 2;
        return [shoulderY < hipY, "Keep your spine straight and sit up tall"];
      },
    ];

    return this.detectYogaPose(pose, conditions, 4000); // Hold for 4 seconds
  }

  // Helper function to calculate angle between three points
  calculateAngle(pointA, pointB, pointC) {
    const AB = Math.sqrt(
      Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2)
    );
    const BC = Math.sqrt(
      Math.pow(pointB.x - pointC.x, 2) + Math.pow(pointB.y - pointC.y, 2)
    );
    const AC = Math.sqrt(
      Math.pow(pointC.x - pointA.x, 2) + Math.pow(pointC.y - pointA.y, 2)
    );

    return (
      Math.acos((AB * AB + BC * BC - AC * AC) / (2 * AB * BC)) * (180 / Math.PI)
    );
  }

  // Helper function to get keypoints in an easier to use format
  getKeypoints(pose) {
    if (!pose || !pose.keypoints || pose.keypoints.length === 0) {
      return null;
    }

    const keypoints = {};
    pose.keypoints.forEach((kp) => {
      keypoints[kp.name] = {
        x: kp.x,
        y: kp.y,
        score: kp.score,
      };
    });

    return keypoints;
  }

  // Cat and Camel Pose Detection
  detectCatCamel(pose) {
    // We need to detect both positions and alternation between them
    if (!this.catCamelState) {
      this.catCamelState = {
        lastPosition: null,
        transitions: 0,
        lastTransitionTime: 0,
      };
    }

    const keypoints = this.getKeypoints(pose);
    if (!keypoints) {
      return {
        inPosition: false,
        timer: 0,
        feedback: "Cannot detect body keypoints",
      };
    }

    // Check if in Cat pose (spine rounded up)
    const isCatPose = this.isCatPosition(keypoints);
    // Check if in Camel pose (spine rounded down)
    const isCamelPose = this.isCamelPosition(keypoints);

    const now = Date.now();
    const currentPosition = isCatPose ? "cat" : isCamelPose ? "camel" : null;

    // Detected a valid position
    if (currentPosition) {
      // If we transition from one valid position to another
      if (
        this.catCamelState.lastPosition &&
        this.catCamelState.lastPosition !== currentPosition
      ) {
        // Count transition if it's been at least 1 second since last transition
        if (now - this.catCamelState.lastTransitionTime > 1000) {
          this.catCamelState.transitions++;
          this.catCamelState.lastTransitionTime = now;
        }
      }

      this.catCamelState.lastPosition = currentPosition;

      // Need at least 4 transitions (2 complete cycles) to count as exercise
      if (this.catCamelState.transitions >= 4) {
        return {
          inPosition: true,
          count: Math.floor(this.catCamelState.transitions / 2),
          feedback: `Great job alternating between Cat and Camel poses! ${Math.floor(
            this.catCamelState.transitions / 2
          )} cycles completed.`,
        };
      } else {
        return {
          inPosition: false,
          count: Math.floor(this.catCamelState.transitions / 2),
          feedback:
            currentPosition === "cat"
              ? "Good Cat pose, now round your back the other way for Camel"
              : "Good Camel pose, now round your back upward for Cat",
        };
      }
    } else {
      // Not in either position, provide guidance
      return {
        inPosition: false,
        count: Math.floor(this.catCamelState.transitions / 2),
        feedback:
          "Get on your hands and knees, then alternate between arching your back up (Cat) and dropping it down (Camel)",
      };
    }
  }

  // Helper functions for Cat and Camel
  isCatPosition(keypoints) {
    // In Cat, the back is rounded upward
    const spineAngle = this.calculateAngle(
      keypoints.rightShoulder,
      {
        x: (keypoints.leftHip.x + keypoints.rightHip.x) / 2,
        y: (keypoints.leftHip.y + keypoints.rightHip.y) / 2,
      },
      keypoints.nose
    );

    // Head should be dropped down
    const neckAngle = this.calculateAngle(
      {
        x: (keypoints.leftShoulder.x + keypoints.rightShoulder.x) / 2,
        y: (keypoints.leftShoulder.y + keypoints.rightShoulder.y) / 2,
      },
      keypoints.nose,
      { x: keypoints.nose.x, y: keypoints.nose.y - 0.1 } // point above nose
    );

    return spineAngle < 160 && neckAngle > 30;
  }

  isCamelPosition(keypoints) {
    // In Camel, the back is arched downward
    const spineAngle = this.calculateAngle(
      keypoints.rightShoulder,
      {
        x: (keypoints.leftHip.x + keypoints.rightHip.x) / 2,
        y: (keypoints.leftHip.y + keypoints.rightHip.y) / 2,
      },
      keypoints.nose
    );

    // Head should be looking up
    const neckAngle = this.calculateAngle(
      {
        x: (keypoints.leftShoulder.x + keypoints.rightShoulder.x) / 2,
        y: (keypoints.leftShoulder.y + keypoints.rightShoulder.y) / 2,
      },
      keypoints.nose,
      { x: keypoints.nose.x, y: keypoints.nose.y - 0.1 } // point above nose
    );

    return spineAngle > 200 && neckAngle < 20;
  }

  // Lying Spinal Twist Detection
  detectSpinalTwist(pose) {
    const conditions = [
      // Person should be lying down
      (kp) => {
        const isLying =
          Math.abs(kp.leftShoulder.y - kp.leftHip.y) < 0.2 &&
          Math.abs(kp.rightShoulder.y - kp.rightHip.y) < 0.2;
        return [isLying, "Lie flat on your back first"];
      },

      // Knees should be bent to one side
      (kp) => {
        // Calculate the horizontal difference between knees and hips
        const kneeHipDiffX =
          (kp.leftKnee.x + kp.rightKnee.x) / 2 -
          (kp.leftHip.x + kp.rightHip.x) / 2;
        const isTwisted = Math.abs(kneeHipDiffX) > 0.2; // Knees are offset to one side

        return [isTwisted, "Bend your knees and drop them to one side"];
      },

      // Shoulders should be flat on the ground (opposite the twist)
      (kp) => {
        const shoulderAlignment =
          Math.abs(kp.leftShoulder.y - kp.rightShoulder.y) < 0.1;
        return [shoulderAlignment, "Keep both shoulders flat on the ground"];
      },
    ];

    return this.detectYogaPose(pose, conditions, 8000); // Hold for 8 seconds
  }

  // Standing Hamstring Stretch Detection
  detectHamstringStretch(pose) {
    const conditions = [
      // One leg should be extended forward
      (kp) => {
        // Check if either leg is extended forward
        const leftLegForward = kp.leftAnkle.x > kp.leftHip.x + 0.2;
        const rightLegForward = kp.rightAnkle.x > kp.rightHip.x + 0.2;

        return [
          leftLegForward || rightLegForward,
          "Extend one leg forward with heel on the ground",
        ];
      },

      // The extended leg should be straight
      (kp) => {
        // Determine which leg is extended
        const leftLegForward = kp.leftAnkle.x > kp.leftHip.x + 0.2;

        // Check if the extended leg is straight
        const legAngle = leftLegForward
          ? this.calculateAngle(kp.leftHip, kp.leftKnee, kp.leftAnkle)
          : this.calculateAngle(kp.rightHip, kp.rightKnee, kp.rightAnkle);

        return [legAngle > 160, "Keep your extended leg straight"];
      },

      // Upper body should be bent forward
      (kp) => {
        const trunkAngle = this.calculateAngle(
          {
            x: (kp.leftShoulder.x + kp.rightShoulder.x) / 2,
            y: (kp.leftShoulder.y + kp.rightShoulder.y) / 2,
          },
          {
            x: (kp.leftHip.x + kp.rightHip.x) / 2,
            y: (kp.leftHip.y + kp.rightHip.y) / 2,
          },
          {
            x: (kp.leftHip.x + kp.rightHip.x) / 2,
            y: (kp.leftHip.y + kp.rightHip.y) / 2 - 0.1,
          } // point above hips
        );

        return [trunkAngle < 140, "Hinge forward from your hips more"];
      },
    ];

    return this.detectYogaPose(pose, conditions, 6000); // Hold for 6 seconds
  }

  // Cobra Pose Detection
  detectCobra(pose) {
    const conditions = [
      // Should be lying on stomach
      (kp) => {
        const isPronePosition =
          kp.leftShoulder.y > kp.leftHip.y - 0.1 &&
          kp.rightShoulder.y > kp.rightHip.y - 0.1;

        return [
          isPronePosition,
          "Lie on your stomach with legs extended behind you",
        ];
      },

      // Upper body should be lifted
      (kp) => {
        const chestLifted =
          kp.leftShoulder.y < kp.leftHip.y &&
          kp.rightShoulder.y < kp.rightHip.y;

        return [chestLifted, "Lift your chest off the floor"];
      },

      // Arms should be supporting, elbows bent
      (kp) => {
        const leftElbowAngle = this.calculateAngle(
          kp.leftShoulder,
          kp.leftElbow,
          kp.leftWrist
        );
        const rightElbowAngle = this.calculateAngle(
          kp.rightShoulder,
          kp.rightElbow,
          kp.rightWrist
        );
        const elbowsBent = leftElbowAngle < 160 || rightElbowAngle < 160;

        return [
          elbowsBent,
          "Place your hands under your shoulders, elbows bent",
        ];
      },

      // Head should be up, looking forward
      (kp) => {
        const headUp =
          kp.nose.y < kp.leftShoulder.y && kp.nose.y < kp.rightShoulder.y;
        return [headUp, "Lift your head and look forward"];
      },
    ];

    return this.detectYogaPose(pose, conditions, 5000); // Hold for 5 seconds
  }

  // Bridge Stretch Detection
  detectBridgeStretch(pose) {
    const conditions = [
      // Person should be on their back
      (kp) => {
        const isSupine =
          Math.abs(kp.leftShoulder.y - kp.rightShoulder.y) < 0.1 &&
          Math.abs(kp.leftHip.y - kp.rightHip.y) < 0.1;

        return [isSupine, "Lie on your back with knees bent"];
      },

      // Knees should be bent
      (kp) => {
        const leftKneeAngle = this.calculateAngle(
          kp.leftHip,
          kp.leftKnee,
          kp.leftAnkle
        );
        const rightKneeAngle = this.calculateAngle(
          kp.rightHip,
          kp.rightKnee,
          kp.rightAnkle
        );
        const kneesBent = leftKneeAngle < 120 && rightKneeAngle < 120;

        return [kneesBent, "Bend your knees and place feet flat on the floor"];
      },

      // Hips should be lifted off the ground
      (kp) => {
        const shoulderY = (kp.leftShoulder.y + kp.rightShoulder.y) / 2;
        const hipY = (kp.leftHip.y + kp.rightHip.y) / 2;
        const hipsLifted = hipY < shoulderY;

        return [hipsLifted, "Lift your hips up toward the ceiling"];
      },

      // Shoulders should remain on the ground
      (kp) => {
        const headY = kp.nose.y;
        const shoulderY = (kp.leftShoulder.y + kp.rightShoulder.y) / 2;
        const shouldersDown = Math.abs(headY - shoulderY) < 0.2;

        return [shouldersDown, "Keep your shoulders on the ground"];
      },
    ];

    return this.detectYogaPose(pose, conditions, 5000); // Hold for 5 seconds
  }

  // Neck Stretch Detection
  detectNeckStretch(pose) {
    // For neck stretches, we need to detect multiple stretch directions
    if (!this.neckStretchState) {
      this.neckStretchState = {
        right: false,
        left: false,
        forward: false,
        timer: 0,
        currentDirection: null,
        lastDirectionChange: 0,
      };
    }

    const keypoints = this.getKeypoints(pose);
    if (!keypoints) {
      return {
        inPosition: false,
        timer: 0,
        feedback: "Cannot detect body keypoints",
      };
    }

    const now = Date.now();

    // Check for right tilt
    const isRightTilt = this.isNeckRightTilt(keypoints);
    // Check for left tilt
    const isLeftTilt = this.isNeckLeftTilt(keypoints);
    // Check for forward tilt
    const isForwardTilt = this.isNeckForwardTilt(keypoints);

    let direction = null;
    if (isRightTilt) direction = "right";
    else if (isLeftTilt) direction = "left";
    else if (isForwardTilt) direction = "forward";

    // If direction changed, update state
    if (direction && direction !== this.neckStretchState.currentDirection) {
      // If held previous position for at least 3 seconds, mark it as completed
      if (
        this.neckStretchState.currentDirection &&
        this.neckStretchState.timer >= 3000
      ) {
        this.neckStretchState[this.neckStretchState.currentDirection] = true;
      }

      this.neckStretchState.currentDirection = direction;
      this.neckStretchState.timer = 0;
      this.neckStretchState.lastDirectionChange = now;
    }

    // Update timer if in a valid position
    if (direction) {
      if (this.neckStretchState.timer === 0) {
        this.neckStretchState.timer = 1; // Start timer
      } else {
        this.neckStretchState.timer =
          now - this.neckStretchState.lastDirectionChange;
      }
    } else {
      this.neckStretchState.timer = 0;
    }

    // Check if all stretches are completed
    const allCompleted =
      this.neckStretchState.right &&
      this.neckStretchState.left &&
      this.neckStretchState.forward;

    if (allCompleted) {
      return {
        inPosition: true,
        timer: this.neckStretchState.timer,
        feedback: "Great job! You've completed all neck stretches.",
      };
    } else if (direction) {
      const remainingTime = Math.max(0, 3000 - this.neckStretchState.timer);
      const remainingSeconds = Math.ceil(remainingTime / 1000);

      let completionStatus = "";
      if (!this.neckStretchState.right) completionStatus += " right,";
      if (!this.neckStretchState.left) completionStatus += " left,";
      if (!this.neckStretchState.forward) completionStatus += " forward,";
      completionStatus = completionStatus.substring(
        0,
        completionStatus.length - 1
      ); // Remove trailing comma

      return {
        inPosition: false,
        timer: this.neckStretchState.timer,
        feedback: `Good ${direction} neck stretch! Hold for ${remainingSeconds} more seconds. Remaining stretches:${completionStatus}.`,
      };
    } else {
      return {
        inPosition: false,
        timer: 0,
        feedback:
          "Tilt your head to the right, left, or forward to stretch your neck",
      };
    }
  }

  // Helper functions for neck stretch
  isNeckRightTilt(keypoints) {
    // Head tilted to the right shoulder
    const headTilt = keypoints.rightEar.y - keypoints.leftEar.y;
    return headTilt > 0.1; // Positive value means right ear is lower than left (tilting right)
  }

  isNeckLeftTilt(keypoints) {
    // Head tilted to the left shoulder
    const headTilt = keypoints.leftEar.y - keypoints.rightEar.y;
    return headTilt > 0.1; // Positive value means left ear is lower than right (tilting left)
  }

  isNeckForwardTilt(keypoints) {
    // Head tilted forward (chin to chest)
    const noseToShoulderY =
      keypoints.nose.y -
      (keypoints.leftShoulder.y + keypoints.rightShoulder.y) / 2;
    return noseToShoulderY > 0.15; // Nose is lower than it would be in neutral position
  }

  // Shoulder Stretch Detection
  detectShoulderStretch(pose) {
    const conditions = [
      // Arm should be across the chest
      (kp) => {
        // Check if either arm is across the chest
        const leftAcross = kp.leftWrist.x > kp.rightShoulder.x;
        const rightAcross = kp.rightWrist.x < kp.leftShoulder.x;

        return [leftAcross || rightAcross, "Bring one arm across your chest"];
      },

      // Other arm should be supporting the stretch
      (kp) => {
        // If left arm is across, right should support and vice versa
        const leftAcross = kp.leftWrist.x > kp.rightShoulder.x;
        const rightAcross = kp.rightWrist.x < kp.leftShoulder.x;

        const supportingCorrect =
          (leftAcross && kp.rightWrist.y < kp.leftElbow.y) ||
          (rightAcross && kp.leftWrist.y < kp.rightElbow.y);

        return [
          supportingCorrect,
          "Use your other arm to gently pull and hold the stretch",
        ];
      },

      // Shoulders should be relaxed, not hunched
      (kp) => {
        const shoulderRelaxed =
          Math.abs(kp.leftShoulder.y - kp.rightShoulder.y) < 0.1;

        return [shoulderRelaxed, "Keep your shoulders relaxed and down"];
      },
    ];

    return this.detectYogaPose(pose, conditions, 6000); // Hold for 6 seconds
  }

  // Chest Stretch Detection
  detectChestStretch(pose) {
    const conditions = [
      // Arms should be extended to the sides
      (kp) => {
        const armsOut =
          kp.leftWrist.x < kp.leftShoulder.x - 0.2 &&
          kp.rightWrist.x > kp.rightShoulder.x + 0.2;

        return [armsOut, "Extend your arms out to the sides"];
      },

      // Arms should be at shoulder height
      (kp) => {
        const armsAtShoulderHeight =
          Math.abs(kp.leftWrist.y - kp.leftShoulder.y) < 0.1 &&
          Math.abs(kp.rightWrist.y - kp.rightShoulder.y) < 0.1;

        return [armsAtShoulderHeight, "Keep your arms at shoulder height"];
      },

      // Chest should be expanded
      (kp) => {
        const shoulderDistance = Math.abs(
          kp.leftShoulder.x - kp.rightShoulder.x
        );
        const hipDistance = Math.abs(kp.leftHip.x - kp.rightHip.x);
        const chestExpanded = shoulderDistance > hipDistance * 1.2;

        return [
          chestExpanded,
          "Expand your chest and pull your shoulder blades together",
        ];
      },
    ];

    return this.detectYogaPose(pose, conditions, 5000); // Hold for 5 seconds
  }

  // Arm Circle Detection
  detectArmCircle(pose) {
    // We need to track arm movement over time to detect circles
    if (!this.armCircleState) {
      this.armCircleState = {
        positions: [], // Stores recent wrist positions
        circlesCompleted: 0,
        lastQuadrant: null,
        quadrantSequence: [],
      };
    }

    const keypoints = this.getKeypoints(pose);
    if (!keypoints) {
      return {
        inPosition: false,
        count: 0,
        feedback: "Cannot detect body keypoints",
      };
    }

    // Track wrist positions relative to shoulder
    const leftWristRelX = keypoints.leftWrist.x - keypoints.leftShoulder.x;
    const leftWristRelY = keypoints.leftWrist.y - keypoints.leftShoulder.y;
    const rightWristRelX = keypoints.rightWrist.x - keypoints.rightShoulder.x;
    const rightWristRelY = keypoints.rightWrist.y - keypoints.rightShoulder.y;

    // Store position data (using average of both arms)
    this.armCircleState.positions.push({
      x: (leftWristRelX + rightWristRelX) / 2,
      y: (leftWristRelY + rightWristRelY) / 2,
      timestamp: Date.now(),
    });

    // Keep only the last 20 positions (about 1-2 seconds of data at 15-30fps)
    if (this.armCircleState.positions.length > 20) {
      this.armCircleState.positions.shift();
    }

    // Determine current quadrant (relative to shoulder)
    let currentQuadrant = this.getQuadrant(
      (leftWristRelX + rightWristRelX) / 2,
      (leftWristRelY + rightWristRelY) / 2
    );

    // If quadrant changed, update sequence
    if (currentQuadrant !== this.armCircleState.lastQuadrant) {
      this.armCircleState.quadrantSequence.push(currentQuadrant);
      this.armCircleState.lastQuadrant = currentQuadrant;

      // Keep sequence manageable
      if (this.armCircleState.quadrantSequence.length > 8) {
        this.armCircleState.quadrantSequence.shift();
      }

      // Check for complete circle pattern (1-2-3-4-1 for clockwise, 1-4-3-2-1 for counterclockwise)
      const sequence = this.armCircleState.quadrantSequence.join("");
      if (sequence.includes("1234") || sequence.includes("4321")) {
        this.armCircleState.circlesCompleted++;
        // Clear half the sequence to avoid double counting but maintain continuity
        this.armCircleState.quadrantSequence.splice(0, 4);
      }
    }

    // Check if arms are extended
    const armsExtended =
      this.calculateAngle(
        keypoints.leftShoulder,
        keypoints.leftElbow,
        keypoints.leftWrist
      ) > 150 &&
      this.calculateAngle(
        keypoints.rightShoulder,
        keypoints.rightElbow,
        keypoints.rightWrist
      ) > 150;

    // Determine feedback
    let feedback;
    if (!armsExtended) {
      feedback = "Keep your arms straight while making circles";
    } else if (this.armCircleState.positions.length < 10) {
      feedback = "Start making large arm circles";
    } else {
      const armMovement = this.calculateArmMovement(
        this.armCircleState.positions
      );
      if (armMovement < 0.2) {
        feedback = "Make larger, more defined arm circles";
      } else {
        feedback = `Good arm circles! Completed: ${this.armCircleState.circlesCompleted}`;
      }
    }

    return {
      inPosition: this.armCircleState.circlesCompleted >= 5,
      count: this.armCircleState.circlesCompleted,
      feedback,
    };
  }

  // Helper functions for arm circles
  getQuadrant(x, y) {
    // Determine quadrant (1: top-right, 2: bottom-right, 3: bottom-left, 4: top-left)
    if (x >= 0 && y < 0) return 1;
    if (x >= 0 && y >= 0) return 2;
    if (x < 0 && y >= 0) return 3;
    return 4; // x < 0 && y < 0
  }

  calculateArmMovement(positions) {
    // Calculate total distance moved to determine if making proper circles
    let totalDistance = 0;
    for (let i = 1; i < positions.length; i++) {
      const dx = positions[i].x - positions[i - 1].x;
      const dy = positions[i].y - positions[i - 1].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    return totalDistance / positions.length;
  }

  // Alternate Cross Stretch Detection
  detectCrossStretch(pose) {
    // We need to detect alternating across stretches
    if (!this.crossStretchState) {
      this.crossStretchState = {
        rightArmUp: false,
        leftArmUp: false,
        rightHeld: 0,
        leftHeld: 0,
        lastSide: null,
      };
    }

    const keypoints = this.getKeypoints(pose);
    if (!keypoints) {
      return {
        inPosition: false,
        timer: 0,
        feedback: "Cannot detect body keypoints",
      };
    }

    // Check if right arm is up and stretched
    const rightArmUp =
      keypoints.rightWrist.y < keypoints.rightShoulder.y - 0.2 &&
      keypoints.rightElbow.y < keypoints.rightShoulder.y - 0.1;

    // Check if left arm is up and stretched
    const leftArmUp =
      keypoints.leftWrist.y < keypoints.leftShoulder.y - 0.2 &&
      keypoints.leftElbow.y < keypoints.leftShoulder.y - 0.1;

    const now = Date.now();

    // Update stretch state
    if (rightArmUp && !leftArmUp) {
      if (this.crossStretchState.lastSide !== "right") {
        this.crossStretchState.lastSide = "right";
        this.crossStretchState.rightStartTime = now;
      } else {
        this.crossStretchState.rightHeld =
          now - this.crossStretchState.rightStartTime;
        if (this.crossStretchState.rightHeld >= 3000) {
          this.crossStretchState.rightArmUp = true;
        }
      }
    } else if (leftArmUp && !rightArmUp) {
      if (this.crossStretchState.lastSide !== "left") {
        this.crossStretchState.lastSide = "left";
        this.crossStretchState.leftStartTime = now;
      } else {
        this.crossStretchState.leftHeld =
          now - this.crossStretchState.leftStartTime;
        if (this.crossStretchState.leftHeld >= 3000) {
          this.crossStretchState.leftArmUp = true;
        }
      }
    } else {
      // Neither arm is correctly positioned
      this.crossStretchState.lastSide = null;
    }

    // Determine feedback and status
    if (this.crossStretchState.rightArmUp && this.crossStretchState.leftArmUp) {
      return {
        inPosition: true,
        timer: Math.max(
          this.crossStretchState.rightHeld,
          this.crossStretchState.leftHeld
        ),
        feedback: "Great job! You've completed stretches on both sides.",
      };
    } else if (rightArmUp) {
      const remainingTime = Math.max(
        0,
        3000 - this.crossStretchState.rightHeld
      );
      const remainingSeconds = Math.ceil(remainingTime / 1000);
      return {
        inPosition: false,
        timer: this.crossStretchState.rightHeld,
        feedback: this.crossStretchState.rightArmUp
          ? "Right arm stretch complete! Now stretch your left arm up."
          : `Keep stretching your right arm up for ${remainingSeconds} more seconds.`,
      };
    } else if (leftArmUp) {
      const remainingTime = Math.max(0, 3000 - this.crossStretchState.leftHeld);
      const remainingSeconds = Math.ceil(remainingTime / 1000);
      return {
        inPosition: false,
        timer: this.crossStretchState.leftHeld,
        feedback: this.crossStretchState.leftArmUp
          ? "Left arm stretch complete! Now stretch your right arm up."
          : `Keep stretching your left arm up for ${remainingSeconds} more seconds.`,
      };
    } else {
      return {
        inPosition: false,
        timer: 0,
        feedback: "Stretch one arm up at a time, reaching toward the ceiling",
      };
    }
  }

  // Hug Knees to Chest Detection
  detectHugKnees(pose) {
    const conditions = [
      // Person should be lying on their back
      (kp) => {
        const isSupine =
          Math.abs(kp.leftShoulder.y - kp.rightShoulder.y) < 0.1 &&
          Math.abs(kp.leftHip.y - kp.rightHip.y) < 0.1;

        return [isSupine, "Lie on your back first"];
      },

      // Knees should be bent toward chest
      (kp) => {
        const kneesToChest =
          kp.leftKnee.y < kp.leftHip.y && kp.rightKnee.y < kp.rightHip.y;

        return [kneesToChest, "Pull your knees toward your chest"];
      },

      // Arms should be around knees (hands near knees)
      (kp) => {
        const armsAroundKnees =
          Math.abs(kp.leftWrist.y - kp.leftKnee.y) < 0.2 &&
          Math.abs(kp.rightWrist.y - kp.rightKnee.y) < 0.2;

        return [
          armsAroundKnees,
          "Wrap your arms around your knees or behind your thighs",
        ];
      },

      // Back should be flat
      (kp) => {
        const backFlat =
          Math.abs(kp.leftShoulder.y - kp.leftHip.y) < 0.1 &&
          Math.abs(kp.rightShoulder.y - kp.rightHip.y) < 0.1;

        return [backFlat, "Keep your back flat against the floor"];
      },
    ];

    return this.detectYogaPose(pose, conditions, 7000); // Hold for 7 seconds
  }

  // Hip Flexor Reach Detection
  detectHipFlexor(pose) {
    const conditions = [
      // One leg should be forward in a lunge position
      (kp) => {
        // Check if either leg is in a lunge position
        const leftLegForward = kp.leftKnee.x > kp.leftHip.x + 0.2;
        const rightLegForward = kp.rightKnee.x > kp.rightHip.x + 0.2;

        return [
          leftLegForward || rightLegForward,
          "Step one leg forward into a lunge position",
        ];
      },

      // Front knee should be bent
      (kp) => {
        // Determine which leg is forward
        const leftLegForward = kp.leftKnee.x > kp.leftHip.x + 0.2;

        // Check if the front knee is bent
        const kneeAngle = leftLegForward
          ? this.calculateAngle(kp.leftHip, kp.leftKnee, kp.leftAnkle)
          : this.calculateAngle(kp.rightHip, kp.rightKnee, kp.rightAnkle);

        return [kneeAngle < 130, "Bend your front knee to a 90-degree angle"];
      },

      // Back leg should be extended behind
      (kp) => {
        // Determine which leg is back
        const leftLegForward = kp.leftKnee.x > kp.leftHip.x + 0.2;
        const backLegExtended = leftLegForward
          ? kp.rightKnee.x < kp.rightHip.x
          : kp.leftKnee.x < kp.leftHip.x;

        return [backLegExtended, "Extend your back leg straight behind you"];
      },

      // Torso should be upright
      (kp) => {
        const torsoAngle = this.calculateAngle(
          {
            x: (kp.leftShoulder.x + kp.rightShoulder.x) / 2,
            y: (kp.leftShoulder.y + kp.rightShoulder.y) / 2 - 0.1,
          }, // point above shoulders
          {
            x: (kp.leftShoulder.x + kp.rightShoulder.x) / 2,
            y: (kp.leftShoulder.y + kp.rightShoulder.y) / 2,
          },
          {
            x: (kp.leftHip.x + kp.rightHip.x) / 2,
            y: (kp.leftHip.y + kp.rightHip.y) / 2,
          }
        );

        return [torsoAngle > 160, "Keep your torso upright"];
      },

      // Hip flexors should be stretched (hips should be low)
      (kp) => {
        const hipHeight = (kp.leftHip.y + kp.rightHip.y) / 2;
        const kneeHeight = (kp.leftKnee.y + kp.rightKnee.y) / 2;
        const hipsLow = hipHeight > kneeHeight - 0.1;

        return [hipsLow, "Sink your hips lower to stretch the hip flexors"];
      },
    ];

    return this.detectYogaPose(pose, conditions, 6000); // Hold for 6 seconds
  }

  // Lying Hamstring Stretch Detection
  detectLyingHamstring(pose) {
    const conditions = [
      // Person should be lying on their back
      (kp) => {
        const isSupine =
          Math.abs(kp.leftShoulder.y - kp.rightShoulder.y) < 0.1 &&
          Math.abs(kp.leftHip.y - kp.rightHip.y) < 0.1;

        return [isSupine, "Lie on your back first"];
      },

      // One leg should be extended upward
      (kp) => {
        // Check if either leg is raised
        const leftLegUp = kp.leftAnkle.y < kp.leftHip.y - 0.3;
        const rightLegUp = kp.rightAnkle.y < kp.rightHip.y - 0.3;

        return [leftLegUp || rightLegUp, "Raise one leg toward the ceiling"];
      },

      // Raised leg should be straight
      (kp) => {
        // Determine which leg is raised
        const leftLegUp = kp.leftAnkle.y < kp.leftHip.y - 0.3;

        // Check if raised leg is straight
        const legAngle = leftLegUp
          ? this.calculateAngle(kp.leftHip, kp.leftKnee, kp.leftAnkle)
          : this.calculateAngle(kp.rightHip, kp.rightKnee, kp.rightAnkle);

        return [legAngle > 160, "Keep your raised leg straight"];
      },

      // Hands should be holding the raised leg
      (kp) => {
        // Determine which leg is raised
        const leftLegUp = kp.leftAnkle.y < kp.leftHip.y - 0.3;

        const handsHoldingLeg = leftLegUp
          ? Math.abs(kp.leftWrist.y - kp.leftAnkle.y) < 0.2 ||
          Math.abs(kp.rightWrist.y - kp.leftAnkle.y) < 0.2
          : Math.abs(kp.leftWrist.y - kp.rightAnkle.y) < 0.2 ||
          Math.abs(kp.rightWrist.y - kp.rightAnkle.y) < 0.2;

        return [
          handsHoldingLeg,
          "Hold your raised leg with both hands behind the calf or thigh",
        ];
      },
    ];

    return this.detectYogaPose(pose, conditions, 7000); // Hold for 7 seconds
  }

  // Wrist Stretch Detection
  detectWristStretch(pose) {
    // For wrist stretches, we need to detect multiple stretch positions
    if (!this.wristStretchState) {
      this.wristStretchState = {
        flexion: false, // Wrists bent down
        extension: false, // Wrists bent up
        timer: 0,
        currentPosition: null,
        lastPositionChange: 0,
      };
    }

    const keypoints = this.getKeypoints(pose);
    if (!keypoints) {
      return {
        inPosition: false,
        timer: 0,
        feedback: "Cannot detect body keypoints",
      };
    }

    const now = Date.now();

    // We can't directly see wrist flexion/extension from pose keypoints
    // Instead, we'll check hand/arm position and assume proper stretch

    // Check for arms extended forward with palms down (extension stretch)
    const isExtensionStretch = this.isWristExtensionPosition(keypoints);

    // Check for arms extended forward with palms up (flexion stretch)
    const isFlexionStretch = this.isWristFlexionPosition(keypoints);

    let position = null;
    if (isExtensionStretch) position = "extension";
    else if (isFlexionStretch) position = "flexion";

    // If position changed, update state
    if (position && position !== this.wristStretchState.currentPosition) {
      // If held previous position for at least 5 seconds, mark it as completed
      if (
        this.wristStretchState.currentPosition &&
        this.wristStretchState.timer >= 5000
      ) {
        this.wristStretchState[this.wristStretchState.currentPosition] = true;
      }

      this.wristStretchState.currentPosition = position;
      this.wristStretchState.timer = 0;
      this.wristStretchState.lastPositionChange = now;
    }

    // Update timer if in a valid position
    if (position) {
      if (this.wristStretchState.timer === 0) {
        this.wristStretchState.timer = 1; // Start timer
      } else {
        this.wristStretchState.timer =
          now - this.wristStretchState.lastPositionChange;
      }
    } else {
      this.wristStretchState.timer = 0;
    }

    // Check if all stretches are completed
    const allCompleted =
      this.wristStretchState.flexion && this.wristStretchState.extension;

    if (allCompleted) {
      return {
        inPosition: true,
        timer: this.wristStretchState.timer,
        feedback: "Great job! You've completed all wrist stretches.",
      };
    } else if (position) {
      const remainingTime = Math.max(0, 5000 - this.wristStretchState.timer);
      const remainingSeconds = Math.ceil(remainingTime / 1000);

      let nextStretch = "";
      if (position === "extension" && !this.wristStretchState.flexion) {
        nextStretch = " Next, turn your palms up for wrist flexion stretch.";
      } else if (position === "flexion" && !this.wristStretchState.extension) {
        nextStretch =
          " Next, turn your palms down for wrist extension stretch.";
      }

      return {
        inPosition: false,
        timer: this.wristStretchState.timer,
        feedback: `Good wrist ${position} stretch! Hold for ${remainingSeconds} more seconds.${nextStretch}`,
      };
    } else {
      return {
        inPosition: false,
        timer: 0,
        feedback:
          "Extend your arms forward with palms up or down to stretch your wrists",
      };
    }
  }

  // Helper functions for wrist stretch
  isWristExtensionPosition(keypoints) {
    // Arms extended forward at shoulder height, assumed palms down
    const armsForward =
      keypoints.leftWrist.x < keypoints.leftShoulder.x - 0.2 &&
      keypoints.rightWrist.x > keypoints.rightShoulder.x + 0.2;

    const armsAtShoulderHeight =
      Math.abs(keypoints.leftWrist.y - keypoints.leftShoulder.y) < 0.1 &&
      Math.abs(keypoints.rightWrist.y - keypoints.rightShoulder.y) < 0.1;

    const elbowsStraight =
      this.calculateAngle(
        keypoints.leftShoulder,
        keypoints.leftElbow,
        keypoints.leftWrist
      ) > 160 &&
      this.calculateAngle(
        keypoints.rightShoulder,
        keypoints.rightElbow,
        keypoints.rightWrist
      ) > 160;

    return armsForward && armsAtShoulderHeight && elbowsStraight;
  }

  isWristFlexionPosition(keypoints) {
    // Similar to extension but assumes palms are up
    // We can't actually see the palm direction, so we'll look for slightly different arm positions
    // Usually flexion is done with arms slightly lower
    const armsForward =
      keypoints.leftWrist.x < keypoints.leftShoulder.x - 0.2 &&
      keypoints.rightWrist.x > keypoints.rightShoulder.x + 0.2;

    const armsSlightlyLower =
      keypoints.leftWrist.y > keypoints.leftShoulder.y &&
      keypoints.leftWrist.y < keypoints.leftShoulder.y + 0.15 &&
      keypoints.rightWrist.y > keypoints.rightShoulder.y &&
      keypoints.rightWrist.y < keypoints.rightShoulder.y + 0.15;

    const elbowsStraight =
      this.calculateAngle(
        keypoints.leftShoulder,
        keypoints.leftElbow,
        keypoints.leftWrist
      ) > 160 &&
      this.calculateAngle(
        keypoints.rightShoulder,
        keypoints.rightElbow,
        keypoints.rightWrist
      ) > 160;

    return armsForward && armsSlightlyLower && elbowsStraight;
  }
}

// Helper functions (same as in original code)
function getKeypointByName(keypoints, name) {
  return keypoints.find((kp) => kp.name === name);
}

function calculateDistance(kp1, kp2) {
  return Math.sqrt(Math.pow(kp2.x - kp1.x, 2) + Math.pow(kp2.y - kp1.y, 2));
}

function calculateAngle(kp1, kp2, kp3) {
  const radians =
    Math.atan2(kp3.y - kp2.y, kp3.x - kp2.x) -
    Math.atan2(kp1.y - kp2.y, kp1.x - kp2.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  return angle > 180 ? 360 - angle : angle;
}

//.........................................................................................//
// Close button Function (pop up window)

document.getElementById("close-btn").addEventListener("click", function (e) {
  e.preventDefault();

  // Get popup elements
  const popupContainer = document.getElementById("popup-container");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");

  // Show the confirmation popup
  popupTitle.textContent = "Confirm Close";
  popupBody.innerHTML = `
        <p>Are you sure you want to close the workout?</p>
        <div class="popup-btn-container">
            <button id="confirm-yes" class="popup-btn yes">Yes</button>
            <button id="confirm-no" class="popup-btn no">No</button>
        </div>
    `;
  popupContainer.style.display = "block";

  // Add click handlers for popup buttons
  document.getElementById("confirm-yes").addEventListener("click", () => {
    const workoutManager = new WorkoutManager();
    workoutManager.clearAllTimers();
    workoutManager.endWorkout();

    window.location.href = "workout_page.php";
  });

  document.getElementById("confirm-no").addEventListener("click", () => {
    popupContainer.style.display = "none";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const workoutManager = new WorkoutManager();
  workoutManager.init();

  createSettingsPopup();
  if (typeof tf !== "undefined" && typeof poseDetection !== "undefined") {
    init();
  }
});

//.........................................................................................//
// Switch camera Function

let isCameraView = false;

function toggleCameraView() {
  const guide = document.querySelector(".workout-guide");
  const userCam = document.querySelector(".workout-user");
  const btn = document.querySelector(".switch-view-btn");

  isCameraView = !isCameraView;

  if (isCameraView) {
    guide.classList.add("inactive");
    userCam.classList.add("active");
    btn.textContent = "Switch to Guide";
    // Update canvas size when switching to camera view
    updateCanvasSize();
  } else {
    guide.classList.remove("inactive");
    userCam.classList.remove("active");
    btn.textContent = "Switch to Camera";
  }
}

function updateCanvasSize() {
  if (videoElement && videoElement.parentElement) {
    const videoContainer = videoElement.parentElement;
    const rect = videoContainer.getBoundingClientRect();
    canvasElement.width = rect.width;
    canvasElement.height = rect.height;
  }
}
