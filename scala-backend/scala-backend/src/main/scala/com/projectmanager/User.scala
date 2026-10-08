package com.projectmanager

import java.time.Instant
import java.util.UUID

case class User(
                 id: UUID,
                 name: String,
                 email: String,
                 password: String,
                 createdAt: Instant
               )