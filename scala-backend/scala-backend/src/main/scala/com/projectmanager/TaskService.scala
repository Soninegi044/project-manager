package com.projectmanager

import com.datastax.oss.driver.api.core.CqlSession
import com.datastax.oss.driver.api.core.cql.Row
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID
import scala.jdk.CollectionConverters._

@Service
class TaskService(session: CqlSession, projectService: ProjectService) {

  def create(userId: UUID, projectId: UUID, title: String, description: String,
             status: String, priority: String): Option[Task] = {
    projectService.findById(userId, projectId) match {
      case None => None
      case Some(_) =>
        val id = UUID.randomUUID()
        val now = Instant.now()

        val s1 = session.prepare(
          "INSERT INTO tasks_by_user (user_id, id, title, description, status, priority, project_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        session.execute(s1.bind(userId, id, title, description, status, priority, projectId, now))

        val s2 = session.prepare(
          "INSERT INTO tasks_by_project (project_id, id, user_id, title, description, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        session.execute(s2.bind(projectId, id, userId, title, description, status, priority, now))

        Some(Task(id, title, description, status, priority, projectId, userId, now))
    }
  }

  def listByUser(userId: UUID, projectId: Option[UUID]): List[Task] = {
    projectId match {
      case Some(pid) =>
        val stmt = session.prepare(
          "SELECT id, title, description, status, priority, project_id, user_id, created_at FROM tasks_by_project WHERE project_id = ?"
        )
        session.execute(stmt.bind(pid)).all().asScala
          .map(rowToTask).filter(_.userId == userId).toList
      case None =>
        val stmt = session.prepare(
          "SELECT id, title, description, status, priority, project_id, user_id, created_at FROM tasks_by_user WHERE user_id = ?"
        )
        session.execute(stmt.bind(userId)).all().asScala.map(rowToTask).toList
    }
  }

  def findById(userId: UUID, taskId: UUID): Option[Task] = {
    val stmt = session.prepare(
      "SELECT id, title, description, status, priority, project_id, user_id, created_at FROM tasks_by_user WHERE user_id = ? AND id = ?"
    )
    Option(session.execute(stmt.bind(userId, taskId)).one()).map(rowToTask)
  }

  def update(userId: UUID, taskId: UUID, title: String, description: String,
             status: String, priority: String): Option[Task] = {
    findById(userId, taskId).map { existing =>
      val s1 = session.prepare(
        "INSERT INTO tasks_by_user (user_id, id, title, description, status, priority, project_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      session.execute(s1.bind(userId, taskId, title, description, status, priority, existing.projectId, existing.createdAt))

      val s2 = session.prepare(
        "INSERT INTO tasks_by_project (project_id, id, user_id, title, description, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      session.execute(s2.bind(existing.projectId, taskId, userId, title, description, status, priority, existing.createdAt))

      existing.copy(title = title, description = description, status = status, priority = priority)
    }
  }

  def delete(userId: UUID, taskId: UUID): Boolean = {
    findById(userId, taskId) match {
      case Some(task) =>
        val s1 = session.prepare("DELETE FROM tasks_by_user WHERE user_id = ? AND id = ?")
        session.execute(s1.bind(userId, taskId))

        val s2 = session.prepare("DELETE FROM tasks_by_project WHERE project_id = ? AND id = ?")
        session.execute(s2.bind(task.projectId, taskId))
        true
      case None => false
    }
  }

  def countStats(userId: UUID): (Int, Int) = {
    val stmt = session.prepare(
      "SELECT status FROM tasks_by_user WHERE user_id = ?"
    )
    val rows = session.execute(stmt.bind(userId)).all().asScala.toList
    val total = rows.size
    val completed = rows.count(r => r.getString("status") == "COMPLETED")
    (total, completed)
  }

  private def rowToTask(row: Row): Task = {
    Task(
      row.getUuid("id"),
      row.getString("title"),
      row.getString("description"),
      row.getString("status"),
      row.getString("priority"),
      row.getUuid("project_id"),
      row.getUuid("user_id"),
      row.getInstant("created_at")
    )
  }
}