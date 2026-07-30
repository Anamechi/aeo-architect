import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, CheckCircle2 } from 'lucide-react';

const MIN_LENGTH = 8;

export default function ResetPassword() {
  const [ready, setReady] = useState(false);      // recovery session established
  const [invalid, setInvalid] = useState(false);  // no/expired recovery link
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  // The recovery link creates a temporary session (PASSWORD_RECOVERY event).
  // Only allow the form once that session exists.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Give Supabase a moment to parse the token from the URL, then decide.
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) setReady(true);
            else setInvalid(true);
          });
        }, 1200);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate('/admin/login'), 2500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {done ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <KeyRound className="h-6 w-6 text-primary" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {done ? 'Password updated' : 'Set a new password'}
          </CardTitle>
          <CardDescription>
            {done
              ? 'Your password has been changed. Redirecting you to sign in...'
              : 'Choose a new password for your admin dashboard.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <Button className="w-full" onClick={() => navigate('/admin/login')}>
              Go to sign in
            </Button>
          ) : invalid ? (
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <Alert variant="destructive">
                <AlertDescription>
                  This reset link is invalid or has expired. Request a new one.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => navigate('/admin/forgot-password')}>
                Request a new link
              </Button>
            </div>
          ) : !ready ? (
            <p className="text-center text-sm text-muted-foreground">Verifying your reset link...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder={`At least ${MIN_LENGTH} characters`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
