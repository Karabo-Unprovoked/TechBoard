/*
  # Remove Unused Indexes

  1. Remove Unused Indexes
    - Drop `idx_deleted_customers_deleted_by`
    - Drop `idx_registration_requests_reviewed_by`
    - Drop `idx_repair_tickets_customer_id`
    - Drop `idx_ticket_attachments_ticket_id`
    - Drop `idx_email_settings_updated_by`
    - Drop `idx_ticket_emails_ticket_id`
    - Drop `idx_ticket_notes_ticket_id`

  These indexes were added for foreign key performance optimization, but the query
  planner has not used them. Removing them reduces maintenance overhead. They can
  be added back in the future if query patterns change and they become beneficial.
*/

-- Remove unused indexes
DROP INDEX IF EXISTS idx_deleted_customers_deleted_by;
DROP INDEX IF EXISTS idx_registration_requests_reviewed_by;
DROP INDEX IF EXISTS idx_repair_tickets_customer_id;
DROP INDEX IF EXISTS idx_ticket_attachments_ticket_id;
DROP INDEX IF EXISTS idx_email_settings_updated_by;
DROP INDEX IF EXISTS idx_ticket_emails_ticket_id;
DROP INDEX IF EXISTS idx_ticket_notes_ticket_id;