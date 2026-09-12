type Listener = () => void;

const EVENT = "dietco:navigation-progress";

export function startNavigationProgress() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(EVENT));
}

export function subscribeNavigationProgress(listener: Listener) {
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener(EVENT, listener);
  };
}
