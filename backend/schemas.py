#Pydantic schemas for request/response validation.
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Project ----------
ProjectStatus = Literal["PLANNED", "IN_PROGRESS", "COMPLETED"]


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str = ""
    status: ProjectStatus = "PLANNED"


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    status: str
    user_id: int
    created_at: datetime
    task_count: int = 0

    class Config:
        from_attributes = True


# ---------- Task ----------
TaskStatus = Literal["TODO", "IN_PROGRESS", "COMPLETED"]
TaskPriority = Literal["LOW", "MEDIUM", "HIGH"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    status: TaskStatus = "TODO"
    priority: TaskPriority = "MEDIUM"
    project_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    project_id: int
    project_name: Optional[str] = None
    user_id: int
    created_at: datetime


# ---------- Dashboard ----------
class DashboardResponse(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int