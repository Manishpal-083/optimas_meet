# Optimas Meet (Phase 1 Foundation Boilerplate)

Optimas Meet is a modular, production-ready video conferencing application built with React, Express, Socket.io, and WebRTC. This repository contains the Phase 1 architectural scaffolding designed for modular scale and rapid expansion.

---

## ⚡ Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v4 + React Router v6 + Lucide Icons
- **Backend**: Node.js + Express + Socket.io v4
- **Real-time Engine**: WebRTC mesh signaling via native `RTCPeerConnection` wrappers
- **Security**: JWT session validation + bcrypt hashed credentials

---

## 📂 Project Architecture

```text
optimas_meet/
├── client/                      # React Frontend Package
│   ├── src/
│   │   ├── assets/              # Static assets
│   │   ├── components/          # Reusable UI components
│   │   │   ├── common/          # Atomic components (Buttons, Inputs, etc.)
│   │   │   ├── layout/          # Page layouts (Navbar, Footer, Sidebars)
│   │   │   └── meeting/         # Call components (VideoGrid, VideoTile, Controls)
│   │   ├── context/             # Global React State Providers
│   │   │   ├── AuthContext.jsx  # User sessions validation
│   │   │   ├── SocketContext.jsx# Websocket link management
│   │   │   └── MeetingContext.jsx# Device streams and room occupancy state
│   │   ├── hooks/               # Custom lifecycle hooks
│   │   │   └── useWebRTC.js     # Peer-to-peer peer connection manager
│   │   ├── pages/               # Routed view panels (Home, Login, Room)
│   │   ├── routes/              # Protected & public path mapping
│   │   ├── index.css            # Stylesheet + Tailwind v4 theme definitions
│   │   └── main.jsx             # React mounting gateway
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Express API Gateway & Signaling Server
│   ├── src/
│   │   ├── config/              # Core settings (database mock configuration, jwt keys)
│   │   ├── controllers/         # API business controllers (auth endpoints, room validates)
│   │   ├── middleware/          # JWT gatekeepers and error interceptors
│   │   ├── models/              # Relational blueprints (User, Meeting) & runtime DB mocks
│   │   ├── routes/              # HTTP endpoint routers
│   │   └── sockets/             # Socket namespaces and signaling handlers
│   │       ├── socketHandler.js # Main Socket coordinator
│   │       ├── webrtcHandler.js # SDP and ICE candidate relaying
│   │       └── chatHandler.js   # Boilerplate messaging coordination
│   ├── server.js                # Core app listener
│   └── package.json
│
└── package.json                 # Monorepo runner configurations
```

---

## 🚀 Running Locally

Follow these steps to spin up the development environment.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org) (v18+ recommended) installed.

### 1. Installation

Install dependencies for the root, server, and client directories:

```bash
npm run install:all
```

### 2. Configuration

Create a `.env` file in the `server/` directory based on the template:

```bash
cp server/.env.example server/.env
```

Review and adjust variables (e.g., ports, secret keys) as needed.

### 3. Launch Development Servers

Run both the frontend client (Vite) and backend server (Nodemon) concurrently:

```bash
npm run dev
```

- **Frontend Client**: Runs at [http://localhost:5173](http://localhost:5173)
- **Backend API Gateway**: Runs at [http://localhost:5005](http://localhost:5005)

---

## 🔗 Signaling & WebRTC Walkthrough

1. **Session Gatekeeper**: REST endpoint (`/api/auth/register` & `/api/auth/login`) registers user credentials and returns a JWT token.
2. **REST Validation**: When a user inputs a room code, the client pings `/api/meetings/validate/:roomId` to check validity before joining.
3. **Websocket Attachment**: On entry to the meeting route, `SocketContext.jsx` initiates a Socket.io link, appending the JWT inside the authorization header.
4. **Signaling Exchange**:
   - Client sends `join-room`. The server relays the roster of existing socket IDs back to the sender.
   - For each peer, the client constructs an `RTCPeerConnection`, adds local camera/audio tracks, creates an SDP offer, and sends `sdp-offer` to the server.
   - The server routes the payload to the recipient. The recipient sets the remote description, generates an `sdp-answer`, and signals it back.
   - During negotiations, both clients exchange ICE connection candidates via `ice-candidate` relays.
   - Once connected, the native `ontrack` listener binds remote media feeds to dynamic tiles in the `VideoGrid`.
# optimas_meet
