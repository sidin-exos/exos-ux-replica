import { useMemo } from "react";
import { useLocation } from "react-router-dom";

/**
 * Detects if the current view is in "shareable" mode
 * In shareable mode, technical details like XML previews should be hidden
 */
export function useShareableMode() {
  const location = useLocation();
  
  return useMemo(() => {
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
      showTechnicalDetails: !isShared && !isEmbedded && !isPublic,
    };
  }, [location.search]);
}
