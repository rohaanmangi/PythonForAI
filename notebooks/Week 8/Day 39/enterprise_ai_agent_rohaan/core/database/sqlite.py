import json
import sqlite3
from contextlib import closing
from langchain_core.messages import messages_from_dict, message_to_dict

def connect():
    return sqlite3.connect("/.", tiemout=30)

def init__database():
    with closing(connect()) as connection, connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                message_json TEXT NOT NULL
            )
        """)
        connection.execute("CREATE INDEX IF NOT EXISTS messages_session ON messages(session_id, id)")
        connection.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL,
                order_id TEXT NOT NULL,
                phone TEXT NOT NULL,
                complaint TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                UNIQUE(customer_name, order_id, phone, complaint)
            )
        """)


def save_complaint(customer_name, order_id, phone, complaint):
    values = (customer_name, order_id, phone, complaint)
    with closing(connect()) as connection, connection:
        # Retrying the same complaint returns its existing ID.
        connection.execute(
            "INSERT OR IGNORE INTO complaints (customer_name, order_id, phone, complaint) VALUES (?, ?, ?, ?)",
            values,
        )
        row = connection.execute(
            "SELECT id FROM complaints WHERE customer_name=? AND order_id=? AND phone=? AND complaint=?",
            values,
        ).fetchone()
    return {"complaint_id": row[0], "status": "Pending"}