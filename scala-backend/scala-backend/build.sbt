ThisBuild / version := "0.1.0-SNAPSHOT"
ThisBuild / scalaVersion := "2.13.18"
ThisBuild / fork := true

lazy val root = (project in file("."))
  .settings(
    name := "scala-backend",

    libraryDependencies ++= Seq(
      "org.springframework.boot" % "spring-boot-starter-web" % "3.3.5",
      "org.springframework.boot" % "spring-boot-starter-security" % "3.3.5",
      "org.springframework.boot" % "spring-boot-starter-validation" % "3.3.5",
      "com.datastax.oss" % "java-driver-core" % "4.17.0",
      "io.jsonwebtoken" % "jjwt-api" % "0.12.6",
      "io.jsonwebtoken" % "jjwt-impl" % "0.12.6",
      "io.jsonwebtoken" % "jjwt-jackson" % "0.12.6",
      "org.springframework.security" % "spring-security-crypto" % "6.3.4",
      "ch.qos.logback" % "logback-classic" % "1.5.6"
    ),

    assembly / mainClass := Some("com.projectmanager.MainApp"),
    assembly / assemblyJarName := "scala-backend.jar",
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", "MANIFEST.MF") => MergeStrategy.discard
      case PathList("META-INF", "spring", xs @ _*) => MergeStrategy.first
      case PathList("META-INF", "spring.factories") => MergeStrategy.concat
      case PathList("META-INF", "services", xs @ _*) => MergeStrategy.concat
      case PathList("META-INF", "versions", xs @ _*) => MergeStrategy.first
      case PathList("META-INF", "io.netty.versions.properties") => MergeStrategy.first
      case PathList("META-INF", xs @ _*) => MergeStrategy.discard
      case "module-info.class" => MergeStrategy.discard
      case x if x.endsWith("/module-info.class") => MergeStrategy.discard
      case x if x.endsWith(".proto") => MergeStrategy.first
      case x => MergeStrategy.first
    }
  )