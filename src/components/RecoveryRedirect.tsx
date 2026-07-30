import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * When a password-recovery link is opened, Supabase parses the token and fires
 * PASSWORD_RECOVERY. The link may land on any page (e.g. the site root, if the
 * exact reset path is not in Supabase's redirect allow-list), so this listener
 * routes the visitor to the reset-password page from wherever they land.
 * Rendered inside the router so navigation stays client-side.
 */
export const RecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && location.pathname !== '/admin/reset-password') {
        navigate('/admin/reset-password', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
};
