package com.projectmanager

import java.time.Instant
import java.util.UUID

case class Project(
                    id: UUID,
                    name: String,
                    description: String,
                    status: String,
                    userId: UUID,
                    createdAt: Instant
                  )