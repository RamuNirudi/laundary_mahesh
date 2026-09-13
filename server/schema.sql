-- =============================================================================
-- Star Laundrovamat - MySQL schema
-- =============================================================================
-- Apply with:  mysql -u root -p < server/schema.sql
-- The API also creates and migrates these tables on boot (server/lib/schema.js),
-- so this file is the canonical reference and the clean-install path.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS laundry_app
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE laundry_app;

-- -----------------------------------------------------------------------------
-- users: customers, admins and service boys share one table, split by `role`.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                   CHAR(32)     NOT NULL,
  email                VARCHAR(254) NOT NULL,
  full_name            VARCHAR(120) NULL,
  role                 ENUM('customer','admin','service_boy') NOT NULL DEFAULT 'customer',
  phone                VARCHAR(32)  NOT NULL DEFAULT '',
  address              TEXT         NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  active               BOOLEAN      NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN      NOT NULL DEFAULT FALSE,
  reset_token_hash     CHAR(64)     NULL,
  reset_token_expires  DATETIME     NULL,
  created_date         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  KEY users_role_index (role, active),
  KEY users_reset_token_index (reset_token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- services: the laundry catalogue shown on /services and in the booking wizard.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id           CHAR(32)      NOT NULL,
  name         VARCHAR(120)  NOT NULL,
  description  TEXT          NULL,
  image        VARCHAR(1024) NULL,
  icon         VARCHAR(64)   NULL,
  category     VARCHAR(64)   NOT NULL DEFAULT 'General',
  price        DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_unit   VARCHAR(32)   NOT NULL DEFAULT 'per item',
  active       BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order   INT           NOT NULL DEFAULT 0,
  created_date DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY services_active_sort_index (active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- coupons: discount codes managed from the admin panel.
-- used_count is maintained by the API alongside coupon_redemptions so the admin
-- list can show usage without an aggregate join.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id                  CHAR(32)      NOT NULL,
  code                VARCHAR(48)   NOT NULL,
  description         VARCHAR(255)  NOT NULL DEFAULT '',
  discount_type       ENUM('percentage','fixed') NOT NULL DEFAULT 'percentage',
  discount_value      DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_order_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses            INT           NOT NULL DEFAULT 0,
  per_user_limit      INT           NOT NULL DEFAULT 0,
  used_count          INT           NOT NULL DEFAULT 0,
  active              BOOLEAN       NOT NULL DEFAULT TRUE,
  valid_from          DATE          NULL,
  valid_until         DATE          NULL,
  created_by          CHAR(32)      NULL,
  created_date        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date        DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY coupons_code_unique (code),
  KEY coupons_active_index (active, valid_from, valid_until),
  CONSTRAINT coupons_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- max_discount_amount, max_uses and per_user_limit all use 0 to mean "no limit".

-- -----------------------------------------------------------------------------
-- bookings: one row per pickup request. Line items live in booking_items.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id                   CHAR(32)      NOT NULL,
  booking_id           VARCHAR(32)   NOT NULL,
  customer_id          CHAR(32)      NOT NULL,
  customer_name        VARCHAR(120)  NULL,
  customer_phone       VARCHAR(32)   NOT NULL DEFAULT '',
  number_of_items      INT           NOT NULL DEFAULT 1,
  special_instructions TEXT          NULL,
  pickup_address       TEXT          NOT NULL,
  pickup_date          DATE          NOT NULL,
  pickup_time          VARCHAR(64)   NOT NULL,
  status               ENUM('Booking Requested','Booking Confirmed','Service Boy Assigned',
                            'Clothes Picked Up','Cleaning in Progress','Ready for Delivery',
                            'Delivered','Cancelled') NOT NULL DEFAULT 'Booking Requested',
  service_boy_id       CHAR(32)      NULL,
  service_boy_name     VARCHAR(120)  NULL,
  service_price        DECIMAL(10,2) NOT NULL DEFAULT 0,
  additional_charges   DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount             DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_id            CHAR(32)      NULL,
  coupon_code          VARCHAR(48)   NULL,
  coupon_discount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_amount         DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_set           BOOLEAN       NOT NULL DEFAULT FALSE,
  delivered_date       DATETIME(3)   NULL,
  cancelled_date       DATETIME(3)   NULL,
  created_date         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY bookings_reference_unique (booking_id),
  KEY bookings_customer_index (customer_id, created_date),
  KEY bookings_service_boy_index (service_boy_id, pickup_date),
  KEY bookings_status_index (status),
  KEY bookings_pickup_date_index (pickup_date),
  CONSTRAINT bookings_customer_fk    FOREIGN KEY (customer_id)    REFERENCES users (id)   ON DELETE CASCADE,
  CONSTRAINT bookings_service_boy_fk FOREIGN KEY (service_boy_id) REFERENCES users (id)   ON DELETE SET NULL,
  CONSTRAINT bookings_coupon_fk      FOREIGN KEY (coupon_id)      REFERENCES coupons (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- booking_items: services chosen for a booking, priced at booking time so later
-- catalogue edits never rewrite historical orders.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_items (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id   CHAR(32)      NOT NULL,
  service_id   CHAR(32)      NULL,
  service_name VARCHAR(120)  NOT NULL,
  quantity     INT           NOT NULL DEFAULT 1,
  price        DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_unit   VARCHAR(32)   NOT NULL DEFAULT 'per item',
  line_total   DECIMAL(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY booking_items_booking_index (booking_id),
  CONSTRAINT booking_items_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT booking_items_service_fk FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- booking_status_history: audit trail behind the customer status tracker.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_status_history (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id   CHAR(32)     NOT NULL,
  status       VARCHAR(64)  NOT NULL,
  changed_by   CHAR(32)     NULL,
  note         VARCHAR(255) NULL,
  created_date DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY booking_status_history_booking_index (booking_id, created_date),
  CONSTRAINT booking_status_history_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT booking_status_history_user_fk    FOREIGN KEY (changed_by) REFERENCES users (id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- coupon_redemptions: one row per accepted coupon use. Enforces per_user_limit
-- and gives the admin an auditable usage trail.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  coupon_id       CHAR(32)      NOT NULL,
  booking_id      CHAR(32)      NOT NULL,
  user_id         CHAR(32)      NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_date    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY coupon_redemptions_booking_unique (booking_id),
  KEY coupon_redemptions_coupon_user_index (coupon_id, user_id),
  CONSTRAINT coupon_redemptions_coupon_fk  FOREIGN KEY (coupon_id)  REFERENCES coupons (id)  ON DELETE CASCADE,
  CONSTRAINT coupon_redemptions_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT coupon_redemptions_user_fk    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- expenses: business costs feeding the dashboard and the business report.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id           CHAR(32)      NOT NULL,
  name         VARCHAR(160)  NOT NULL,
  category     VARCHAR(64)   NOT NULL DEFAULT 'Other',
  amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  date         DATE          NOT NULL,
  notes        TEXT          NULL,
  created_by   CHAR(32)      NULL,
  created_date DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_date DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY expenses_date_index (date),
  KEY expenses_category_index (category),
  CONSTRAINT expenses_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- contact_messages: submissions from the public /contact form.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id           CHAR(32)     NOT NULL,
  name         VARCHAR(120) NOT NULL,
  email        VARCHAR(254) NOT NULL,
  phone        VARCHAR(32)  NOT NULL DEFAULT '',
  message      TEXT         NOT NULL,
  handled      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_date DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY contact_messages_handled_index (handled, created_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- app_settings: editable business configuration for the admin Settings page.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key   VARCHAR(64) NOT NULL,
  setting_value TEXT        NOT NULL,
  updated_date  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
