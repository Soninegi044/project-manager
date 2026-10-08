# Project Manager — Scala + Spring Boot

Full-stack mobile app with **Scala + Spring Boot** backend and **Cassandra** database.

## Tech Stack
- Backend: Scala 2.13.18, Spring Boot 3.3.5, Cassandra 3.11
- Mobile: React Native + Expo
- Auth: JWT + BCrypt

## How to Run

### 1. Cassandra
cd C:\cassandra\bin
.\cassandra.bat -f

### 2. Scala Backend
cd scala-backend/scala-backend
sbt assembly
java -jar target/scala-2.13/scala-backend.jar

Backend: http://localhost:8081

### 3. Mobile App
cd mobile
npm install
$env:REACT_NATIVE_PACKAGER_HOSTNAME="<http://192.168.0.101:8081>"
npx expo start --lan

## API Endpoints
- POST /api/register
- POST /api/login
- GET  /api/me
- GET/POST/PUT/DELETE /api/projects
- GET/POST/PUT/DELETE /api/tasks
- GET  /api/dashboard

## Architecture
React Native → Spring Boot (Scala) → Cassandra