import { useAuth } from '@/hooks/useAuth';
export default function SuperAdminRoute({children}:{children:React.ReactNode}) {
  const {isSuperAdmin,loading}=useAuth();
  if (loading) return <p role="status">Checking access…</p>;
  if (!isSuperAdmin) return <section role="alert"><h1 className="text-2xl font-bold">Access denied</h1><p>Email Review requires Super Admin access.</p></section>;
  return <>{children}</>;
}
