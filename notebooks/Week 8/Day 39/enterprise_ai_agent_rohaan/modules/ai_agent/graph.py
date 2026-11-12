from langchain_core.messages import SystemMessage
from langgraph.graph import START, MessagesState, StateGraph
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import ToolNode
from modules.ai_agent.tools import TOOLS
from core.services.llms import LLMS

SYSTEM_PROMPT = """You are the friendly customer support assistant for Xander Restaurant.
Keep replies short. Prices are in Pakistani rupees. Use fetch_menu for menu/prices.
For complaints, collect customer name, phone, complaint and order ID. Validate the
order ID with validate_order_id, then call log_complaint only for a valid order.
Never invent facts. Ask for missing details.
"""

def create_chat_model(llm="open_router"):
    return ChatOpenAI(**LLMS[llm], temperature = 0)

def assistant(state: MessagesState, model_with_tools):
    reply = model_with_tools.invoke([SystemMessage(content=SYSTEM_PROMPT), *state["messages"]])
    return {"messages": [reply]}


def build_graph(model=None, tools=None):
    tools = TOOLS if tools is None else tools
    model = create_chat_model()

    model_with_tools = model.bind_tools(tools)
    assistant_node = assistant(MessagesState, model_with_tools)

    builder = StateGraph(MessagesState)
    
    # Connecting Assistant Node
    builder.add_node("assistant", assistant_node)

    # Connecting tools
    builder.add_node("tools", ToolNode(tools))

    # Edges - means connecting nodes for the flow

    builder.add_edge(START, assistant_node)
    builder.add_node("tools", ToolNode(tools))
    builder.add_edge