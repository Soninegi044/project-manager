package com.projectmanager

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtUtil {

  private val SECRET_KEY = "change-this-to-a-long-random-string-please-32chars"
  private val key: SecretKey = Keys.hmacShaKeyFor(SECRET_KEY.getBytes("UTF-8"))
  private val EXPIRY_MS: Long = 24L * 60 * 60 * 1000

  def generateToken(userId: String): String = {
    val now = System.currentTimeMillis()
    Jwts.builder()
      .subject(userId)
      .issuedAt(new Date(now))
      .expiration(new Date(now + EXPIRY_MS))
      .signWith(key)
      .compact()
  }

  // NEW method — token se user_id nikalta hai
  def extractUserId(token: String): Option[String] = {
    try {
      val claims = Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload
      Option(claims.getSubject)
    } catch {
      case _: Exception => None
    }
  }
}