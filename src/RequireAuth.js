import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext';
import { auth } from './firebase';

const ALLOWED_EMAIL = 'rottenmind.store@gmail.com';

export default function RequireAuth({ children }) {
  const user = useAuth();

  // Se logou com conta errada, desloga imediatamente
  useEffect(() => {
    if (user && user.email !== ALLOWED_EMAIL) {
      auth.signOut();
    }
  }, [user]);

  if (user === undefined) return null; // carregando
  if (!user || user.email !== ALLOWED_EMAIL) return <Navigate to="/admin/login" replace />;
  return children;
}
