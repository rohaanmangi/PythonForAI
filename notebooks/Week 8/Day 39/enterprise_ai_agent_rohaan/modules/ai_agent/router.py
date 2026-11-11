from fastapi import APIRouter
from .schemas import chat_payload

ai_agent_router = APIRouter(prefix="/ai")

@ai_agent_router.post("/chat")
def initiate_chat(query: chat_payload):
    print(query.model_dump())
    return query

@ai_agent_router.get("/history")
def get_history(session_id: str):
    print("Session Id has been received")

    # Todo
    # define service/ login
    return f"Here is the chat for {session_id} Session Id"
