declare global {
  interface Window {
    plausible?: (event: string) => void;
  }
}

export function trackSubscribe() {
  if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
    window.plausible('subscribe');
  }
}
