"""Constants and helpers. Cassandra me SQLModel nahi chalta."""
from datetime import datetime, timezone

PROJECT_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED"]
TASK_STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"]
TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"]


def now_utc():
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)