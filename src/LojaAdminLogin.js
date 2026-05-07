import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from './firebase';

const ALLOWED_EMAIL = 'rottenmind.store@gmail.com';

export default function LojaAdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email !== ALLOWED_EMAIL) {
        await auth.signOut();
        setError('Acesso negado. Use a conta autorizada.');
        return;
      }
      navigate('/admin');
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao autenticar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080808',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center',
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        padding: '40px 32px', width: '100%', maxWidth: 360,
      }}>
        <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.2rem', letterSpacing: 4, margin: 0, color: '#fff' }}>
          ADMIN — LOJA
        </h1>

        {error && (
          <div style={{ color: '#ff6b6b', fontSize: '.82rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            width: '100%', padding: '12px 16px',
            background: '#fff', color: '#1f1f1f', border: 'none',
            fontFamily: 'Inter, sans-serif', fontSize: '.9rem', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1,
            borderRadius: 2,
          }}
        >
          {/* ícone Google */}
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          {loading ? 'Autenticando…' : 'Entrar com Google'}
        </button>

        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '.72rem', color: 'rgba(255,255,255,.2)', margin: 0, textAlign: 'center' }}>
          Acesso restrito à conta autorizada
        </p>
      </div>
    </div>
  );
}
