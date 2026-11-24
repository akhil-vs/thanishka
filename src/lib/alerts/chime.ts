const STORAGE_KEY = "thanishka-order-alerts";

let audioCtx: AudioContext | null = null;
const listeners = new Set<() => void>();

function emitOrderAlertPreference() {
  listeners.forEach((listener) => listener());
}

export function subscribeOrderAlerts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function orderAlertsUnlocked() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function rememberOrderAlertsEnabled() {
  try {
    localStorage.setItem(STORAGE_KEY, "on");
  } catch {
    /* private mode */
  }
  emitOrderAlertPreference();
}

async function runningContext() {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") {
    try {
      await audioCtx.resume();
    } catch {
      /* still blocked until a user gesture */
    }
  }
  return audioCtx.state === "running" ? audioCtx : null;
}

export async function armOrderAlertSound() {
  await runningContext();
}

export async function playOrderChime() {
  const ctx = await runningContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [784, 988, 1175];
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + index * 0.11;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.09, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.6);
  });
}

export async function enableOrderAlertSound() {
  rememberOrderAlertsEnabled();
  await playOrderChime();
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "default"
  ) {
    try {
      await Notification.requestPermission();
    } catch {
      /* the in-app chime still works */
    }
  }
}

export function notifyBrowser(opts: {
  title: string;
  body: string;
  href: string;
  tag: string;
}) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && !document.hidden) return;
  try {
    const notification = new Notification(opts.title, {
      body: opts.body.slice(0, 500),
      tag: opts.tag,
    });
    notification.onclick = () => {
      window.focus();
      window.location.assign(opts.href);
      notification.close();
    };
  } catch {
    /* notifications are optional */
  }
}
