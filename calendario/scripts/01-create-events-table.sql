-- Create events table for the calendar
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_index INT NOT NULL CHECK (month_index >= 0 AND month_index <= 11),
  day INT NOT NULL CHECK (day >= 1 AND day <= 31),
  event_text VARCHAR(255) NOT NULL,
  event_link VARCHAR(2048),
  region VARCHAR(2) NOT NULL CHECK (region IN ('SC', 'RS', 'PR')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_events_month_day ON events(month_index, day);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and write events (public calendar)
CREATE POLICY "Allow public read access" ON events
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete" ON events
  FOR DELETE USING (true);
