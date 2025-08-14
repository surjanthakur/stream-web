// Enhanced Video Conference Client with Better Error Handling

class VideoConferenceClient {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.localStream = null;
    this.peers = {};
    this.isVideoOn = true;
    this.isAudioOn = true;
    this.isScreenSharing = false;
    this.isChatVisible = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isInitialized = false;

    this.configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    };

    this.init();
  }

  // Initialize the client
  init() {
    try {
      this.setupSocketConnection();
      this.extractRoomId();
      this.setupEventListeners();
      this.isInitialized = true;
      console.log("Video conference client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize video conference client:", error);
      this.showError("Failed to initialize. Please refresh the page.");
    }
  }

  // Setup socket connection with error handling
  setupSocketConnection() {
    try {
      this.socket = io({
        timeout: 10000,
        transports: ["websocket", "polling"],
      });

      this.socket.on("connect", () => {
        console.log("Connected to server");
        this.reconnectAttempts = 0;
        this.hideError();
      });

      this.socket.on("disconnect", (reason) => {
        console.warn("Disconnected from server:", reason);
        if (reason === "io server disconnect") {
          this.handleReconnection();
        }
      });

      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        this.handleReconnection();
      });
    } catch (error) {
      console.error("Failed to setup socket connection:", error);
      throw new Error("Socket connection failed");
    }
  }

  // Extract room ID with validation
  extractRoomId() {
    const pathParts = window.location.pathname.split("/");
    this.roomId = pathParts[pathParts.length - 1];

    if (!this.roomId || this.roomId.length < 3) {
      throw new Error("Invalid room ID");
    }
  }

  // Setup various event listeners
  setupEventListeners() {
    // Socket event listeners
    this.socket.on("user-joined", this.handleUserJoined.bind(this));
    this.socket.on("signal", this.handleSignal.bind(this));
    this.socket.on("chat-message", this.handleChatMessage.bind(this));
    this.socket.on("user-left", this.handleUserLeft.bind(this));

    // Page visibility change
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange.bind(this)
    );

    // Before unload
    window.addEventListener("beforeunload", this.cleanup.bind(this));

    // Error handling for unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      this.showError("An unexpected error occurred");
    });
  }

  // Main function to join the video meeting
  async joinMeeting() {
    if (!this.isInitialized) {
      this.showError("Client not initialized properly");
      return;
    }

    const usernameInput = document.getElementById("usernameInput");
    if (!usernameInput) {
      this.showError("Username input not found");
      return;
    }

    const username = usernameInput.value.trim();
    console.log("User joining meeting:", username);

    if (!username) {
      this.showError("Please enter your username");
      return;
    }

    if (username.length > 50) {
      this.showError("Username too long (max 50 characters)");
      return;
    }

    try {
      this.showLoading("Accessing camera and microphone...");

      // Get media with better error handling
      await this.getUserMedia();

      this.showLoading("Joining room...");

      // Join the call
      this.socket.emit("join-call", this.roomId);
      console.log("Joining call with room ID:", this.roomId);

      this.hideLoading();

      // Hide lobby and show meeting
      this.showMeetingView();
    } catch (error) {
      console.error("Error joining meeting:", error);
      this.hideLoading();
      this.handleMediaError(error);
    }
  }

  // Show meeting view and hide lobby
  showMeetingView() {
    const lobbySection = document.getElementById("lobbySection");
    const meetingSection = document.getElementById("meetingSection");

    if (lobbySection) {
      lobbySection.style.display = "none";
    }
    if (meetingSection) {
      meetingSection.style.display = "flex";
    }
  }

  // Get user media with comprehensive error handling
  async getUserMedia() {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      const localVideo = document.getElementById("localVideo");
      if (localVideo) {
        localVideo.srcObject = this.localStream;
      } else {
        console.warn("Local video element not found");
      }
    } catch (error) {
      // Try with basic constraints if advanced ones fail
      console.warn("Advanced constraints failed, trying basic:", error);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        const localVideo = document.getElementById("localVideo");
        if (localVideo) {
          localVideo.srcObject = this.localStream;
        }
      } catch (basicError) {
        throw basicError;
      }
    }
  }

  // Handle media access errors
  handleMediaError(error) {
    let errorMessage = "Could not access camera/microphone. ";

    switch (error.name) {
      case "NotAllowedError":
        errorMessage += "Please allow camera and microphone permissions.";
        break;
      case "NotFoundError":
        errorMessage += "No camera or microphone found.";
        break;
      case "NotReadableError":
        errorMessage += "Camera or microphone is already in use.";
        break;
      case "OverconstrainedError":
        errorMessage += "Camera/microphone constraints cannot be satisfied.";
        break;
      case "SecurityError":
        errorMessage += "Access denied due to security restrictions.";
        break;
      default:
        errorMessage += "Please check your device settings.";
    }

    this.showError(errorMessage);
  }

  // Handle when another user joins
  handleUserJoined(id, clients) {
    console.log("User joined:", id, "All clients:", clients);

    if (!Array.isArray(clients)) {
      console.error("Invalid clients data received");
      return;
    }

    clients.forEach((clientId) => {
      if (clientId === this.socket.id) return;

      try {
        this.createPeerConnection(clientId, true);
      } catch (error) {
        console.error(
          `Failed to create peer connection for ${clientId}:`,
          error
        );
      }
    });
  }

  // Create peer connection with error handling
  async createPeerConnection(clientId, shouldCreateOffer = false) {
    try {
      if (this.peers[clientId]) {
        console.log(`Peer connection for ${clientId} already exists`);
        return this.peers[clientId];
      }

      const peerConnection = new RTCPeerConnection(this.configuration);
      this.peers[clientId] = peerConnection;

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          try {
            peerConnection.addTrack(track, this.localStream);
          } catch (error) {
            console.error("Failed to add track:", error);
          }
        });
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit("signal", clientId, {
            type: "candidate",
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log("Received remote track from:", clientId);
        this.handleRemoteStream(event, clientId);
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(
          `Connection state for ${clientId}:`,
          peerConnection.connectionState
        );

        if (peerConnection.connectionState === "failed") {
          this.handlePeerConnectionFailure(clientId);
        }
      };

      // Create offer if needed
      if (shouldCreateOffer) {
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          this.socket.emit("signal", clientId, {
            type: "offer",
            offer: peerConnection.localDescription,
          });
        } catch (error) {
          console.error(`Failed to create offer for ${clientId}:`, error);
        }
      }

      return peerConnection;
    } catch (error) {
      console.error(`Failed to create peer connection for ${clientId}:`, error);
      delete this.peers[clientId];
      throw error;
    }
  }

  // Handle incoming signals with better error handling
  async handleSignal(fromId, data) {
    try {
      let peer = this.peers[fromId];

      if (!peer) {
        peer = await this.createPeerConnection(fromId, false);
      }

      switch (data.type) {
        case "offer":
          await this.handleOffer(peer, fromId, data.offer);
          break;
        case "answer":
          await this.handleAnswer(peer, data.answer);
          break;
        case "candidate":
          await this.handleIceCandidate(peer, data.candidate);
          break;
        default:
          console.warn("Unknown signal type:", data.type);
      }
    } catch (error) {
      console.error(`Error handling signal from ${fromId}:`, error);
    }
  }

  // Handle offer
  async handleOffer(peer, fromId, offer) {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      this.socket.emit("signal", fromId, {
        type: "answer",
        answer: answer,
      });
    } catch (error) {
      console.error("Error handling offer:", error);
      throw error;
    }
  }

  // Handle answer
  async handleAnswer(peer, answer) {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error("Error handling answer:", error);
      throw error;
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(peer, candidate) {
    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      if (error.toString().includes("InvalidStateError")) {
        console.warn("ICE candidate added in wrong state, queuing for later");
        // Could implement candidate queuing here
      } else {
        console.error("Error adding ICE candidate:", error);
      }
    }
  }

  // Handle remote stream
  handleRemoteStream(event, clientId) {
    try {
      const videoContainer = document.getElementById("conferenceArea");
      if (!videoContainer) {
        console.error("Conference area not found");
        return;
      }

      // Remove existing participant if any
      const existingParticipant = document.querySelector(
        `[data-client-id="${clientId}"]`
      );
      if (existingParticipant) {
        existingParticipant.remove();
      }

      const participantDiv = document.createElement("div");
      participantDiv.className = "participant-video";
      participantDiv.setAttribute("data-client-id", clientId);

      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = false; // Don't mute remote videos
      video.srcObject = event.streams[0];

      // Handle video errors
      video.onerror = (error) => {
        console.error("Video playback error:", error);
        this.showError("Error playing remote video");
      };

      const infoDiv = document.createElement("div");
      infoDiv.className = "participant-info";
      infoDiv.innerHTML = `<span class="participant-name">${clientId}</span>`;

      participantDiv.appendChild(video);
      participantDiv.appendChild(infoDiv);
      videoContainer.appendChild(participantDiv);
    } catch (error) {
      console.error("Error handling remote stream:", error);
    }
  }

  // Handle user leaving
  handleUserLeft(clientId) {
    console.log("User left:", clientId);

    try {
      // Close peer connection
      if (this.peers[clientId]) {
        this.peers[clientId].close();
        delete this.peers[clientId];
      }

      // Remove video element
      const participantElement = document.querySelector(
        `[data-client-id="${clientId}"]`
      );
      if (participantElement) {
        participantElement.remove();
      }
    } catch (error) {
      console.error("Error handling user left:", error);
    }
  }

  // Toggle video with error handling
  toggleVideo() {
    try {
      this.isVideoOn = !this.isVideoOn;
      const videoOn = document.querySelector(".video-on");
      const videoOff = document.querySelector(".video-off");

      if (this.localStream) {
        this.localStream.getVideoTracks().forEach((track) => {
          track.enabled = this.isVideoOn;
        });
      }

      if (videoOn) videoOn.classList.toggle("hidden", !this.isVideoOn);
      if (videoOff) videoOff.classList.toggle("hidden", this.isVideoOn);
    } catch (error) {
      console.error("Error toggling video:", error);
      this.showError("Failed to toggle video");
    }
  }

  // Toggle audio with error handling
  toggleAudio() {
    try {
      this.isAudioOn = !this.isAudioOn;
      const audioOn = document.querySelector(".audio-on");
      const audioOff = document.querySelector(".audio-off");

      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((track) => {
          track.enabled = this.isAudioOn;
        });
      }

      if (audioOn) audioOn.classList.toggle("hidden", !this.isAudioOn);
      if (audioOff) audioOff.classList.toggle("hidden", this.isAudioOn);
    } catch (error) {
      console.error("Error toggling audio:", error);
      this.showError("Failed to toggle audio");
    }
  }

  // Toggle screen sharing with better error handling
  async toggleScreenShare() {
    try {
      if (!this.isScreenSharing) {
        await this.startScreenShare();
      } else {
        await this.stopScreenShare();
      }

      // Update UI
      const shareOn = document.querySelector(".share-on");
      const shareOff = document.querySelector(".share-off");

      if (shareOn) shareOn.classList.toggle("hidden", this.isScreenSharing);
      if (shareOff) shareOff.classList.toggle("hidden", !this.isScreenSharing);
    } catch (error) {
      console.error("Error toggling screen share:", error);
      this.showError("Failed to toggle screen sharing");
    }
  }

  // Start screen sharing
  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true, // Include system audio if available
      });

      // Replace video track for all peers
      const videoTrack = screenStream.getVideoTracks()[0];

      Object.values(this.peers).forEach((peer) => {
        const sender = peer
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack).catch(console.error);
        }
      });

      // Handle screen share ending
      videoTrack.onended = () => {
        this.stopScreenShare().catch(console.error);
      };

      this.isScreenSharing = true;
    } catch (error) {
      if (error.name === "NotAllowedError") {
        console.log("Screen sharing cancelled by user");
      } else {
        throw error;
      }
    }
  }

  // Stop screen sharing
  async stopScreenShare() {
    try {
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];

        Object.values(this.peers).forEach((peer) => {
          const sender = peer
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack).catch(console.error);
          }
        });
      }

      this.isScreenSharing = false;
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  }

  // Send chat message with validation
  sendMessage() {
    try {
      const chatInput = document.getElementById("chatInput");
      const usernameInput = document.getElementById("usernameInput");

      if (!chatInput || !usernameInput) {
        console.error("Chat elements not found");
        return;
      }

      const message = chatInput.value.trim();
      const username = usernameInput.value.trim();

      if (!message) return;

      if (message.length > 500) {
        this.showError("Message too long (max 500 characters)");
        return;
      }

      this.socket.emit("chat-message", message, username);
      chatInput.value = "";
    } catch (error) {
      console.error("Error sending message:", error);
      this.showError("Failed to send message");
    }
  }

  // Handle incoming chat message
  handleChatMessage(sender, message, socketId) {
    try {
      const chatDisplay = document.getElementById("chatDisplay");
      if (!chatDisplay) {
        console.error("Chat display not found");
        return;
      }

      const messageElement = document.createElement("div");
      messageElement.className = "chat-message";

      // Sanitize message content
      const sanitizedSender = this.sanitizeText(sender);
      const sanitizedMessage = this.sanitizeText(message);

      messageElement.innerHTML = `
        <span class="chat-sender">${sanitizedSender}:</span>
        <span class="chat-text">${sanitizedMessage}</span>
      `;

      chatDisplay.appendChild(messageElement);
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    } catch (error) {
      console.error("Error handling chat message:", error);
    }
  }

  // Toggle chat visibility
  toggleChat() {
    try {
      const chatRoom = document.querySelector(".chatRoom");
      if (chatRoom) {
        this.isChatVisible = !this.isChatVisible;
        chatRoom.classList.toggle("hidden", !this.isChatVisible);
      }
    } catch (error) {
      console.error("Error toggling chat:", error);
    }
  }

  // Handle peer connection failure
  handlePeerConnectionFailure(clientId) {
    console.warn(
      `Peer connection failed for ${clientId}, attempting to reconnect`
    );

    try {
      // Close existing connection
      if (this.peers[clientId]) {
        this.peers[clientId].close();
        delete this.peers[clientId];
      }

      // Attempt to recreate connection
      setTimeout(() => {
        this.createPeerConnection(clientId, true).catch(console.error);
      }, 2000);
    } catch (error) {
      console.error("Error handling peer connection failure:", error);
    }
  }

  // Handle reconnection attempts
  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

      this.showError(
        `Connection lost. Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      this.showError("Connection failed. Please refresh the page.");
    }
  }

  // Handle page visibility change
  handleVisibilityChange() {
    if (document.hidden) {
      console.log("Page hidden, pausing video");
      // Optionally pause video tracks to save bandwidth
    } else {
      console.log("Page visible, resuming video");
      // Resume video tracks
    }
  }

  // End call with proper cleanup
  endCall() {
    try {
      this.cleanup();
      window.location.href = "/";
    } catch (error) {
      console.error("Error ending call:", error);
      // Force redirect anyway
      window.location.href = "/";
    }
  }

  // Cleanup resources
  cleanup() {
    try {
      // Close all peer connections
      Object.values(this.peers).forEach((peer) => {
        try {
          peer.close();
        } catch (error) {
          console.error("Error closing peer connection:", error);
        }
      });
      this.peers = {};

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (error) {
            console.error("Error stopping track:", error);
          }
        });
        this.localStream = null;
      }

      // Disconnect socket
      if (this.socket) {
        this.socket.disconnect();
      }

      console.log("Cleanup completed");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  // Utility functions
  sanitizeText(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    console.error(message);
    // You can implement a toast/modal system here
    const errorElement = document.getElementById("errorDisplay");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    } else {
      alert(message); // Fallback
    }
  }

  hideError() {
    const errorElement = document.getElementById("errorDisplay");
    if (errorElement) {
      errorElement.style.display = "none";
    }
  }

  showLoading(message) {
    const loadingElement = document.getElementById("loadingDisplay");
    if (loadingElement) {
      loadingElement.textContent = message;
      loadingElement.style.display = "block";
    }
  }

  hideLoading() {
    const loadingElement = document.getElementById("loadingDisplay");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}

// Initialize the client
const videoClient = new VideoConferenceClient();

// FIXED: Global functions for HTML buttons with correct names matching HTML
function handleJoinMeeting() {
  try {
    if (typeof videoClient !== "undefined" && videoClient.joinMeeting) {
      videoClient.joinMeeting();
    } else {
      console.error("Video client not initialized");
      alert("Video client not ready. Please refresh the page.");
    }
  } catch (error) {
    console.error("Error in handleJoinMeeting:", error);
    alert("Failed to join meeting. Please try again.");
  }
}

function handleToggleVideo() {
  try {
    if (typeof videoClient !== "undefined" && videoClient.toggleVideo) {
      videoClient.toggleVideo();
    } else {
      console.error("Video client not available");
    }
  } catch (error) {
    console.error("Error in handleToggleVideo:", error);
  }
}

function handleToggleAudio() {
  try {
    if (typeof videoClient !== "undefined" && videoClient.toggleAudio) {
      videoClient.toggleAudio();
    } else {
      console.error("Video client not available");
    }
  } catch (error) {
    console.error("Error in handleToggleAudio:", error);
  }
}

function handleToggleScreenShare() {
  try {
    if (typeof videoClient !== "undefined" && videoClient.toggleScreenShare) {
      videoClient.toggleScreenShare();
    } else {
      console.error("Video client not available");
    }
  } catch (error) {
    console.error("Error in handleToggleScreenShare:", error);
  }
}

function handleToggleChat() {
  try {
    if (typeof videoClient !== "undefined" && videoClient.toggleChat) {
      videoClient.toggleChat();
    } else {
      console.error("Video client not available");
    }
  } catch (error) {
    console.error("Error in handleToggleChat:", error);
  }
}

function handleSendMessage() {
  try {
    if (typeof videoClient !== "undefined" && videoClient.sendMessage) {
      videoClient.sendMessage();
    } else {
      console.error("Video client not available");
    }
  } catch (error) {
    console.error("Error in handleSendMessage:", error);
  }
}

function handleEndCall() {
  try {
    if (typeof videoClient !== "undefined" && videoClient.endCall) {
      if (confirm("Are you sure you want to end the call?")) {
        videoClient.endCall();
      }
    } else {
      console.error("Video client not available");
      // Fallback redirect
      window.location.href = "/";
    }
  } catch (error) {
    console.error("Error in handleEndCall:", error);
    // Fallback redirect
    window.location.href = "/";
  }
}

function handleChatKeyPress(event) {
  try {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  } catch (error) {
    console.error("Error in handleChatKeyPress:", error);
  }
}

// Legacy functions for backward compatibility (if needed)
function joinMeeting() {
  return handleJoinMeeting();
}

function toggleVideo() {
  return handleToggleVideo();
}

function toggleAudio() {
  return handleToggleAudio();
}

function toggleScreenShare() {
  return handleToggleScreenShare();
}

function toggleChat() {
  return handleToggleChat();
}

function sendMessage() {
  return handleSendMessage();
}

function endCall() {
  return handleEndCall();
}
