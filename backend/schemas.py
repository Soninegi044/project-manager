"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Project ----------
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str = ""
    status: str = "PLANNED"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectRead(BaseModel):
    id: str
    name: str
    description: str
    status: str
    user_id: str
    created_at: datetime


# ---------- Task ----------
class TaskCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str = ""
    status: str = "TODO"
    priority: str = "MEDIUM"
    project_id: str


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None


class TaskRead(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    project_id: str
    user_id: str
    created_at: datetime


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int