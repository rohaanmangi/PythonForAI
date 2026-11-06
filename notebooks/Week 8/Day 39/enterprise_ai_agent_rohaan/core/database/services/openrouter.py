import os

from openai import OpenAI
from dotenv import load_dotenv

# Load environments
load_dotenv()

# Models Defined
MODEL = "nvidia/nemotron-3.5-lightning:free"       # chat model (free)
EMB_MODEL = "nvidia/nemotron-3-embed-1b:free"      # embedding model (free, Day 24)

openrouter_client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.getenv("OPEN_ROUTER_KEY"))