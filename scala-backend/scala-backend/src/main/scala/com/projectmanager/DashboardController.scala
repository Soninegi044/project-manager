package com.projectmanager

import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation._
import java.util.{HashMap => JHashMap, UUID}

@RestController
@RequestMapping(Array("/api"))
class DashboardController(projectService: ProjectService, taskService: TaskService) {

  private def currentUserId(): UUID = {
    val principal = SecurityContextHolder.getContext.getAuthentication.getPrincipal.toString
    UUID.fromString(principal)
  }

  @GetMapping(Array("/dashboard"))
  def dashboard(): ResponseEntity[_] = {
    val userId = currentUserId()
    val projects = projectService.listByUser(userId)
    val (totalTasks, completedTasks) = taskService.countStats(userId)

    val m = new JHashMap[String, String]()
    m.put("total_projects", projects.size.toString)
    m.put("total_tasks", totalTasks.toString)
    m.put("completed_tasks", completedTasks.toString)
    m.put("pending_tasks", (totalTasks - completedTasks).toString)
    ResponseEntity.ok(m)
  }
}