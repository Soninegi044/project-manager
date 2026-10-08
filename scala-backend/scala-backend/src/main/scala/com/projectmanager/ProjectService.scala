
package com.projectmanager

import com.datastax.oss.driver.api.core.CqlSession
import com.datastax.oss.driver.api.core.cql.Row
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID
import scala.jdk.CollectionConverters._

@Service
class ProjectService(session: CqlSession) {

  def create(userId: UUID, name: String, description: String, status: String): Project = {
    val id = UUID.randomUUID()
    val now = Instant.now()
    val stmt = session.prepare(
      "INSERT INTO projects_by_user (user_id, id, name, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    session.execute(stmt.bind(userId, id, name, description, status, now))
    Project(id, name, description, status, userId, now)
  }

  def listByUser(userId: UUID): List[Project] = {
    val stmt = session.prepare(
      "SELECT id, name, description, status, user_id, created_at FROM projects_by_user WHERE user_id = ?"
    )
    session.execute(stmt.bind(userId)).all().asScala.map(rowToProject).toList
  }

  def findById(userId: UUID, projectId: UUID): Option[Project] = {
    val stmt = session.prepare(
      "SELECT id, name, description, status, user_id, created_at FROM projects_by_user WHERE user_id = ? AND id = ?"
    )
    Option(session.execute(stmt.bind(userId, projectId)).one()).map(rowToProject)
  }

  def update(userId: UUID, projectId: UUID, name: String, description: String, status: String): Option[Project] = {
    findById(userId, projectId).map { existing =>
      val stmt = session.prepare(
        "INSERT INTO projects_by_user (user_id, id, name, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      session.execute(stmt.bind(userId, projectId, name, description, status, existing.createdAt))
      existing.copy(name = name, description = description, status = status)
    }
  }

  def delete(userId: UUID, projectId: UUID): Boolean = {
    findById(userId, projectId) match {
      case Some(_) =>
        // Pehle tasks delete karo
        val getTasks = session.prepare("SELECT id FROM tasks_by_project WHERE project_id = ?")
        val delTaskByProject = session.prepare("DELETE FROM tasks_by_project WHERE project_id = ? AND id = ?")
        val delTaskByUser = session.prepare("DELETE FROM tasks_by_user WHERE user_id = ? AND id = ?")

        session.execute(getTasks.bind(projectId)).all().asScala.foreach { row =>
          val taskId = row.getUuid("id")
          session.execute(delTaskByProject.bind(projectId, taskId))
          session.execute(delTaskByUser.bind(userId, taskId))
        }

        // Project delete karo
        val delProject = session.prepare("DELETE FROM projects_by_user WHERE user_id = ? AND id = ?")
        session.execute(delProject.bind(userId, projectId))
        true

      case None => false
    }
  }

  private def rowToProject(row: Row): Project = {
    Project(
      row.getUuid("id"),
      row.getString("name"),
      row.getString("description"),
      row.getString("status"),
      row.getUuid("user_id"),
      row.getInstant("created_at")
    )
  }
}