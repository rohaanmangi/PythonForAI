# Xander chat frontend

Standalone Next.js 16 app for the existing FastAPI and LangGraph restaurant assistant.

## Run locally

1. Start the FastAPI app on port 8000 using the existing backend's normal setup.
2. Copy `.env.example` to `.env.local` and set `BACKEND_URL` if the API uses another address.
3. Run `npm install`, then `npm run dev` and open `http://localhost:3000`.

The Next.js route handlers proxy requests to FastAPI so the browser does not need cross-origin access. The backend remains unchanged.

## API contract

- `POST /ai/chat`: `{ "query": string, "session_id": string }` returns `{ "session_id": string, "answer": string }`
- `GET /ai/history?session_id=...`: `{ "session_id": string, "messages": [{ "role": "user" | "ai", "content": string }] }`

The browser creates a UUID session ID and saves it as the active session. The backend stores messages by that ID in SQLite. The app stores a local index of session IDs and titles because the backend does not expose a session-listing endpoint. This list is available only in the browser profile where the conversations were started. Conversation messages are fetched from the backend when available, with a local cache for failed or pending turns.

`GET /ai/history` returns user and final assistant messages; intermediate LangGraph/tool messages are intentionally not displayed because the backend does not expose them as activity updates.
