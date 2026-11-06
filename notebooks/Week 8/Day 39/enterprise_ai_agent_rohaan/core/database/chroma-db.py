import chromadb


COLLECTION_NAME = "restaurant_vector_db"
chroma_client = chromadb.PersistentClient(path="./restaurant_vector_db")

collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)