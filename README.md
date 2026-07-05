# StartHub

A MERN-stack platform connecting **startups**, **investors**, and **admins** around startup discovery, fundraising, and analytics.

StartHub combines a startup profiling and discovery system, a full fundraising workflow settled through Razorpay, an AI-assisted startup viability analysis engine powered by Google's Gemini API, and supporting tools for real-time chat, video calls, event booking, blogging, and investor cap-table governance.

> This README is generated directly from the project's technical reference documentation. Where a detail isn't documented there, it's called out explicitly below rather than assumed.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [User Roles](#user-roles)
- [Known Limitations](#known-limitations)
- [License](#license)

---

## Features

- **Startup Discovery & Profiling** — Startups build an extended profile (business stage, funding stage, financials, team size, growth metrics) that investors can browse and evaluate.
- **Fundraising Workflow** — Startups request funds (equity, debt, grant, or venture-debt) from a specific investor; approved requests are settled through an integrated Razorpay payment flow with full lifecycle tracking (`pending → approved/rejected → completed`).
- **AI-Assisted Viability Analysis** — A deterministic 0–100 scoring engine (market size, unit economics, runway, competition, team) plus a 12-month profit/loss projection and a Gemini-generated narrative assessment, with graceful fallback if the AI call fails.
- **Real-Time Chat & Video Calls** — Socket.IO-powered messaging and native WebRTC video calls between startups and investors.
- **Events & Subscription-Gated Booking** — Admin-created events (pitch days, networking, funding, fairs) that require an active subscription to book.
- **Blogging** — Thought-leadership content authored by admins and investors (startups have read-only access at the schema level).
- **Governance Analytics** — Startups can analyze their own investor cap table: concentration (via a Herfindahl-Hirschman Index calculation), funding timeline, and investment statistics.
- **Idea Finder** — A public, client-side AI tool that recommends a startup domain based on a short questionnaire.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 7, Tailwind CSS 4, Chart.js / react-chartjs-2, GSAP, Three.js, Socket.IO client |
| Backend | Node.js, Express 5, Mongoose 8, Socket.IO, JWT (`jsonwebtoken`), bcryptjs |
| Database | MongoDB |
| AI | Google Generative AI (Gemini) — server-side and client-side |
| Payments | Razorpay (order creation + HMAC-SHA256 signature verification) |
| Email | Nodemailer (Gmail SMTP) |

## Architecture

StartHub runs as **three independent Node.js processes**:

| Process | Entry Point | Port | Role |
|---|---|---|---|
| Main API server | `backend/server.js` | `5001` | Express REST API + Socket.IO server + inline Razorpay/subscription routes |
| Payment microservice | `backend/pay.js` | `5002` | Standalone Razorpay demo/legacy order flow |
| Frontend dev server | `frontend/` (Vite) | `5173` | React single-page application |

The Express API is the only component that talks to MongoDB. The frontend communicates with it over REST and a persistent Socket.IO connection, but also calls Google's Gemini API and loads Razorpay's Checkout script **directly from the browser**, bypassing the backend for those specific operations. There is no API gateway or reverse proxy in front of the backend, and the frontend's API base URL (`http://localhost:5001`) is hardcoded rather than environment-configurable.

For a full breakdown of request flow, component interaction, and data flow — including diagrams — see the project's Software Architecture Document.

## Project Structure

```
StartHub/
├── backend/
│   ├── config/db.js                 # Mongoose connection setup
│   ├── controllers/                 # Business logic, one file per resource
│   ├── middleware/                  # authMiddleware.js (JWT), upload.js (Multer)
│   ├── models/                      # Mongoose schemas (10 collections)
│   ├── routes/                      # Express routers, one file per resource
│   ├── services/                    # openaiClient.js (Gemini AI), socketService.js
│   ├── utils/scorer.js              # Startup viability scoring algorithm
│   ├── uploads/                     # Multer-written blog media
│   ├── pay.js                       # Standalone Razorpay microservice (port 5002)
│   └── server.js                    # App entry point
└── frontend/
    ├── src/
    │   ├── api/api.js                # Fetch-based API wrapper (partial coverage)
    │   ├── context/                  # AuthContext, SocketContext, SubscriptionContext
    │   ├── components/               # Shared/reusable UI
    │   ├── pages/                    # admin/, startup/, investor/, public pages
    │   ├── App.jsx                   # Route table + provider composition
    │   └── main.jsx                  # React entry point
    ├── index.html                    # Loads Razorpay Checkout.js + Chatbase widget
    └── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB instance (local or hosted) and its connection string
- API credentials for Razorpay and Google Gemini if you want payments and AI features to work end-to-end

> The project's reference documentation does not specify exact Node/npm version requirements, a dependency-installation sequence, or a Docker/CI setup. The steps below cover the standard workflow for a project of this shape; a `git clone` followed by `npm install` in each of `backend/` and `frontend/` is the conventional first step but is not itself documented in the source material.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd StartHub

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

Create a `.env` file inside `backend/` with the variables listed in [Environment Variables](#environment-variables). No `.env` file is committed to the repository, and none is required for the frontend beyond the two `VITE_` variables listed below.

### Running the App

Three processes need to run concurrently for full functionality:

```bash
# 1. Main API server (from /backend)
npm run dev          # development, via nodemon
npm start             # production, via node server.js

# 2. Payment microservice (from /backend) — only needed for the Pay.jsx demo flow
npm run pay

# 3. Frontend dev server (from /frontend)
npm run dev
```

The frontend will be available at `http://localhost:5173`, the main API at `http://localhost:5001`, and the payment microservice at `http://localhost:5002`.

To build the frontend for production:

```bash
cd frontend
npm run build     # outputs a static bundle
npm run preview   # serve the build locally for verification
```

> No deployment manifest (Dockerfile, `docker-compose.yml`, Procfile, or platform-specific config) is documented. The backend's CORS configuration and the frontend's hardcoded API URLs currently only support running against `localhost`.

## Environment Variables

**Backend** (`backend/.env`):

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API credentials |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail SMTP credentials (booking confirmation emails) |
| `GEMINI_API_KEY` | Server-side Gemini API key (viability narrative generation) |
| `PORT` | Port for the main backend server |

**Frontend** (`frontend/.env`):

| Variable | Purpose |
|---|---|
| `VITE_GEMINI_API_KEY` | Client-side Gemini API key (used by the Idea Finder tool) |
| `VITE_RAZORPAY_KEY_ID` | Publishable Razorpay key for client-side checkout |

> ⚠️ `VITE_GEMINI_API_KEY` is bundled into the shipped frontend code and is visible to anyone who inspects it — unlike the Razorpay publishable key, this is a real credential-exposure consideration for the Idea Finder feature as currently implemented.

## API Overview

The API is REST-style, mounted under `/api`, and returns a `{ success, data | message }` JSON envelope in most (though not all) controllers. Representative resource groups:

| Base Path | Auth |
|---|---|
| `/api/auth` | `protect` on `/me` only |
| `/api/governance` | `protect` + `authorize('startup')` on all routes |
| `/api/investor-analytics` | `protect` + `authorize('investor')` on all routes |
| `/api/fund-requests`, `/api/chat`, `/api/bookings`, `/api/events`, `/api/analytics` | Not JWT-protected — relies on client-supplied identifiers |
| `/api/blogs` | `protect` + `authorize('admin','investor')` on create only |

Authorization coverage is **not uniform** across the API — several resource routes do not require a JWT and instead trust a client-supplied user ID. See the project's Software Architecture Document for the full coverage matrix and endpoint-by-endpoint reference.

## User Roles

| Role | Primary Activities |
|---|---|
| `startup` | Builds a profile, submits viability analyses, tracks growth metrics, browses/books events, sends fund requests, reads blogs, chats/video-calls investors, reviews its own governance data |
| `investor` | Browses startups, reviews portfolio analytics, approves/rejects/pays out fund requests, publishes blogs, chats/video-calls startups |
| `admin` | Manages platform-wide events, views cross-startup analytics, publishes blogs, moderates content |

## Known Limitations

This project's reference documentation captures a number of confirmed, code-level issues worth knowing before contributing:

- `subscriptionRoutes.js` / `subscriptionController.js` are **dead code** — never mounted by `server.js`; live subscription/payment logic runs through duplicated inline routes instead.
- `blogController.deleteComment` will throw at runtime (references an undefined variable and calls a Mongoose 8.x-incompatible method).
- `userController.createUser` cannot succeed as written — it doesn't accept a `password`, which the `User` schema requires.
- Several internal service URLs (`http://localhost:5001`, `http://localhost:5002`) are hardcoded rather than environment-configurable.
- Authorization coverage is inconsistent — most resource routes trust a client-supplied user ID instead of a verified JWT.
- The Socket.IO layer performs **no authentication** at all.
- No caching layer, no MongoDB transactions, and no TURN server (WebRTC calls behind restrictive/symmetric NATs will fail).
- `peerjs` is declared as a dependency but never used.

A full, categorized list of architectural strengths and limitations is available in the project's Software Architecture Document.

## License

Not specified in the project's reference documentation. Add a license file and update this section before publishing or accepting external contributions.

## Contributing

No contribution guidelines, code of conduct, or issue/PR templates are documented at this time.
