package com.projectmanager

import org.springframework.http.{HttpStatus, ResponseEntity}
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation._
import java.util.{HashMap => JHashMap, UUID}
import scala.jdk.CollectionConverters._

@RestController
@RequestMapping(Array("/api/tasks"))
class TaskController(taskService: TaskService) {

  private def currentUserId(): UUID = {
    val principal = SecurityContextHolder.getContext.getAuthentication.getPrincipal.toString
    UUID.fromString(principal)
  }

  @GetMapping
  def list(@RequestParam(value = "project_id", required = false) projectId: String): ResponseEntity[_] = {
    val pid = Option(projectId).map(UUID.fromString)
    val tasks = taskService.listByUser(currentUserId(), pid)
    ResponseEntity.ok(tasks.map(toMap).asJava)
  }

  @PostMapping
  def create(@RequestBody body: JHashMap[String, String]): ResponseEntity[_] = {
    val title = Option(body.get("title")).getOrElse("")
    if (title.isEmpty) {
      return ResponseEntity.badRequest().body(error("Task title is required"))
    }
    val projectIdStr = Option(body.get("project_id")).getOrElse("")
    if (projectIdStr.isEmpty) {
      return ResponseEntity.badRequest().body(error("project_id is required"))
    }

    val description = Option(body.get("description")).getOrElse("")
    val status = Option(body.get("status")).getOrElse("TODO")
    val priority = Option(body.get("priority")).getOrElse("MEDIUM")

    taskService.create(currentUserId(), UUID.fromString(projectIdStr), title, description, status, priority) match {
      case Some(t) => ResponseEntity.ok(toMap(t))
      case None => ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Project not found"))
    }
  }

  @GetMapping(Array("/{id}"))
  def getOne(@PathVariable id: String): ResponseEntity[_] = {
    taskService.findById(currentUserId(), UUID.fromString(id)) match {
      case Some(t) => ResponseEntity.ok(toMap(t))
      case None => ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Task not found"))
    }
  }

  @PutMapping(Array("/{id}"))
  def update(@PathVariable id: String, @RequestBody body: JHashMap[String, String]): ResponseEntity[_] = {
    val userId = currentUserId()
    val taskId = UUID.fromString(id)
    taskService.findById(userId, taskId) match {
      case Some(existing) =>
        val title = Option(body.get("title")).getOrElse(existing.title)
        val description = Option(body.get("description")).getOrElse(existing.description)
        val status = Option(body.get("status")).getOrElse(existing.status)
        val priority = Option(body.get("priority")).getOrElse(existing.priority)
        taskService.update(userId, taskId, title, description, status, priority) match {
          case Some(t) => ResponseEntity.ok(toMap(t))
          case None => ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Task not found"))
        }
      case None => ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Task not found"))
    }
  }

  @DeleteMapping(Array("/{id}"))
  def delete(@PathVariable id: String): ResponseEntity[_] = {
    if (taskService.delete(currentUserId(), UUID.fromString(id))) {
      ResponseEntity.noContent().build()
    } else {
      ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("Task not found"))
    }
  }

  private def toMap(t: Task): JHashMap[String, String] = {
    val m = new JHashMap[String, String]()
    m.put("id", t.id.toString)
    m.put("title", t.title)
    m.put("description", t.description)
    m.put("status", t.status)
    m.put("priority", t.priority)
    m.put("project_id", t.projectId.toString)
    m.put("user_id", t.userId.toString)
    m.put("created_at", t.createdAt.toString)
    m
  }

  private def error(msg: String): JHashMap[String, String] = {
    val m = new JHashMap[String, String]()
    m.put("detail", msg)
    m
  }
}