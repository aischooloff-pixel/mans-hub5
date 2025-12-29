import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Headphones, Dumbbell, Flame, Briefcase } from 'lucide-react';

// SVG icons styled for the project
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <circle cx="12" cy="12" r="12" className="text-primary" />
    <path 
      d="M16.5 16.5c-.2 0-.4-.1-.5-.2-2.5-1.5-5.8-1.8-9.5-1-.2 0-.5-.1-.6-.3-.1-.2-.1-.5.1-.7.2-.1.5-.1.7.1 4 .9 7.5.5 10.3 1.1.2.1.4.4.3.7-.1.2-.4.3-.8.3zm1.1-2.3c-.2 0-.5-.1-.6-.2-2.9-1.8-7.3-2.3-10.7-1.3-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 3.8-1.1 8.6-.6 11.8 1.4.2.1.3.5.2.8-.1.3-.3.4-.4.4zm.1-2.4c-3.4-2-9-2.2-12.2-1.2-.3.1-.7-.1-.8-.4s.1-.7.4-.8c3.7-1.1 9.8-.9 13.6 1.4.3.2.4.5.2.8-.1.2-.4.3-.7.3-.2-.1-.3-.1-.5-.1z" 
      className="text-foreground"
    />
  </svg>
);

const SoundcloudIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <circle cx="12" cy="12" r="12" className="fill-muted-foreground" />
    <path 
      d="M5.5 13.5c-.3 0-.5-.2-.5-.5v-2c0-.3.2-.5.5-.5s.5.2.5.5v2c0 .3-.2.5-.5.5zm1.5 1c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v4c0 .3-.2.5-.5.5zm1.5-.5c-.3 0-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5s.5.2.5.5v3c0 .3-.2.5-.5.5zm1.5.5c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v4c0 .3-.2.5-.5.5zm1.5 0c-.3 0-.5-.2-.5-.5v-4c0-.3.2-.5.5-.5s.5.2.5.5v4c0 .3-.2.5-.5.5zm4.5-.5h-2c-.3 0-.5-.2-.5-.5v-2.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5v.5c.6 0 1 .4 1 1v1c0 .3-.2.5-.5.5h-3z" 
      className="fill-background"
    />
  </svg>
);

const YandexMusicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <circle cx="12" cy="12" r="12" className="fill-secondary" />
    <path 
      d="M12 6l-2 6h4l-2-6zm0 2.5L13 12h-2l1-3.5zM8 14l4 4 4-4H8z" 
      className="fill-secondary-foreground"
    />
  </svg>
);

interface Playlist {
  id: string;
  title: string;
  icon: React.ReactNode;
  spotifyUrl?: string;
  soundcloudUrl?: string;
  yandexUrl?: string;
}

const playlists: Playlist[] = [
  {
    id: '1',
    title: 'В зал',
    icon: <Dumbbell className="w-5 h-5 text-primary" />,
    spotifyUrl: 'https://open.spotify.com',
    soundcloudUrl: 'https://soundcloud.com',
    yandexUrl: 'https://music.yandex.ru',
  },
  {
    id: '2',
    title: 'Мотивация',
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    spotifyUrl: 'https://open.spotify.com',
    soundcloudUrl: 'https://soundcloud.com',
    yandexUrl: 'https://music.yandex.ru',
  },
  {
    id: '3',
    title: 'Работа',
    icon: <Briefcase className="w-5 h-5 text-blue-500" />,
    spotifyUrl: 'https://open.spotify.com',
    soundcloudUrl: 'https://soundcloud.com',
    yandexUrl: 'https://music.yandex.ru',
  },
];

interface PlaylistsSectionProps {
  className?: string;
}

export const PlaylistsSection = ({ className }: PlaylistsSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleListen = (playlist: Playlist) => {
    // Open Spotify by default, can be customized
    if (playlist.spotifyUrl) {
      window.open(playlist.spotifyUrl, '_blank');
    }
  };

  return (
    <section className={className}>
      <div className="px-4">
        {/* Collapsed Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full bg-card rounded-2xl border border-border/50 
            transition-all duration-300 ease-out overflow-hidden
            ${isExpanded ? 'rounded-b-none border-b-0' : ''}
          `}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-primary" />
              <span className="font-heading font-semibold text-lg">Плейлисты</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <SpotifyIcon />
                <SoundcloudIcon />
                <YandexMusicIcon />
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
              />
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        <div
          className={`
            bg-card border border-border/50 border-t-0 rounded-b-2xl
            overflow-hidden transition-all duration-300 ease-out
            ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="p-4 pt-0 space-y-3">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {playlist.icon}
                  <span className="font-medium">{playlist.title}</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleListen(playlist);
                  }}
                  className="text-sm"
                >
                  Слушать
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
