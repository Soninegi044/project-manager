package com.projectmanager

import jakarta.servlet.FilterChain
import jakarta.servlet.http.{HttpServletRequest, HttpServletResponse}
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.Collections

@Component
class JwtFilter(jwtUtil: JwtUtil) extends OncePerRequestFilter {

  override def doFilterInternal(
                                 request: HttpServletRequest,
                                 response: HttpServletResponse,
                                 filterChain: FilterChain
                               ): Unit = {
    val authHeader = request.getHeader("Authorization")
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      val token = authHeader.substring(7)
      jwtUtil.extractUserId(token) match {
        case Some(userId) =>
          val auth = new UsernamePasswordAuthenticationToken(
            userId, null, Collections.emptyList()
          )
          auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request))
          SecurityContextHolder.getContext().setAuthentication(auth)
        case None =>
      }
    }
    filterChain.doFilter(request, response)
  }
}