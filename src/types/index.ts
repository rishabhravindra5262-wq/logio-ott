export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // HLS .m3u8 URL
  thumbnailUrl: string;
  seriesId: string;
  episodeNumber: number;
  likes: number;
  comments: number;
  coinsRequired: number;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  horizontalThumbnail: string; // For home page scrolling
  verticalThumbnail: string;  // For feed previews
  totalEpisodes: number;
  tags: string[];
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  coins: number;
  unlockedEpisodes: string[]; // List of video IDs
}
