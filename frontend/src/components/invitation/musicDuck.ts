/*
 * Lets a moment in the story turn the background song down for a while
 * (the confession's heartbeat) without knowing anything about the player.
 * Each caller gets its own release; the song comes back once all are released.
 */

type Listener = (ducked: boolean) => void;

const listeners = new Set<Listener>();
let holds = 0;

/** turn the music down; call the returned function to let it come back */
export function duckMusic() {
  holds += 1;
  if (holds === 1) listeners.forEach((fn) => fn(true));
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds = Math.max(0, holds - 1);
    if (holds === 0) listeners.forEach((fn) => fn(false));
  };
}

/** the music player listens here */
export function onMusicDuck(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
