import { Video, Series } from './types';

export const MOCK_SERIES: Series[] = [
  {
    id: 's1',
    title: 'The Hidden Heir',
    description: 'A young man discovers he is the rightful heir to a massive empire, but enemies are everywhere.',
    horizontalThumbnail: 'https://picsum.photos/seed/heir1/800/450',
    verticalThumbnail: 'https://picsum.photos/seed/heir2/450/800',
    totalEpisodes: 50,
    tags: ['Drama', 'Exciting', 'Family', 'Empire']
  },
  {
    id: 's2',
    title: 'Love in the fast lane',
    description: 'A professional racer falls for her biggest rival in a high-stakes championship.',
    horizontalThumbnail: 'https://picsum.photos/seed/race1/800/450',
    verticalThumbnail: 'https://picsum.photos/seed/race2/450/800',
    totalEpisodes: 30,
    tags: ['Romance', 'Modern', 'Fast-Paced']
  },
  {
    id: 's3',
    title: 'Cyber Shadows',
    description: 'In a future where memories can be hacked, one detective must find her own truth.',
    horizontalThumbnail: 'https://picsum.photos/seed/cyber1/800/450',
    verticalThumbnail: 'https://picsum.photos/seed/cyber2/450/800',
    totalEpisodes: 25,
    tags: ['Sci-Fi', 'Modern', 'Thriller']
  }
];

export const MOCK_VIDEOS: Video[] = [
  {
    id: 'v1',
    title: 'Episode 1: The Encounter',
    description: 'The story begins with a mysterious meeting in the rain.',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    thumbnailUrl: 'https://picsum.photos/seed/v1/450/800',
    seriesId: 's1',
    episodeNumber: 1,
    likes: 1200,
    comments: 85,
    coinsRequired: 0
  },
  {
    id: 'v2',
    title: 'Episode 2: The Secret Revealed',
    description: 'The truths start to unravel as the past catches up.',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    thumbnailUrl: 'https://picsum.photos/seed/v2/450/800',
    seriesId: 's1',
    episodeNumber: 2,
    likes: 950,
    comments: 42,
    coinsRequired: 0
  },
  {
    id: 'v3',
    title: 'Episode 3: No Turning Back',
    description: 'A decision is made that will change everything forever.',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    thumbnailUrl: 'https://picsum.photos/seed/v3/450/800',
    seriesId: 's1',
    episodeNumber: 3,
    likes: 800,
    comments: 30,
    coinsRequired: 5
  }
];
