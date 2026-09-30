"""Business logic for projects and tasks."""
from typing import Optional, List
from fastapi import HTTPException
from sqlmodel import Session, select, func

from models import User, Project, Task
from schemas import ProjectCreate, ProjectUpdate, TaskCreate, TaskUpdate


# ---------- Users ----------
def get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).first()


def create_user(session: Session, name: str, email: str, hashed_password: str) -> User:
    user = User(name=name, email=email, password=hashed_password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ---------- Projects ----------
def create_project(session: Session, user: User, data: ProjectCreate) -> Project:
    project = Project(
        name=data.name,
        description=data.description,
        status=data.status,
        user_id=user.id,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def get_projects(session: Session, user: User) -> List[dict]:
    projects = session.exec(
        select(Project).where(Project.user_id == user.id).order_by(Project.created_at.desc())
    ).all()

    result = []
    for p in projects:
        count = session.exec(
            select(func.count(Task.id)).where(Task.project_id == p.id)
        ).one()
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "user_id": p.user_id,
            "created_at": p.created_at,
            "task_count": count,
        })
    return result


def get_project(session: Session, user: User, project_id: int) -> Project:
    project = session.get(Project, project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def update_project(session: Session, user: User, project_id: int, data: ProjectUpdate) -> Project:
    project = get_project(session, user, project_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def delete_project(session: Session, user: User, project_id: int) -> None:
    project = get_project(session, user, project_id)
    session.delete(project)
    session.commit()


# ---------- Tasks ----------
def create_task(session: Session, user: User, data: TaskCreate) -> Task:
    project = session.get(Project, data.project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status_code=404, detail="Project not found")

    task = Task(
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        project_id=data.project_id,
        user_id=user.id,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def get_tasks(session: Session, user: User, project_id: Optional[int] = None) -> List[dict]:
    query = select(Task).where(Task.user_id == user.id)
    if project_id is not None:
        query = query.where(Task.project_id == project_id)
    tasks = session.exec(query.order_by(Task.created_at.desc())).all()

    result = []
    for t in tasks:
        project = session.get(Project, t.project_id)
        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "project_id": t.project_id,
            "project_name": project.name if project else None,
            "user_id": t.user_id,
            "created_at": t.created_at,
        })
    return result


def get_task(session: Session, user: User, task_id: int) -> Task:
    task = session.get(Task, task_id)
    if not task or task.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def update_task(session: Session, user: User, task_id: int, data: TaskUpdate) -> Task:
    task = get_task(session, user, task_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def delete_task(session: Session, user: User, task_id: int) -> None:
    task = get_task(session, user, task_id)
    session.delete(task)
    session.commit()


# ---------- Dashboard ----------
def get_dashboard(session: Session, user: User) -> dict:
    total_projects = session.exec(
        select(func.count(Project.id)).where(Project.user_id == user.id)
    ).one()

    total_tasks = session.exec(
        select(func.count(Task.id)).where(Task.user_id == user.id)
    ).one()

    completed_tasks = session.exec(
        select(func.count(Task.id)).where(
            Task.user_id == user.id, Task.status == "COMPLETED"
        )
    ).one()

    pending_tasks = total_tasks - completed_tasks

    return {
        "total_projects": total_projects,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
    }