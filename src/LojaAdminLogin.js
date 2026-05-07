import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';

export default function LojaAdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080808',
    }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        padding: '40px 32px', width: '100%', maxWidth: 360,
      }}>
        <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.2rem', letterSpacing: 4, margin: 0, color: '#fff' }}>
          ADMIN — LOJA
        </h1>
        {error && <div style={{ color: '#ff6b6b', fontSize: '.82rem' }}>{error}</div>}
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="E-mail" required
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', padding: '10px 14px', fontSize: '.9rem', outline: 'none' }}
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Senha" required
          style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', padding: '10px 14px', fontSize: '.9rem', outline: 'none' }}
        />
        <button type="submit" disabled={loading} style={{
          background: '#8b0000', color: '#fff', border: 'none', padding: '12px',
          fontFamily: 'Oswald, sans-serif', fontSize: '.85rem', letterSpacing: 3,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1,
        }}>
          {loading ? 'ENTRANDO…' : 'ENTRAR'}
        </button>
      </form>
    </div>
  );
}
