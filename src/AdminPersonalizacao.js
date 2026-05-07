import { useEffect, useRef, useState } from 'react';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from './firebase';

const CONFIG_DOC = doc(db, 'siteData', 'moadb_config');

// ── toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ value, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 36, height: 20, borderRadius: 10, position: 'relative',
          background: value ? '#8b0000' : 'rgba(255,255,255,.12)',
          transition: 'background .2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 19 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff', transition: 'left .2s',
        }} />
      </div>
      {label && (
        <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '.72rem', color: value ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)' }}>
          {label}
        </span>
      )}
    </label>
  );
}

// ── card base ─────────────────────────────────────────────────────────────────

function Card({ title, visible, onToggleVisible, saving, onSave, saveLabel, children }) {
  return (
    <div style={{
      background: '#141414',
      border: `1px solid ${visible ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      opacity: visible ? 1 : .6,
      transition: 'opacity .2s, border-color .2s',
    }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        background: '#181818',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Toggle value={visible} onChange={onToggleVisible} />
          <span style={{ fontFamily: 'Oswald,sans-serif', fontSize: '.78rem', letterSpacing: '.1em', textTransform: 'uppercase', color: visible ? '#fff' : 'rgba(255,255,255,.35)' }}>
            {title}
          </span>
        </div>
        {onSave && (
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={onSave}
            disabled={saving || !visible}
            style={{ padding: '4px 14px', fontSize: '.68rem', letterSpacing: '1.5px' }}
          >
            {saving ? '…' : saveLabel || 'Salvar'}
          </button>
        )}
      </div>

      {/* body */}
      <div style={{ padding: '16px', pointerEvents: visible ? 'auto' : 'none' }}>
        {children}
      </div>
    </div>
  );
}

// ── upload dropzone ───────────────────────────────────────────────────────────

function UploadZone({ storagePath, previewAspect = 'banner', disabled }) {
  const [currentUrl, setCurrentUrl] = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');
  const [dragOver, setDragOver]     = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    getDownloadURL(storageRef(storage, storagePath))
      .then(setCurrentUrl)
      .catch(() => setCurrentUrl(null));
  }, [storagePath]);

  async function upload(file) {
    if (!file?.type.startsWith('image/')) { setError('Arquivo inválido.'); return; }
    setUploading(true); setError(''); setSuccess(false);
    try {
      await uploadBytes(storageRef(storage, storagePath), file);
      const url = await getDownloadURL(storageRef(storage, storagePath));
      setCurrentUrl(url + '&t=' + Date.now());
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) { setError(e.message || 'Erro ao enviar.'); }
    finally { setUploading(false); }
  }

  const isBanner = previewAspect === 'banner';

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {/* preview */}
      <div style={{
        flexShrink: 0,
        width: isBanner ? 160 : 72,
        height: isBanner ? 72 : 72,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.08)',
        background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {currentUrl
          ? <img src={currentUrl} alt="" style={{ width: '100%', height: '100%', objectFit: isBanner ? 'cover' : 'contain' }} />
          : <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '.6rem', color: 'rgba(255,255,255,.2)' }}>sem imagem</span>
        }
      </div>

      {/* dropzone */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!disabled) upload(e.dataTransfer.files?.[0]); }}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragOver ? 'rgba(229,201,126,.6)' : 'rgba(255,255,255,.1)'}`,
            borderRadius: 6,
            background: dragOver ? 'rgba(229,201,126,.04)' : 'transparent',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: disabled || uploading ? 'not-allowed' : 'pointer',
            transition: 'all .15s',
          }}
        >
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} disabled={disabled || uploading} />
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ color: 'rgba(255,255,255,.25)', flexShrink: 0 }}>
            <path d="M12 16V8M12 8l-3 3M12 8l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '.72rem', color: 'rgba(255,255,255,.45)' }}>
              {uploading ? 'Enviando…' : 'Clique ou arraste'}
            </div>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '.62rem', color: 'rgba(255,255,255,.2)', marginTop: 2 }}>
              JPG, PNG, WEBP
            </div>
          </div>
        </div>
        {error   && <div style={{ marginTop: 6, fontFamily: 'Inter,sans-serif', fontSize: '.68rem', color: '#ffb3b3' }}>⚠ {error}</div>}
        {success && <div style={{ marginTop: 6, fontFamily: 'Inter,sans-serif', fontSize: '.68rem', color: '#4ade80' }}>✓ Atualizado!</div>}
      </div>
    </div>
  );
}

// ── tela principal ────────────────────────────────────────────────────────────

export default function AdminPersonalizacao() {
  const [cfg, setCfg] = useState({
    showBanner:       true,
    showLogo:         true,
    showBannerText:   true,
    bannerEyebrow:      '',
    bannerTitleMain:    '',
    bannerTitleOutline: '',
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(CONFIG_DOC, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setCfg({
          showBanner:         d.showBanner         !== false,
          showLogo:           d.showLogo           !== false,
          showBannerText:     d.showBannerText     !== false,
          bannerEyebrow:      String(d.bannerEyebrow      || ''),
          bannerTitleMain:    String(d.bannerTitleMain    || ''),
          bannerTitleOutline: String(d.bannerTitleOutline || ''),
        });
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  function set(field, value) { setCfg((p) => ({ ...p, [field]: value })); }

  async function saveAll() {
    setSaving(true);
    try {
      await setDoc(CONFIG_DOC, {
        showBanner:         cfg.showBanner,
        showLogo:           cfg.showLogo,
        showBannerText:     cfg.showBannerText,
        bannerEyebrow:      cfg.bannerEyebrow.trim(),
        bannerTitleMain:    cfg.bannerTitleMain.trim(),
        bannerTitleOutline: cfg.bannerTitleOutline.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { window.alert('Erro: ' + e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="admin-hint">Carregando…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 className="admin-h2" style={{ marginBottom: 4 }}>Personalização</h2>
          <div className="admin-subtitle">Configurações visuais da loja</div>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={saveAll}
          disabled={saving}
          style={{ padding: '8px 20px' }}
        >
          {saving ? 'Salvando…' : saved ? '✓ Salvo' : 'Salvar tudo'}
        </button>
      </div>

      {/* grid 2 colunas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 900 }}>

        {/* banner */}
        <Card title="Banner" visible={cfg.showBanner} onToggleVisible={(v) => set('showBanner', v)}>
          <UploadZone storagePath="loja/banner.jpg" previewAspect="banner" disabled={!cfg.showBanner} />
        </Card>

        {/* logo */}
        <Card title="Logo" visible={cfg.showLogo} onToggleVisible={(v) => set('showLogo', v)}>
          <UploadZone storagePath="loja/logo.png" previewAspect="logo" disabled={!cfg.showLogo} />
        </Card>

        {/* textos do banner — ocupa 2 colunas */}
        <div style={{ gridColumn: '1 / -1' }}>
          <Card title="Textos do banner" visible={cfg.showBannerText} onToggleVisible={(v) => set('showBannerText', v)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <label className="admin-field" style={{ marginBottom: 0 }}>
                <span className="admin-label">Eyebrow</span>
                <input
                  className="admin-input"
                  value={cfg.bannerEyebrow}
                  onChange={(e) => set('bannerEyebrow', e.target.value)}
                  placeholder="Ex: Mind of a Dead Body"
                  disabled={!cfg.showBannerText}
                />
              </label>
              <label className="admin-field" style={{ marginBottom: 0 }}>
                <span className="admin-label">Título principal</span>
                <input
                  className="admin-input"
                  value={cfg.bannerTitleMain}
                  onChange={(e) => set('bannerTitleMain', e.target.value)}
                  placeholder="Ex: LOJA"
                  disabled={!cfg.showBannerText}
                />
              </label>
              <label className="admin-field" style={{ marginBottom: 0 }}>
                <span className="admin-label">Título outline</span>
                <input
                  className="admin-input"
                  value={cfg.bannerTitleOutline}
                  onChange={(e) => set('bannerTitleOutline', e.target.value)}
                  placeholder="Ex: OFICIAL"
                  disabled={!cfg.showBannerText}
                />
              </label>
            </div>

            {/* preview inline */}
            <div style={{
              marginTop: 14,
              background: 'rgba(0,0,0,.5)',
              border: '1px solid rgba(255,255,255,.05)',
              borderRadius: 6,
              padding: '16px',
              textAlign: 'center',
            }}>
              {cfg.bannerEyebrow && (
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 4 }}>
                  {cfg.bannerEyebrow}
                </div>
              )}
              <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>
                {cfg.bannerTitleMain || 'LOJA'}
              </div>
              {cfg.bannerTitleOutline && (
                <div style={{ fontFamily: 'Oswald,sans-serif', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,.35)', lineHeight: 1.2 }}>
                  {cfg.bannerTitleOutline}
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
