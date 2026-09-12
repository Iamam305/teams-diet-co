import { startNavigationProgress } from "@/lib/navigation-progress";

export function onRouterTransitionStart() {
  startNavigationProgress();
}
