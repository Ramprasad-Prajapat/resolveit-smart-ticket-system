-- ==============================================================================
-- ResolveIT Simple Edition — Reference Database Schema
-- Compatible with MySQL 8.0+ / InnoDB / utf8mb4
--
-- Note: Spring Boot automatically creates/updates this schema at startup
-- using Hibernate (spring.jpa.hibernate.ddl-auto=update). This file is
-- provided for DBA review, schema understanding, and manual setup if needed.
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS resolveit_simple_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE resolveit_simple_db;

-- ------------------------------------------------------------------------------
-- Table 1: users
-- Stores registered accounts with BCrypt-hashed passwords and system roles.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL,
  created_at    DATETIME     NOT NULL,
  updated_at    DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 2: complaints
-- Core entity storing tickets with status, priority, category, and ownership.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
  id             BIGINT       NOT NULL AUTO_INCREMENT,
  ticket_number  VARCHAR(30)  NOT NULL,
  title          VARCHAR(150) NOT NULL,
  description    TEXT         NOT NULL,
  status         VARCHAR(20)  NOT NULL,
  priority       VARCHAR(20)  NOT NULL,
  category       VARCHAR(30)  NOT NULL,
  created_by_id  BIGINT       NOT NULL,
  assigned_to_id BIGINT       DEFAULT NULL,
  created_at     DATETIME     NOT NULL,
  updated_at     DATETIME     NOT NULL,
  resolved_at    DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_complaints_ticket_number (ticket_number),
  KEY idx_complaints_created_by (created_by_id),
  KEY idx_complaints_assigned_to (assigned_to_id),
  KEY idx_complaints_status (status),
  KEY idx_complaints_created_at (created_at),
  CONSTRAINT fk_complaints_created_by FOREIGN KEY (created_by_id)
    REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_complaints_assigned_to FOREIGN KEY (assigned_to_id)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 3: comments
-- Conversation notes posted by the complainant, assigned agent, or admin.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id           BIGINT   NOT NULL AUTO_INCREMENT,
  complaint_id BIGINT   NOT NULL,
  author_id    BIGINT   NOT NULL,
  message      TEXT     NOT NULL,
  created_at   DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_comments_complaint_id (complaint_id),
  CONSTRAINT fk_comments_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints (id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id)
    REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 4: status_history
-- Immutable audit log recording every status change with actor and note.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_history (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  complaint_id BIGINT       NOT NULL,
  changed_by_id BIGINT      NOT NULL,
  from_status  VARCHAR(20)  DEFAULT NULL,
  to_status    VARCHAR(20)  NOT NULL,
  note         VARCHAR(255) DEFAULT NULL,
  changed_at   DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_history_complaint_id (complaint_id),
  CONSTRAINT fk_history_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints (id) ON DELETE CASCADE,
  CONSTRAINT fk_history_changed_by FOREIGN KEY (changed_by_id)
    REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Table 5: notifications
-- Alert notifications for assignment and reassign events delivered to agents/admins.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  user_id       BIGINT       NOT NULL,
  type          VARCHAR(30)  NOT NULL,
  title         VARCHAR(100) NOT NULL,
  message       VARCHAR(500) NOT NULL,
  complaint_id  BIGINT       DEFAULT NULL,
  ticket_number VARCHAR(30)  DEFAULT NULL,
  is_read       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notifications_user_read (user_id, is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

