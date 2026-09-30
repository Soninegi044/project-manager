# Project & Task Manager

A beginner-friendly full-stack mobile app to manage projects and tasks.

## Features
- User registration and login with JWT
- Create, edit, delete projects
- Create, complete, delete tasks
- Dashboard with live statistics
- User profile with logout

## Tech Stack

**Backend**: Python, FastAPI, SQLModel, SQLite, JWT
**Mobile**: React Native, Expo, React Navigation

## Project Structure

backend/    -> FastAPI server
mobile/     -> React Native app

## How to Run

### Backend
    cd backend
    python -m venv venv
    venv\Scripts\activate
    pip install -r requirements.txt
    cp .env.example .env
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

Backend: http://127.0.0.1:8000
Swagger: http://127.0.0.1:8000/docs

### Mobile
    cd mobile
    npm install
    npx expo start --clear

Update mobile/src/services/api.js with your PC LAN IP.

## API Endpoints

- POST /api/register
- POST /api/login
- GET  /api/me
- GET/POST/PUT/DELETE /api/projects
- GET/POST/PUT/DELETE /api/tasks
- GET  /api/dashboard

## Authentication

1. Register -> password hashed with bcrypt
2. Login -> returns JWT token
3. Mobile stores token in AsyncStorage
4. Every request sends Authorization: Bearer <token>
5. Backend decodes token and identifies user
