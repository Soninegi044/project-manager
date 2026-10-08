package com.projectmanager

import org.springframework.http.{HttpStatus, ResponseEntity}
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation._
import java.util.{HashMap => JHashMap, UUID}
import scala.jdk.CollectionConverters._

@RestController
@RequestMapping(Array("/api/projects"))
class ProjectController(projectService: ProjectService) {

  private def currentUserId(): UUID = {
    val principal = SecurityContextHolder.getContext.getAuthentication.getPrincipal.toString
    UUID.fromString(principal)
  }

  @GetMapping
  def list(): ResponseEntity[_] = {
    val projects = projectService.listByUser(currentUserId())
    ResponseEntity.ok(projects.map(toMap).asJava)
  }

  @PostMapping
  def create(@RequestBody body: JHashMap[String, String]): ResponseEntity[_] = {
    val name = Option(body.get("name")).getOrElse("")
    if (name.isEmpty) {
      return ResponseEntity.badRequest().body(error("Project name is required"))
    }
    val description = Option(body.get("description")).getOrElse("")
    val status = Option(body.get("status")).getOrElse("PLANNED")
    val project = projectService.create(currentUserId(), name, description, status)
    ResponseEntity.ok(toMap(project))
  }

  @GetMapping(Array("/{id}"))
  def getOne(@PathVariable id: String): ResponseEntity[_] = {
    projectService.findById(currentUserId(), UUID.fromString(id)) match {
      case Some(p) => ResponseEntity.ok(toMap(p))
      case None => ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Project not found"))
    }
  }

  @PutMapping(Array("/{id}"))
  def update(@PathVariable id: String, @RequestBody body: JHashMap[String, String]): ResponseEntity[_] = {
    val userId = currentUserId()
    projectService.findById(userId, UUID.fromString(id)) match {
      case Some(existing) =>
        val name = Option(body.get("name")).getOrElse(existing.name)
        val description = Option(body.get("description")).getOrElse(existing.description)
        val status = Option(body.get("status")).getOrElse(existing.status)
        val updated = projectService.update(userId, UUID.fromString(id), name, description, status)
        ResponseEntity.ok(toMap(updated.get))
      case None => ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Project not found"))
    }
  }

  @DeleteMapping(Array("/{id}"))
  def delete(@PathVariable id: String): ResponseEntity[_] = {
    if (projectService.delete(currentUserId(), UUID.fromString(id))) {
      ResponseEntity.noContent().build()
    } else {
      ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Project not found"))
    }
  }

  private def toMap(p: Project): JHashMap[String, String] = {
    val m = new JHashMap[String, String]()
    m.put("id", p.id.toString)
    m.put("name", p.name)
    m.put("description", p.description)
    m.put("status", p.status)
    m.put("user_id", p.userId.toString)
    m.put("created_at", p.createdAt.toString)
    m
  }

  private def error(msg: String): JHashMap[String, String] = {
    val m = new JHashMap[String, String]()
    m.put("detail", msg)
    m
  }
}