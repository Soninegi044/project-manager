package com.projectmanager

import java.time.Instant
import java.util.UUID

case class Task(
                 id: UUID,
                 title: String,
                 description: String,
                 status: String,
                 priority: String,
                 projectId: UUID,
                 userId: UUID,
                 createdAt: Instant
               )
