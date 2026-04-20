-- Migration: init
-- Created: 2026-04-20

CREATE TABLE `trace_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  `event_id` VARCHAR(191) NOT NULL COMMENT '客户端事件ID(UUID)',

  `event_type` ENUM('track', 'page', 'error', 'identify', 'custom') NOT NULL COMMENT '事件类型',
  `event_name` VARCHAR(128) DEFAULT NULL COMMENT '自定义事件名称',
  `timestamp` BIGINT NOT NULL COMMENT '事件发生时间戳(ms)',

  `user_id` VARCHAR(64) DEFAULT NULL COMMENT '登录用户ID',
  `anonymous_id` VARCHAR(64) NOT NULL COMMENT '匿名用户ID',
  `session_id` VARCHAR(64) NOT NULL COMMENT '会话ID',

  `url` VARCHAR(2048) DEFAULT NULL COMMENT '页面URL',
  `title` VARCHAR(512) DEFAULT NULL COMMENT '页面标题',
  `referrer` VARCHAR(2048) DEFAULT NULL COMMENT '来源页面',

  `device_info` JSON NOT NULL COMMENT '设备信息JSON',
  `properties` JSON DEFAULT NULL COMMENT '自定义属性JSON',

  `priority` ENUM('critical', 'normal', 'low') NOT NULL DEFAULT 'normal' COMMENT '事件优先级',

  `_sent` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '客户端发送标志',
  `_retry_count` INT NOT NULL DEFAULT 0 COMMENT '重试次数',
  `_created_at` BIGINT NOT NULL COMMENT '服务端创建时间戳(ms)',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_id` (`event_id`),
  INDEX `idx_timestamp` (`timestamp`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_anonymous_id` (`anonymous_id`),
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_created_at` (`_created_at`),
  INDEX `idx_user_timestamp` (`user_id`, `timestamp`),
  INDEX `idx_session_timestamp` (`session_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='埋点事件表';
