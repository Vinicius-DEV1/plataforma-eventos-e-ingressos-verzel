import { useEffect, useState } from 'react';

export function useCountdown(targetIso: string) {
  const target = new Date(targetIso).getTime();
  const [remainingMs, setRemainingMs] = useState(() => target - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(target - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { minutes, seconds, expired: remainingMs <= 0 };
}
