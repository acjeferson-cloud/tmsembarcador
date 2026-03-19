import { useEffect } from 'react';
import { userActivitiesService } from '../services/userActivitiesService';

const lastLogged = new Map<string, number>();

export function useActivityLogger(moduleName: string, actionType: string, description: string) {
  useEffect(() => {
    const key = `${moduleName}:${actionType}`;
    const now = Date.now();
    const lastTime = lastLogged.get(key) || 0;
    
    // Prevent duplicate logs of the same action within 5 seconds (solves React StrictMode double mount)
    if (now - lastTime > 5000) {
      userActivitiesService.logActivity(moduleName, actionType, description);
      lastLogged.set(key, now);
    }
  }, [moduleName, actionType, description]);
}
