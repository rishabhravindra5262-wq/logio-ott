-- Create Config Table (for Featured Series ID)
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Create Series Table
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  vertical_thumbnail TEXT,
  horizontal_thumbnail TEXT,
  total_episodes INTEGER DEFAULT 0,
  rating REAL DEFAULT 4.5,
  trending BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Videos Table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  series_id TEXT REFERENCES series(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  coins_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Stats Table
CREATE TABLE IF NOT EXISTS stats (
  id TEXT PRIMARY KEY,
  total_views INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0
);

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  coins INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial stats
INSERT INTO stats (id, total_views, total_watch_time) 
VALUES ('global', 0, 0) 
ON CONFLICT (id) DO NOTHING;
