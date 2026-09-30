"""FastAPI application entry point."""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from typing import Optional

from database import create_db_and_tables, get_session
from models import User
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    TaskCreate, TaskUpdate, TaskResponse,
    DashboardResponse,
)
from auth import (
    hash_password, verify_password, create_access_token, get_current_user,
)
from services import (
    get_user_by_email, create_user,
    create_project, get_projects, get_project, update_project, delete_project,
    create_task, get_tasks, get_task, update_task, delete_task,
    get_dashboard,
)

app = FastAPI(title="Project Manager API", version="1.0.0")

# Allow the mobile app to call the API from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


# ---------------- Authentication ----------------
@app.post("/api/register", response_model=UserResponse, tags=["Authentication"])
def register(data: UserCreate, session: Session = Depends(get_session)):
    if get_user_by_email(session, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(data.password)
    user = create_user(session, data.name, data.email, hashed)
    return user


@app.post("/api/login", response_model=Token, tags=["Authentication"])
def login(data: UserLogin, session: Session = Depends(get_session)):
    user = get_user_by_email(session, data.email)
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user.id)
    return Token(access_token=token)


@app.get("/api/me", response_model=UserResponse, tags=["Authentication"])
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------------- Projects ----------------
@app.get("/api/projects", response_model=list[ProjectResponse], tags=["Projects"])
def list_projects(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return get_projects(session, current_user)


@app.post("/api/projects", response_model=ProjectResponse, tags=["Projects"])
def add_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    project = create_project(session, current_user, data)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "user_id": project.user_id,
        "created_at": project.created_at,
        "task_count": 0,
    }


@app.get("/api/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def get_one_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    project = get_project(session, current_user, project_id)
    tasks = get_tasks(session, current_user, project_id=project_id)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "user_id": project.user_id,
        "created_at": project.created_at,
        "task_count": len(tasks),
    }


@app.put("/api/projects/{project_id}", response_model=ProjectResponse, tags=["Projects"])
def edit_project(
    project_id: int,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    project = update_project(session, current_user, project_id, data)
    tasks = get_tasks(session, current_user, project_id=project_id)
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "status": project.status,
        "user_id": project.user_id,
        "created_at": project.created_at,
        "task_count": len(tasks),
    }


@app.delete("/api/projects/{project_id}", tags=["Projects"])
def remove_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    delete_project(session, current_user, project_id)
    return {"message": "Project deleted"}


# ---------------- Tasks ----------------
@app.get("/api/tasks", response_model=list[TaskResponse], tags=["Tasks"])
def list_tasks(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return get_tasks(session, current_user, project_id=project_id)


@app.post("/api/tasks", response_model=TaskResponse, tags=["Tasks"])
def add_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    task = create_task(session, current_user, data)
    project = get_project(session, current_user, task.project_id)
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "project_id": task.project_id,
        "project_name": project.name,
        "user_id": task.user_id,
        "created_at": task.created_at,
    }


@app.get("/api/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def get_one_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    task = get_task(session, current_user, task_id)
    project = get_project(session, current_user, task.project_id)
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "project_id": task.project_id,
        "project_name": project.name,
        "user_id": task.user_id,
        "created_at": task.created_at,
    }


@app.put("/api/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def edit_task(
    task_id: int,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    task = update_task(session, current_user, task_id, data)
    project = get_project(session, current_user, task.project_id)
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "project_id": task.project_id,
        "project_name": project.name,
        "user_id": task.user_id,
        "created_at": task.created_at,
    }


@app.delete("/api/tasks/{task_id}", tags=["Tasks"])
def remove_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    delete_task(session, current_user, task_id)
    return {"message": "Task deleted"}


# ---------------- Dashboard ----------------
@app.get("/api/dashboard", response_model=DashboardResponse, tags=["Dashboard"])
def dashboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return get_dashboard(session, current_user)