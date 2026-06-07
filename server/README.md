# Youtogram Server

Server-side starter for Youtogram.

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Run server: `npm run dev`

**Security notes**

- Never commit `.env` or secrets to source control. `.env.example` shows which variables are required.
- Set a strong `JWT_SECRET` in production (use a randomly generated 32+ character string).
- Change default admin credentials and remove any demo accounts before going public.
- Run `npm audit` and keep dependencies up to date; avoid `--force` unless you test breaking changes.

## Features

- Express server with modular routes
- JWT auth middleware
- MongoDB connection using Mongoose
- Socket.io for chat and live events
