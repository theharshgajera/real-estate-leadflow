-- Add site visit statuses to the lead_status enum
ALTER TYPE lead_status ADD VALUE 'site_visit_scheduled';
ALTER TYPE lead_status ADD VALUE 'site_visit_done';