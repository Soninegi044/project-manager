import os
os.environ.setdefault("CASSANDRA_DRIVER_EVENT_LOOP","gevent")
"""FastAPI app with local Cassandra backend."""
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from cassandra.cluster import Session

from database import get_session
from schemas import (
    UserCreate, UserLogin, UserRead, Token,
    ProjectCreate, ProjectUpdate, ProjectRead,
    TaskCreate, TaskUpdate, TaskRead,
    DashboardStats,
)
from auth import hash_password, verify_password, create_access_token, get_current_user
import services

app = FastAPI(title="Project Manager API (Cassandra)", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


# ---------------- Authentication ----------------
@app.post("/api/register", response_model=UserRead, tags=["Authentication"])
def register(data: UserCreate, session: Session = Depends(get_session)):
    existing = session.execute(
        "SELECT email FROM users_by_email WHERE email = %s", (data.email,)
    ).one()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = uuid4()
    now = datetime.now(timezone.utc)
    hashed = hash_password(data.password)

    session.execute(
        "INSERT INTO users_by_email (email, id, name, password, created_at) "
        "VALUES (%s, %s, %s, %s, %s)",
        (data.email, user_id, data.name, hashed, now),
    )
    session.execute(
        "INSERT INTO users_by_id (id, email, name, password, created_at) "
        "VALUES (%s, %s, %s, %s, %s)",
        (user_id, data.email, data.name, hashed, now),
    )

    return {
        "id": str(user_id),
        "name": data.name,
        "email": data.email,
        "created_at": now,
    }


@app.post("/api/login", response_model=Token, tags=["Authentication"])
def login(data: UserLogin, session: Session = Depends(get_session)):
    row = session.execute(
        "SELECT id, email, name, password, created_at FROM users_by_email WHERE email = %s",
        (data.email,),
    ).one()

    if row is None or not verify_password(data.password, row.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(str(row.id))
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/me", response_model=UserRead, tags=["Authentication"])
def me(current: dict = Depends(get_current_user)):
    return current


# ---------------- Projects ----------------
@app.get("/api/projects", response_model=list[ProjectRead], tags=["Projects"])
def list_projects(
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    return services.get_projects(session, current)


@app.post("/api/projects", response_model=ProjectRead, tags=["Projects"])
def create_project(
    data: ProjectCreate,
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    return services.create_project(session, current, data)


@app.get("/api/projects/{project_id}", response_model=ProjectRead, tags=["Projects"])
def get_project(
    project_id: str,
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    project = services.get_project(session, current, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.put("/api/projects/{project_id}", response_model=ProjectRead, tags=["Projects"])
def update_project(
    project_id: str,
    data: ProjectUpdate,
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    project = services.update_project(session, current, project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.delete("/api/projects/{project_id}", status_code=204, tags=["Projects"])
def delete_project(
    project_id: str,
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    ok = services.delete_project(session, current, project_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Project not found")
    return None


# ---------------- Tasks ----------------
@app.get("/api/tasks", response_model=list[TaskRead], tags=["Tasks"])
def list_tasks(
    project_id: str | None = Query(default=None),
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    return services.get_tasks(session, current, project_id)


@app.post("/api/tasks", response_model=TaskRead, tags=["Tasks"])
def create_task(
    data: TaskCreate,
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    task = services.create_task(session, current, data)
    if not task:
        raise HTTPException(status_code=404, detail="Project not found")
    return task


@app.get("/api/tasks/{task_id}", response_model=TaskRead, tags=["Tasks"])
def get_task(
    task_id: str,
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    task = services.get_task(session, current, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.put("/api/tasks/{task_id}", response_model=TaskRead, tags=["Tasks"])
def update_task(
    task_id: str,
    data: TaskUpdate,
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    task = services.update_task(session, current, task_id, data)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.delete("/api/tasks/{task_id}", status_code=204, tags=["Tasks"])
def delete_task(
    task_id: str,
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    ok = services.delete_task(session, current, task_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Task not found")
    return None


# ---------------- Dashboard ----------------
@app.get("/api/dashboard", response_model=DashboardStats, tags=["Dashboard"])
def dashboard(
    session: Session = Depends(get_session),
    current: dict = Depends(get_current_user),
):
    return services.get_dashboard_stats(session, current)
