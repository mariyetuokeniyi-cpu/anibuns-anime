import { useEffect, useRef, useState, useCallback } from "react";
import { Cloud } from "@/components/decorations";

type PlaylistItem = { id: string; label: string; url: string };

type Props = {
  src: string;
  title?: string;
  playlist?: PlaylistItem[];
  activeId?: string;
  onSelect?: (item: PlaylistItem) => void;
};

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function CloudPlayer({ src, title, playlist = [], activeId, onSelect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [rateOpen, setRateOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pip, setPip] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 2200);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const seekBy = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + delta));
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    const nv = Math.max(0, Math.min(1, val));
    v.volume = nv;
    v.muted = nv === 0;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  };

  const togglePip = async () => {
    const v = videoRef.current as any;
    if (!v) return;
    try {
      if ((document as any).pictureInPictureElement) await (document as any).exitPictureInPicture();
      else if (v.requestPictureInPicture) await v.requestPictureInPicture();
    } catch {}
  };

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnter = () => setPip(true);
    const onLeave = () => setPip(false);
    v.addEventListener("enterpictureinpicture", onEnter);
    v.addEventListener("leavepictureinpicture", onLeave);
    return () => {
      v.removeEventListener("enterpictureinpicture", onEnter);
      v.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const focused = wrap.contains(document.activeElement) || document.fullscreenElement === wrap;
      if (!focused) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-5);
          break;
        case "ArrowUp":
          e.preventDefault();
          changeVolume((videoRef.current?.volume ?? 1) + 0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          changeVolume((videoRef.current?.volume ?? 1) - 0.1);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
      }
      showControls();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, showControls]);

  // Reset on src change
  useEffect(() => {
    setCurrent(0);
    setDuration(0);
    setBuffered(0);
    showControls();
  }, [src, showControls]);

  const onSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div
        ref={wrapRef}
        tabIndex={0}
        onMouseMove={showControls}
        onMouseLeave={() => playing && setControlsVisible(false)}
        className="group relative aspect-video overflow-hidden rounded-3xl border bg-black shadow-lg outline-none focus:ring-2 focus:ring-primary"
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          className="h-full w-full"
          onClick={togglePlay}
          onPlay={() => { setPlaying(true); showControls(); }}
          onPause={() => { setPlaying(false); setControlsVisible(true); }}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            setVolume(e.currentTarget.volume);
            setMuted(e.currentTarget.muted);
            e.currentTarget.playbackRate = rate;
          }}
          onProgress={(e) => {
            const b = e.currentTarget.buffered;
            if (b.length) setBuffered(b.end(b.length - 1));
          }}
          onVolumeChange={(e) => {
            setVolume(e.currentTarget.volume);
            setMuted(e.currentTarget.muted);
          }}
        />

        {/* Center play button when paused */}
        {!playing && (
          <button
            onClick={togglePlay}
            aria-label="Play"
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm transition hover:bg-black/40"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl shadow-2xl transition hover:scale-110">
              ▶
            </span>
          </button>
        )}

        {/* Controls */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-10 transition-opacity duration-200 ${
            controlsVisible || !playing ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="pointer-events-auto flex flex-col gap-2">
            {/* Progress */}
            <div
              onClick={onSeekClick}
              className="group/bar relative h-2 cursor-pointer rounded-full bg-white/20"
            >
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufPct}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${pct}%` }} />
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow group-hover/bar:opacity-100"
                style={{ left: `${pct}%` }}
              />
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-2 text-white">
              <button onClick={togglePlay} aria-label="Play/Pause" className="rounded-full p-2 hover:bg-white/15">
                {playing ? "❚❚" : "▶"}
              </button>
              <button onClick={() => seekBy(-10)} aria-label="Back 10s" className="rounded-full p-2 text-sm hover:bg-white/15">
                ⏪ 10
              </button>
              <button onClick={() => seekBy(10)} aria-label="Forward 10s" className="rounded-full p-2 text-sm hover:bg-white/15">
                10 ⏩
              </button>

              <div className="ml-1 flex items-center gap-1">
                <button onClick={toggleMute} aria-label="Mute" className="rounded-full p-2 hover:bg-white/15">
                  {muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  className="h-1 w-20 accent-primary"
                  aria-label="Volume"
                />
              </div>

              <div className="ml-2 text-xs tabular-nums text-white/80">
                {fmt(current)} / {fmt(duration)}
              </div>

              <div className="ml-auto flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={() => setRateOpen((o) => !o)}
                    className="rounded-full px-3 py-1 text-xs font-semibold hover:bg-white/15"
                  >
                    {rate}x
                  </button>
                  {rateOpen && (
                    <div className="absolute bottom-full right-0 mb-2 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/90 text-xs shadow-xl">
                      {[0.5, 1, 1.25, 1.5, 2].map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setRate(r);
                            if (videoRef.current) videoRef.current.playbackRate = r;
                            setRateOpen(false);
                          }}
                          className={`px-4 py-1.5 text-left hover:bg-white/15 ${rate === r ? "text-primary" : "text-white"}`}
                        >
                          {r}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {typeof document !== "undefined" && "pictureInPictureEnabled" in document && (
                  <button onClick={togglePip} aria-label="Picture in Picture" className={`rounded-full p-2 text-sm hover:bg-white/15 ${pip ? "text-primary" : ""}`}>
                    ▭
                  </button>
                )}
                <button onClick={toggleFullscreen} aria-label="Fullscreen" className="rounded-full p-2 hover:bg-white/15">
                  {fullscreen ? "🗗" : "⛶"}
                </button>
              </div>
            </div>

            {title && (
              <div className="absolute left-4 right-4 top-3 truncate text-sm font-semibold text-white/90 drop-shadow">
                {title}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Playlist */}
      {playlist.length > 0 && (
        <aside className="rounded-3xl border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 px-2 font-display text-sm font-bold">
            <Cloud size={20} /> Sources
          </div>
          <ul className="max-h-[420px] space-y-1 overflow-y-auto">
            {playlist.map((p) => {
              const active = p.id === activeId;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => onSelect?.(p)}
                    className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition hover:scale-[1.01] ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-transparent bg-muted/50 text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                      {active && playing ? "❚❚" : "▶"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.url}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      )}
    </div>
  );
}
