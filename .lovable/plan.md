## Better Player for Kamatera Streams

Replace the bare `<video controls>` on the anime detail page with a custom player that has the controls and polish you'd expect from a real streaming service.

### Features
- Big play/pause button overlay, click-video-to-toggle
- Custom progress bar with buffered indicator and scrub-to-seek
- Time display (current / total)
- Volume slider + mute toggle
- Playback speed menu (0.5x, 1x, 1.25x, 1.5x, 2x)
- Skip ±10s buttons
- Fullscreen toggle
- Picture-in-Picture button (when supported)
- Keyboard shortcuts: Space (play/pause), ←/→ (seek 5s), ↑/↓ (volume), F (fullscreen), M (mute)
- Auto-hide controls after 2s of inactivity while playing
- Episode-style sidebar listing saved streams for that anime — click to switch source without leaving the player
- Pretty themed styling (rounded, gradient overlay, matches Anibuns look)

### Files
- **New** `src/components/CloudPlayer.tsx` — self-contained player component (props: `src`, `title`, `playlist`, `onSelect`)
- **Edit** `src/routes/anime.$id.tsx` — swap the existing `<video>` block for `<CloudPlayer />`, pass the saved streams as the playlist

No backend / schema changes — purely a frontend upgrade to the existing `stream_links` flow.
