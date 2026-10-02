"""Business logic for projects, tasks, and dashboard using Cassandra."""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from cassandra.cluster import Session

from schemas import ProjectCreate, ProjectUpdate, TaskCreate, TaskUpdate


def _now():
    return datetime.now(timezone.utc)


# ---------- Projects ----------
def create_project(session: Session, user: dict, data: ProjectCreate):
    project_id = uuid4()
    now = _now()
    user_id = UUID(user["id"])

    session.execute(
        """
        INSERT INTO projects_by_user (user_id, id, name, description, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (user_id, project_id, data.name, data.description, data.status, now),
    )

    return {
        "id": str(project_id),
        "user_id": str(user_id),
        "name": data.name,
        "description": data.description,
        "status": data.status,
        "created_at": now,
    }


def get_projects(session: Session, user: dict):
    user_id = UUID(user["id"])
    rows = session.execute(
        "SELECT id, user_id, name, description, status, created_at "
        "FROM projects_by_user WHERE user_id = %s",
        (user_id,),
    )
    return [
        {
            "id": str(r.id),
            "user_id": str(r.user_id),
            "name": r.name,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in rows
    ]


def get_project(session: Session, user: dict, project_id: str):
    try:
        pid = UUID(project_id)
    except (ValueError, AttributeError):
        return None
    user_id = UUID(user["id"])

    row = session.execute(
        "SELECT id, user_id, name, description, status, created_at "
        "FROM projects_by_user WHERE user_id = %s AND id = %s",
        (user_id, pid),
    ).one()

    if row is None:
        return None
    return {
        "id": str(row.id),
        "user_id": str(row.user_id),
        "name": row.name,
        "description": row.description,
        "status": row.status,
        "created_at": row.created_at,
    }


def update_project(session: Session, user: dict, project_id: str, data: ProjectUpdate):
    existing = get_project(session, user, project_id)
    if not existing:
        return None

    name = data.name if data.name is not None else existing["name"]
    description = data.description if data.description is not None else existing["description"]
    status = data.status if data.status is not None else existing["status"]

    user_id = UUID(user["id"])
    pid = UUID(project_id)

    session.execute(
        """
        INSERT INTO projects_by_user (user_id, id, name, description, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (user_id, pid, name, description, status, existing["created_at"]),
    )

    existing["name"] = name
    existing["description"] = description
    existing["status"] = status
    return existing


def delete_project(session: Session, user: dict, project_id: str) -> bool:
    existing = get_project(session, user, project_id)
    if not existing:
        return False

    user_id = UUID(user["id"])
    pid = UUID(project_id)

    tasks = session.execute(
        "SELECT id FROM tasks_by_project WHERE project_id = %s",
        (pid,),
    )
    for t in tasks:
        session.execute(
            "DELETE FROM tasks_by_user WHERE user_id = %s AND id = %s",
            (user_id, t.id),
        )
        session.execute(
            "DELETE FROM tasks_by_project WHERE project_id = %s AND id = %s",
            (pid, t.id),
        )

    session.execute(
        "DELETE FROM projects_by_user WHERE user_id = %s AND id = %s",
        (user_id, pid),
    )
    return True


# ---------- Tasks ----------
def create_task(session: Session, user: dict, data: TaskCreate):
    try:
        project_id = UUID(data.project_id)
    except (ValueError, AttributeError):
        return None

    project = get_project(session, user, data.project_id)
    if not project:
        return None

    user_id = UUID(user["id"])
    task_id = uuid4()
    now = _now()

    session.execute(
        """
        INSERT INTO tasks_by_user
        (user_id, id, title, description, status, priority, project_id, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (user_id, task_id, data.title, data.description, data.status,
         data.priority, project_id, now),
    )
    session.execute(
        """
        INSERT INTO tasks_by_project
        (project_id, id, user_id, title, description, status, priority, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (project_id, task_id, user_id, data.title, data.description,
         data.status, data.priority, now),
    )

    return {
        "id": str(task_id),
        "user_id": str(user_id),
        "title": data.title,
        "description": data.description,
        "status": data.status,
        "priority": data.priority,
        "project_id": str(project_id),
        "created_at": now,
    }


def get_tasks(session: Session, user: dict, project_id: Optional[str] = None):
    user_id = UUID(user["id"])

    if project_id:
        try:
            pid = UUID(project_id)
        except (ValueError, AttributeError):
            return []
        rows = session.execute(
            "SELECT id, user_id, title, description, status, priority, project_id, created_at "
            "FROM tasks_by_project WHERE project_id = %s",
            (pid,),
        )
    else:
        rows = session.execute(
            "SELECT id, user_id, title, description, status, priority, project_id, created_at "
            "FROM tasks_by_user WHERE user_id = %s",
            (user_id,),
        )

    return [
        {
            "id": str(r.id),
            "user_id": str(r.user_id),
            "title": r.title,
            "description": r.description,
            "status": r.status,
            "priority": r.priority,
            "project_id": str(r.project_id),
            "created_at": r.created_at,
        }
        for r in rows
    ]


def get_task(session: Session, user: dict, task_id: str):
    try:
        tid = UUID(task_id)
    except (ValueError, AttributeError):
        return None

    user_id = UUID(user["id"])
    row = session.execute(
        "SELECT id, user_id, title, description, status, priority, project_id, created_at "
        "FROM tasks_by_user WHERE user_id = %s AND id = %s",
        (user_id, tid),
    ).one()

    if row is None:
        return None
    return {
        "id": str(row.id),
        "user_id": str(row.user_id),
        "title": row.title,
        "description": row.description,
        "status": row.status,
        "priority": row.priority,
        "project_id": str(row.project_id),
        "created_at": row.created_at,
    }


def update_task(session: Session, user: dict, task_id: str, data: TaskUpdate):
    existing = get_task(session, user, task_id)
    if not existing:
        return None

    title = data.title if data.title is not None else existing["title"]
    description = data.description if data.description is not None else existing["description"]
    status = data.status if data.status is not None else existing["status"]
    priority = data.priority if data.priority is not None else existing["priority"]

    user_id = UUID(user["id"])
    tid = UUID(task_id)
    project_id = UUID(existing["project_id"])

    session.execute(
        """
        INSERT INTO tasks_by_user
        (user_id, id, title, description, status, priority, project_id, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (user_id, tid, title, description, status, priority, project_id, existing["created_at"]),
    )
    session.execute(
        """
        INSERT INTO tasks_by_project
        (project_id, id, user_id, title, description, status, priority, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (project_id, tid, user_id, title, description, status, priority, existing["created_at"]),
    )

    existing["title"] = title
    existing["description"] = description
    existing["status"] = status
    existing["priority"] = priority
    return existing


def delete_task(session: Session, user: dict, task_id: str) -> bool:
    existing = get_task(session, user, task_id)
    if not existing:
        return False

    user_id = UUID(user["id"])
    tid = UUID(task_id)
    project_id = UUID(existing["project_id"])

    session.execute(
        "DELETE FROM tasks_by_user WHERE user_id = %s AND id = %s",
        (user_id, tid),
    )
    session.execute(
        "DELETE FROM tasks_by_project WHERE project_id = %s AND id = %s",
        (project_id, tid),
    )
    return True


# ---------- Dashboard ----------
def get_dashboard_stats(session: Session, user: dict):
    user_id = UUID(user["id"])

    projects = list(session.execute(
        "SELECT id FROM projects_by_user WHERE user_id = %s",
        (user_id,),
    ))
    total_projects = len(projects)

    tasks = list(session.execute(
        "SELECT status FROM tasks_by_user WHERE user_id = %s",
        (user_id,),
    ))
    total_tasks = len(tasks)
    completed = sum(1 for t in tasks if t.status == "COMPLETED")

    return {
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "completed_tasks": completed,
        "pending_tasks": total_tasks - completed,
    }
