import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { tenantAuthService } from '../services/tenantAuthService';
import { logger } from '../utils/logger';

const sessionTimeoutMinutes = 15;
const TIMEOUT_MS = sessionTimeoutMinutes * 60 * 1000;

/**
 * Global Admin Session Manager Hook
 * Requirements:
 * 1. Logout on 15m inactivity
 * 2. Invalidate session automatically upon critical changes via Supabase Events
 */
export function useAdminSessionTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async (reason: string) => {
    logger.warn(`Admin Session ended due to: ${reason}`, 'SessionTimeout');
    await tenantAuthService.logout();
    // We reload to bypass caching and forcefully kick the user out at the entry level
    window.location.href = '/';
  };

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => handleLogout('Inactivity Timeout'), TIMEOUT_MS);
  };

  useEffect(() => {
    // Passive auth listener for when password changes globally or JWT is revoked natively by Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED' || (!session && event === 'INITIAL_SESSION')) {
        handleLogout('Auth Token Invalidated or Destroyed by Backend');
      }
    });

    // Active Activity Triggers 
    const domEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    domEvents.forEach(event => document.addEventListener(event, resetTimer, { passive: true }));
    
    // Kickstart inactivity timer
    resetTimer();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      domEvents.forEach(event => document.removeEventListener(event, resetTimer));
      authListener.subscription.unsubscribe();
    };
  }, []);
}
