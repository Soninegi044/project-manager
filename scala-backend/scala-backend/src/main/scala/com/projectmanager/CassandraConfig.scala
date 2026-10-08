package com.projectmanager

import com.datastax.oss.driver.api.core.CqlSession
import org.springframework.context.annotation.{Bean, Configuration}
import java.net.InetSocketAddress

@Configuration
class CassandraConfig {

  @Bean
  def cqlSession(): CqlSession = {
    CqlSession.builder()
      .addContactPoint(new InetSocketAddress("127.0.0.1", 9042))
      .withLocalDatacenter("datacenter1")
      .withKeyspace("project_manager")
      .build()
  }
}
