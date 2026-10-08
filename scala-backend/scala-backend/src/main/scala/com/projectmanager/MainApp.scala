package com.projectmanager

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.web.bind.annotation.{GetMapping, RestController}
import java.util.{HashMap => JHashMap}

@SpringBootApplication
class Application

object MainApp {
  def main(args: Array[String]): Unit = {
    SpringApplication.run(classOf[Application], args: _*)
  }
}

@RestController
class HealthController {
  @GetMapping(Array("/health"))
  def health(): JHashMap[String, String] = {
    val map = new JHashMap[String, String]()
    map.put("status", "ok")
    map.put("service", "scala-backend")
    map
  }
}