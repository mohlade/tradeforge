import { useState, useEffect } from 'react';

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
    } else {
      mql.addListener(onChange);
    }
    setMatches(mql.matches);
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange);
      } else {
        mql.removeListener(onChange);
      }
    };
  }, [query]);

  return matches;
}
