from fastapi import FastAPI

from modules.ai_agent.router import ai_agent_router

app = FastAPI()

app.include_router(
    ai_agent_router,
    tags=["AI Module"]
)

@app.get("/", status_code=200)
async def root():
   return {"message": "You are at the Xander's Backend"}