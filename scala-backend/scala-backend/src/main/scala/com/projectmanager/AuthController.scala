package com.projectmanager

import org.springframework.http.{HttpStatus, ResponseEntity}
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation._
import java.util.{HashMap => JHashMap, UUID}

@RestController
@RequestMapping(Array("/api"))
class AuthController(userService: UserService, jwtUtil: JwtUtil) {

  @PostMapping(Array("/register"))
  def register(@RequestBody body: JHashMap[String, String]): ResponseEntity[_] = {
    val name = body.get("name")
    val email = body.get("email")
    val password = body.get("password")

    if (name == null || email == null || password == null || password.length < 6) {
      return ResponseEntity.badRequest().body(error("Name, email, and password (min 6 chars) are required"))
    }

    userService.register(name, email, password) match {
      case Some(user) =>
        ResponseEntity.ok(userToMap(user))
      case None =>
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("Email already registered"))
    }
  }

  @PostMapping(Array("/login"))
  def login(@RequestBody body: JHashMap[String, String]): ResponseEntity[_] = {
    val email = body.get("email")
    val password = body.get("password")

    if (email == null || password == null) {
      return ResponseEntity.badRequest().body(error("Email and password required"))
    }

    userService.findByEmail(email) match {
      case Some(user) if userService.verifyPassword(password, user.password) =>
        val token = jwtUtil.generateToken(user.id.toString)
        val resp = new JHashMap[String, String]()
        resp.put("access_token", token)
        resp.put("token_type", "bearer")
        ResponseEntity.ok(resp)

      case _ =>
        ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Invalid email or password"))
    }
  }

  @GetMapping(Array("/me"))
  def me(): ResponseEntity[_] = {
    val userId = SecurityContextHolder.getContext.getAuthentication.getPrincipal.toString
    userService.findById(UUID.fromString(userId)) match {
      case Some(user) => ResponseEntity.ok(userToMap(user))
      case None => ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("User not found"))
    }
  }

  private def userToMap(user: User): JHashMap[String, String] = {
    val m = new JHashMap[String, String]()
    m.put("id", user.id.toString)
    m.put("name", user.name)
    m.put("email", user.email)
    m.put("created_at", user.createdAt.toString)
    m
  }

  private def error(msg: String): JHashMap[String, String] = {
    val m = new JHashMap[String, String]()
    m.put("detail", msg)
    m
  }
}