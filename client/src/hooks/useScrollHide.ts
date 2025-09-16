import { useState, useEffect, useRef } from 'react';

interface UseScrollHideOptions {
  threshold?: number; // Minimum scroll distance to trigger hide/show
  enableOnPaths?: string[]; // Only enable on specific paths
  disableOnPaths?: string[]; // Disable on specific paths
}

export function useScrollHide(currentPath: string, options: UseScrollHideOptions = {}) {
  const { 
    threshold = 10, 
    enableOnPaths = ['/chat'], 
    disableOnPaths = [] 
  } = options;

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // Check if scroll hiding should be enabled on current path
  const shouldEnableScrollHide = () => {
    if (disableOnPaths.some(path => currentPath.startsWith(path))) {
      return false;
    }
    
    // Enable on chat pages (both list and specific chat)
    return enableOnPaths.some(path => currentPath.startsWith(path));
  };

  useEffect(() => {
    // Reset visibility when path changes
    setIsVisible(true);
    lastScrollY.current = 0;

    if (!shouldEnableScrollHide()) {
      return;
    }

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Don't hide at the very top of the page
      if (scrollY < 50) {
        setIsVisible(true);
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const difference = Math.abs(scrollY - lastScrollY.current);
      
      // Only update if scroll difference exceeds threshold
      if (difference > threshold) {
        // Hide on any scroll (up or down) as requested by user
        setIsVisible(false);
        
        // Show again after a delay if scrolling stops
        setTimeout(() => {
          setIsVisible(true);
        }, 2000); // Show again after 2 seconds of no scroll
      }

      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentPath, threshold]);

  return {
    isVisible: shouldEnableScrollHide() ? isVisible : true,
    shouldEnableScrollHide: shouldEnableScrollHide()
  };
}