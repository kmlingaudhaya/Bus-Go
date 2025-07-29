import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // Only call once when component mounts
    if (typeof window !== 'undefined' && window.frameworkReady) {
      try {
        window.frameworkReady();
      } catch (error) {
        console.warn('Framework ready callback failed:', error);
      }
    }
  }, []); // Empty dependency array to run only once
}
