-- Create table to store site-specific labels per academic year
CREATE TABLE IF NOT EXISTS site_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NULL,
  key text NOT NULL,
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_labels_academic_year_id ON site_labels(academic_year_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_site_labels_academic_year_key ON site_labels(academic_year_id, key);
