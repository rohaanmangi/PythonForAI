Kind: software — a customer support chat application for Xander Restaurant.
Deal: dark neutral palette blue-black-cornflower because the brief calls for midnight blue and an electric blue accent; Urbanist with DM Mono; soft radius; solid primary buttons; one abstract welcome mark and restrained grid detail. The app frame is the real chat product UI, with menu/pricing and complaint support grounded in the two LangGraph worker agents.
Voice: technical-dry; concise, specific interface copy; no claims about speed, availability, or hidden tool activity.

Screen plan:
- Chat workspace: conversation header, messages, and composer; UI surface; fills the viewport and adapts to tablet and phone.
- Empty conversation: product name, the two real support areas, and prompt starters; restrained abstract mark as the software visual.
- Sidebar: known local conversation history, search, session switching, theme control, and new-chat action.

Backend facts: POST /ai/chat accepts query and session_id and returns session_id and answer. GET /ai/history accepts a known session_id and returns user/AI messages. The backend persists SQLite history but has no endpoint to enumerate sessions. The UI keeps the session index in local browser storage and does not show intermediate LangGraph or tool events.
