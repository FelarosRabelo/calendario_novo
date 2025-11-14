-- Drop existing table if exists (for fresh start)
DROP TABLE IF EXISTS events CASCADE;

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_index INTEGER NOT NULL CHECK (month_index >= 0 AND month_index <= 11),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 31),
  event_text TEXT NOT NULL,
  event_link TEXT,
  region VARCHAR(2) NOT NULL CHECK (region IN ('SC', 'RS', 'PR')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_events_month_day ON events(month_index, day);
CREATE INDEX idx_events_region ON events(region);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read" ON events
  FOR SELECT
  USING (true);

-- Public insert
CREATE POLICY "Allow public insert" ON events
  FOR INSERT
  WITH CHECK (true);

-- Public update
CREATE POLICY "Allow public update" ON events
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Public delete
CREATE POLICY "Allow public delete" ON events
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
