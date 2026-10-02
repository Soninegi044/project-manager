"""Local Cassandra connection and session management."""
import os
from cassandra.cluster import Cluster
from dotenv import load_dotenv

load_dotenv()

CASSANDRA_HOST = os.getenv("CASSANDRA_HOST", "127.0.0.1")
CASSANDRA_PORT = int(os.getenv("CASSANDRA_PORT", "9042"))
KEYSPACE = os.getenv("CASSANDRA_KEYSPACE", "project_manager")

_session = None


def get_session():
    """Return a singleton Cassandra session."""
    global _session
    if _session is None:
        cluster = Cluster([CASSANDRA_HOST], port=CASSANDRA_PORT)
        _session = cluster.connect(KEYSPACE)
    return _session