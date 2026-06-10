export interface Channel {
  id: string
  name: string
  country: string
  quality?: string
  url: string
  logo?: string
}

export interface DataStore {
  channels: Channel[]
  curated: string[]
  categories: Record<string, string[]>
  genres: string[]
  channel_genres: Record<string, string[]>
}

export interface ChannelGenreMap {
  [channelId: string]: string[]
}
