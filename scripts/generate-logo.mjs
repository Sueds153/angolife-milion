import sharp from 'sharp';
import path from 'node:path';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve('C:/Users/Pagora/OneDrive/Desktop/Resolve AO/sem fundo.png');
const PUBLIC = path.join(ROOT, 'public');
const ASSETS = path.join(ROOT, 'assets');

const BG = { r: 15, g: 23, b: 42, alpha: 1 }; // #0F172A (manifest background_color)

// O corte original ficou com o corpo do logo em alpha ~224 (88% opaco).
// Normalizamos: alpha * 255/224 (clamp 255) para o logo sair 100% opaco,
// mantendo os cantos totalmente transparentes (alpha 0 -> 0).
const { data: srcRaw, info: srcInfo } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < srcInfo.width * srcInfo.height; i++) {
  const a = srcRaw[i * 4 + 3];
  srcRaw[i * 4 + 3] = Math.min(255, Math.round((a * 255) / 224));
}

const source = sharp(srcRaw, {
  raw: { width: srcInfo.width, height: srcInfo.height, channels: 4 },
});

async function plain(size, out, opts = {}) {
  await source
    .clone()
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, ...opts })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(PUBLIC, out));
  return out;
}

async function onSolid(size, scale, out, dir = PUBLIC) {
  const logoSize = Math.round(size * scale);
  const logo = await source
    .clone()
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, out));
  return out;
}

async function capacitorIcons() {
  const SIZE = 1024;
  // icon-only: logo limpo, sem fundo
  await source
    .clone()
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS, 'icon-only.png'));

  // foreground: logo a 60% (zona segura do adaptive icon)
  const fgLogo = await source
    .clone()
    .resize(Math.round(SIZE * 0.6), Math.round(SIZE * 0.6), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fgLogo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS, 'icon-foreground.png'));

  // background: cor sólida da marca
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: BG } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS, 'icon-background.png'));

  // splash: logo centrado em fundo escuro
  const SPLASH = 2732;
  const splashLogo = await source
    .clone()
    .resize(Math.round(SPLASH * 0.22), Math.round(SPLASH * 0.22), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: SPLASH, height: SPLASH, channels: 4, background: BG } })
    .composite([{ input: splashLogo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS, 'splash.png'));
}

const jobs = [
  ['logo.png', () => plain(512, 'logo.png')],
  ['logo-small.png', () => plain(128, 'logo-small.png')],
  ['favicon-32.png', () => plain(32, 'favicon-32.png')],
  ['favicon-16.png', () => plain(16, 'favicon-16.png')],
  ['icon-192.png', () => plain(192, 'icon-192.png')],
  ['icon-512.png', () => plain(512, 'icon-512.png')],
  ['icon-maskable-192.png', () => onSolid(192, 0.6, 'icon-maskable-192.png')],
  ['icon-maskable-512.png', () => onSolid(512, 0.6, 'icon-maskable-512.png')],
  ['apple-touch-icon.png', () => onSolid(180, 0.72, 'apple-touch-icon.png')],
];

for (const [name, fn] of jobs) {
  await fn();
  const file = path.join(PUBLIC, name);
  const { width } = await sharp(file).metadata();
  const { size: bytes } = await stat(file);
  console.log(`public/${name.padEnd(24)} ${String(width).padStart(5)}px  ${(bytes / 1024).toFixed(1)} KB`);
}

await capacitorIcons();
for (const f of ['icon-only.png', 'icon-foreground.png', 'icon-background.png', 'splash.png']) {
  const { size: bytes } = await stat(path.join(ASSETS, f));
  console.log(`assets/${f.padEnd(24)}      ${(bytes / 1024).toFixed(1)} KB`);
}

console.log('\nConcluído.');
