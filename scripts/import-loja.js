/**
 * Importa os dados da loja para o Firestore.
 * 
 * Uso:
 *   node scripts/import-loja.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// ── configuração ──────────────────────────────────────────────────────────────

const SERVICE_KEY_PATH = path.resolve(__dirname, '../firebase-service-key.json');
const EXPORT_PATH      = path.resolve(__dirname, '../loja-export-1778135254019.json');
const DOC_PATH         = { collection: 'siteData', docId: 'moadb_shop' };

// ── init ──────────────────────────────────────────────────────────────────────

const serviceKey = JSON.parse(fs.readFileSync(SERVICE_KEY_PATH, 'utf8'));

initializeApp({ credential: cert(serviceKey) });

const db = getFirestore();

// ── importar ──────────────────────────────────────────────────────────────────

async function run() {
  const raw = JSON.parse(fs.readFileSync(EXPORT_PATH, 'utf8'));

  const items = (raw.items || []).map((it) => ({
    id:          String(it.id || ''),
    title:       String(it.title || ''),
    descricao:   String(it.descricao || ''),
    url:         String(it.url || ''),
    imageUrl:    Array.isArray(it.images) && it.images[0] ? String(it.images[0]) : '',
    images:      Array.isArray(it.images) ? it.images.map(String).filter(Boolean) : [],
    bgColor:     String(it.bgColor || '#070707'),
    categoria:   String(it.categoria || ''),
    subcategoria:String(it.subcategoria || ''),
    cor:         String(it.cor || ''),
    printSide:   String(it.printSide || ''),
    printType:   String(it.printType || ''),
    printSize:   String(it.printSize || ''),
    printSizes: {
      frente: String(it.printSizes?.frente || ''),
      costas: String(it.printSizes?.costas || ''),
      ladoD:  String(it.printSizes?.ladoD  || ''),
      ladoE:  String(it.printSizes?.ladoE  || ''),
    },
    preco:         String(it.preco || ''),
    destaque:      it.destaque === true,
    edicaoEspecial:it.edicaoEspecial === true,
  }));

  const payload = {
    content: {
      storeUrl: String(raw.storeUrl || ''),
      items,
    },
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db
    .collection(DOC_PATH.collection)
    .doc(DOC_PATH.docId)
    .set(payload, { merge: true });

  console.log(`✓ ${items.length} produtos importados para ${DOC_PATH.collection}/${DOC_PATH.docId}`);
}

run().catch((err) => {
  console.error('Erro na importação:', err);
  process.exit(1);
});
