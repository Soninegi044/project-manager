package com.projectmanager

import com.datastax.oss.driver.api.core.CqlSession
import com.datastax.oss.driver.api.core.cql.Row
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

@Service
class UserService(session: CqlSession) {

  private val passwordEncoder = new BCryptPasswordEncoder()

  def register(name: String, email: String, password: String): Option[User] = {
    val check = session.prepare("SELECT id FROM users_by_email WHERE email = ?")
    val existing = session.execute(check.bind(email)).one()
    if (existing != null) return None

    val id = UUID.randomUUID()
    val hashed = passwordEncoder.encode(password)
    val now = Instant.now()

    val insertEmail = session.prepare(
      "INSERT INTO users_by_email (email, id, name, password, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    session.execute(insertEmail.bind(email, id, name, hashed, now))

    val insertId = session.prepare(
      "INSERT INTO users_by_id (id, email, name, password, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    session.execute(insertId.bind(id, email, name, hashed, now))

    Some(User(id, name, email, hashed, now))
  }

  def findByEmail(email: String): Option[User] = {
    val stmt = session.prepare(
      "SELECT id, name, email, password, created_at FROM users_by_email WHERE email = ?"
    )
    Option(session.execute(stmt.bind(email)).one()).map(rowToUser)
  }

  def findById(id: UUID): Option[User] = {
    val stmt = session.prepare(
      "SELECT id, name, email, password, created_at FROM users_by_id WHERE id = ?"
    )
    Option(session.execute(stmt.bind(id)).one()).map(rowToUser)
  }

  def verifyPassword(plain: String, hashed: String): Boolean = {
    passwordEncoder.matches(plain, hashed)
  }

  private def rowToUser(row: Row): User = {
    User(
      row.getUuid("id"),
      row.getString("name"),
      row.getString("email"),
      row.getString("password"),
      row.getInstant("created_at")
    )
  }
}