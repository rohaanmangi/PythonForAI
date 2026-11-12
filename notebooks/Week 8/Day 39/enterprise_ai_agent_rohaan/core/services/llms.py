import os
from dotenv import load_dotenv


load_dotenv()

LLMS = {
    "open_router": {
        "baseUrl": "https://openrouter.ai/api/v1",
        "apiKey": os.getenv("OPEN_ROUTER_KEY"),
        "model": "google/gemma-4-26b-a4b-it:free"
    }
}