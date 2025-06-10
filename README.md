# 🌊 Stream-Web

> A modern, feature-rich video calling platform built with cutting-edge web technologies

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4+-blue.svg)](https://socket.io/)

## ✨ What is Stream-Web?

Stream-Web is a powerful, real-time video calling application that brings people together through seamless communication. Think Zoom, but built with modern web technologies and a focus on peer-to-peer connections for optimal performance.

## 🚀 Key Features

### 📹 **Video Calling**
- High-quality video calls with multiple participants
- Adaptive video quality based on network conditions
- Camera on/off toggle with smooth transitions

### 💬 **Real-time Chat**
- Instant messaging during video calls
- Chat history preservation
- Emoji support and message notifications

### 🖥️ **Screen Sharing**
- Share your entire screen or specific applications
- High-quality screen capture
- Audio sharing alongside screen content

### 🔗 **Peer-to-Peer Technology**
- Direct connections between users using WebRTC
- Reduced server load and improved performance
- Low latency communication

### ⚡ **Real-time Communication**
- Powered by Socket.io for instant connectivity
- Automatic reconnection handling
- Room-based communication system

## 🛠️ Technology Stack

| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **WebRTC** | Peer-to-peer communication | Direct, low-latency connections |
| **Socket.io** | Real-time messaging | Reliable bidirectional communication |
| **Node.js** | Backend server | Fast, scalable JavaScript runtime |
| **Express.js** | Web framework | Simple and flexible web application framework |
| **HTML5/CSS3** | Frontend structure | Modern web standards |
| **JavaScript** | Client-side logic | Interactive user experience |

## 🎯 How It Works

```
┌─────────────┐    Socket.io    ┌─────────────┐
│   Client A  │◄─────────────►│   Server    │
└─────────────┘                └─────────────┘
       │                              │
       │         WebRTC P2P           │
       │       ┌─────────────┐        │
       └──────►│   Client B  │◄───────┘
               └─────────────┘
```

1. **Connection Setup**: Users connect through Socket.io signaling server
2. **Room Creation**: Participants join virtual rooms for organized communication
3. **Peer Discovery**: WebRTC establishes direct connections between users
4. **Media Streaming**: Video, audio, and screen sharing flow peer-to-peer
5. **Chat Integration**: Real-time messages complement video communication

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Modern web browser with WebRTC support

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/surjanthakur/stream-web.git
   cd stream-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   nodemon app.js
   ```

4. **Open your browser**
   ```
   Navigate to http://localhost:8080
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
```

## 🎮 Usage Guide

### Starting a Video Call
1. 🌐 Open the application in your web browser
2. 🎪 Create or join a room using a room ID
3. 🎥 Allow camera and microphone permissions
4. 📞 Start connecting with other participants!

### Using Chat
- 💬 Type messages in the chat panel
- 📤 Press Enter or click Send to share
- 👥 Messages are visible to all room participants

### Screen Sharing
- 🖥️ Click the "Share Screen" button
- 🎯 Select the screen or application to share
- 👀 All participants can view your shared content

## 🏗️ Project Structure

```
stream-web/
├── 📁 public/           # Static frontend files
│   ├── 📄 main.html    # Main HTML file
│   ├── 🎨 main.css     # Styling
│   └── ⚡ main.js     # Client-side logic
├── 📁 controllers/    # Backend server code
│   └── 🔌 socket.js     # Socket.io handlers
├── 📋 package.json      # Project dependencies
└── 📖 README.md         # This file
```

## 🔧 Configuration Options

### Server Configuration
- **Port**: Change the default port in `app.js`
- **CORS**: Configure allowed origins for security
- **Socket.io**: Customize connection settings

### Client Configuration
- **Video Quality**: Adjust resolution and frame rate
- **Audio Settings**: Configure microphone and speaker options
- **UI Themes**: Customize the interface appearance

## 🤝 Contributing

## 🐛 Known Issues & Solutions

### Common Problems
- **Camera not working**: Check browser permissions
- **Audio issues**: Verify microphone access
- **Connection problems**: Ensure proper network configuration

### Browser Compatibility
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WebRTC community for excellent documentation
- Socket.io team for real-time communication tools
- Open source contributors who make projects like this possible

## 📞 Support & Contact

- 📧 **Email**: your.email@example.com

---

<div align="center">

**Made with ❤️ by [surjanthakur]**

⭐ If you found this project helpful, give it a star!

</div>
