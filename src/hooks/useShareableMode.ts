import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAdminAuth } from "./useAdminAuth";

/**
 * Detects if the current view is in "shareable" mode
 * In shareable mode, technical details like XML previews should be hidden.
 * Technical details (XML previews, test drafting, model selector) also
 * require super admin — regular users never see them.
 */
export function useShareableMode() {
  const location = useLocation();
  const { isSuperAdmin } = useAdminAuth();

  const shareState = useMemo(() => {
    const params = new URLSearchParams(location.search);

    // Check for share-related URL parameters
    const isShared = params.has("shared") || params.has("share");
    const isEmbedded = params.has("embed") || params.has("embedded");
    const isPublic = params.has("public");

    // Also check if we're in an iframe (common for shared links)
    const isInIframe = typeof window !== "undefined" && window.self !== window.top;

    return {
      isShareable: isShared || isEmbedded || isPublic,
      isEmbedded: isEmbedded || isInIframe,
      isShareMode: isShared || isEmbedded || isPublic,
    };
  }, [location.search]);

  return {
    ...shareState,
    showTechnicalDetails: !shareState.isShareMode && isSuperAdmin,
  };
}
