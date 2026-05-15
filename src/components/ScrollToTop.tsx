import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll to the top of the page on every route change,
 * unless the URL contains a hash (in which case the target
 * page is responsible for scrolling to that anchor).
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
