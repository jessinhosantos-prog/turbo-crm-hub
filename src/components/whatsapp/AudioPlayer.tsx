import { useState, useRef } from 'react';
import { Play, Pause, Volume2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  url: string;
  fromMe?: boolean;
}

export const AudioPlayer = ({ url, fromMe = false }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center gap-3 min-w-[240px] p-2 rounded-xl",
      fromMe ? "bg-wa-primary" : "bg-wa-primary"
    )}>
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 bg-wa-bg-main hover:bg-wa-surface text-wa-text-main rounded-full"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>

      {/* Progress and time */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-wa-primary-foreground font-mono">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-wa-primary-foreground/70">/</span>
          <span className="text-xs text-wa-primary-foreground/70 font-mono">
            {formatTime(duration)}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-wa-primary-foreground/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-wa-bg-main transition-all rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Volume button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-wa-primary-foreground hover:bg-wa-primary-foreground/10"
      >
        <Volume2 className="h-4 w-4" />
      </Button>

      {/* More options */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-wa-primary-foreground hover:bg-wa-primary-foreground/10"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  );
};
