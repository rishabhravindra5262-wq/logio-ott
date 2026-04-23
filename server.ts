import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Use memory storage for Multer (since we'll upload to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

async function createServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    // Security Header for Google Auth Popups
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', storage: 'supabase-cloud' });
  });

  // Cloud File Upload Endpoint (Supabase)
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      res.json({ url: publicUrl, fileName: fileName });
    } catch (error: any) {
      console.error('Supabase upload error:', error);
      res.status(500).json({ error: 'Failed to upload to Supabase Storage', details: error.message });
    }
  });

  // Publish Series Endpoint
  app.post('/api/series', async (req, res) => {
    const { series, episodes } = req.body;
    const seriesId = `series-${Date.now()}`;
    
    try {
      // 1. Insert Series
      const { error: sError } = await supabase
        .from('series')
        .insert({
           id: seriesId,
           title: series.title,
           category: series.category || 'General',
           description: series.description || '',
           vertical_thumbnail: series.verticalThumbnail,
           horizontal_thumbnail: series.horizontalThumbnail,
           total_episodes: episodes.length,
           tags: JSON.stringify(series.tags || [])
        });

      if (sError) throw sError;

      // 2. Insert Episodes
      const videoInserts = episodes.map((ep: any, index: number) => ({
        id: `ep-${Date.now()}-${index}`,
        series_id: seriesId,
        episode_number: index + 1,
        title: ep.title || `Episode ${index + 1}`,
        video_url: ep.videoUrl,
        thumbnail_url: ep.thumbnailUrl,
        coins_required: index < 5 ? 0 : 1
      }));

      const { error: vError } = await supabase
        .from('videos')
        .insert(videoInserts);

      if (vError) throw vError;

      // Ensure stats entry exists
      await supabase.from('stats').upsert({ id: 'global', total_views: 0, total_watch_time: 0 }, { onConflict: 'id' });

      res.json({ success: true, seriesId });
    } catch (error: any) {
      console.error('❌ SUPABASE PUBLISH FAILURE:', error);
      res.status(500).json({ error: 'Failed to save series data to Supabase', details: error.message });
    }
  });

  // Get Series
  app.get('/api/series', async (req, res) => {
    try {
      const { sort } = req.query;
      let query = supabase.from('series').select('*');
      
      if (sort === 'trending') {
        query = query.order('views', { ascending: false }).order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      if (error) throw error;

      const series = (data || []).map(r => ({
        ...r,
        verticalThumbnail: r.vertical_thumbnail,
        horizontalThumbnail: r.horizontal_thumbnail,
        totalEpisodes: r.total_episodes,
        createdAt: r.created_at,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
        trending: !!r.trending
      }));
      res.json(series);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch series from Supabase' });
    }
  });

  app.post('/api/series/:id/view', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.rpc('increment_series_view', { series_id: id });
      
      if (error) {
         // Fallback if RPC isn't set up
         const { data: s } = await supabase.from('series').select('views').eq('id', id).single();
         await supabase.from('series').update({ views: (s?.views || 0) + 1 }).eq('id', id);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to increment view' });
    }
  });

  app.post('/api/videos/:id/like', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: v } = await supabase.from('videos').select('likes').eq('id', id).single();
      await supabase.from('videos').update({ likes: (v?.likes || 0) + 1 }).eq('id', id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to increment like' });
    }
  });

  // Featured Series
  app.get('/api/featured', async (req, res) => {
    try {
      // Check config for featured id
      const { data: cfg } = await supabase.from('config').select('value').eq('key', 'featuredSeriesId').single();
      let featuredId = cfg?.value;

      if (featuredId) {
        const { data: row } = await supabase.from('series').select('*').eq('id', featuredId).single();
        if (row) {
          return res.json({
            ...row,
            verticalThumbnail: row.vertical_thumbnail,
            horizontalThumbnail: row.horizontal_thumbnail,
            totalEpisodes: row.total_episodes,
            tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
            trending: !!row.trending
          });
        }
      }
      
      // Fallback to first series
      const { data: first } = await supabase.from('series').select('*').limit(1).single();
      if (first) {
        res.json({
          ...first,
          verticalThumbnail: first.vertical_thumbnail,
          horizontalThumbnail: first.horizontal_thumbnail,
          totalEpisodes: first.total_episodes,
          tags: typeof first.tags === 'string' ? JSON.parse(first.tags) : (first.tags || []),
          trending: !!first.trending
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch featured series' });
    }
  });

  app.post('/api/featured', async (req, res) => {
    try {
      const { seriesId } = req.body;
      await supabase.from('config').upsert({ key: 'featuredSeriesId', value: seriesId });
      res.json({ success: true, featuredSeriesId: seriesId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update featured series' });
    }
  });

  app.get('/api/videos', async (req, res) => {
    try {
      const { seriesId } = req.query;
      let query = supabase.from('videos').select('*');
      
      if (seriesId) {
        query = query.eq('series_id', seriesId).order('episode_number', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      if (error) throw error;

      const videos = (data || []).map(v => ({
        ...v,
        seriesId: v.series_id,
        episodeNumber: v.episode_number,
        videoUrl: v.video_url,
        thumbnailUrl: v.thumbnail_url,
        coinsRequired: v.coins_required
      }));
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  // Stats
  app.get('/api/stats', async (req, res) => {
    try {
      const { data } = await supabase.from('stats').select('*').eq('id', 'global').single();
      res.json({
        totalViews: data?.total_views || 0,
        totalWatchTime: data?.total_watch_time || 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.post('/api/stats', async (req, res) => {
    try {
      const { view, duration } = req.body;
      const { data: s } = await supabase.from('stats').select('*').eq('id', 'global').single();
      
      const updates: any = {};
      if (view) updates.total_views = (s?.total_views || 0) + 1;
      if (duration > 0) updates.total_watch_time = (s?.total_watch_time || 0) + Number(duration);
      
      await supabase.from('stats').update(updates).eq('id', 'global');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update stats' });
    }
  });

  // Notifications
  app.get('/api/notifications', async (req, res) => {
    try {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications', async (req, res) => {
    try {
      const { title, message, type } = req.body;
      await supabase.from('notifications').insert({
        id: `notif-${Date.now()}`,
        title,
        message,
        type: type || 'info'
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await supabase.from('notifications').delete().eq('id', id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  // Users
  app.get('/api/user/:email', async (req, res) => {
    try {
      const { email } = req.params;
      let { data: user } = await supabase.from('users').select('*').eq('email', email).single();
      
      if (!user) {
        const { data: newUser } = await supabase.from('users').insert({ email, coins: 10 }).select().single();
        user = newUser;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.post('/api/user', async (req, res) => {
    try {
      const { email, name, phone } = req.body;
      await supabase.from('users').update({ name, phone }).eq('email', email);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all users' });
    }
  });

  // Vite/Static Hosting
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  return app;
}

// Development server startup
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  createServer().then(app => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`🔋 Supabase Cloud active`);
    });
  });
}

export default createServer;
