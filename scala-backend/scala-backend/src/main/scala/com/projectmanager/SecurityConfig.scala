package com.projectmanager

import org.springframework.context.annotation.{Bean, Configuration}
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.{CorsConfiguration, CorsConfigurationSource, UrlBasedCorsConfigurationSource}
import java.util.Arrays

@Configuration
@EnableWebSecurity
class SecurityConfig(jwtFilter: JwtFilter) {

  @Bean
  def corsConfigurationSource(): CorsConfigurationSource = {
    val config = new CorsConfiguration()
    config.setAllowedOriginPatterns(Arrays.asList("*"))
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"))
    config.setAllowedHeaders(Arrays.asList("*"))
    config.setAllowCredentials(true)

    val source = new UrlBasedCorsConfigurationSource()
    source.registerCorsConfiguration("/**", config)
    source
  }

  @Bean
  def filterChain(http: HttpSecurity): SecurityFilterChain = {
    http
      .cors().configurationSource(corsConfigurationSource())
      .and()
      .csrf().disable()
      .authorizeHttpRequests(auth => auth
        .requestMatchers("/health", "/api/register", "/api/login").permitAll()
        .anyRequest().authenticated()
      )
      .addFilterBefore(jwtFilter, classOf[UsernamePasswordAuthenticationFilter])
    http.build()
  }
}
