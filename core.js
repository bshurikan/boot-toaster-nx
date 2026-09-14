/* IPS + Hekate BMP. Based on friedkeenan/switch-logo-patcher (GPL-2.0). */

export const LOGO_W = 308;
export const LOGO_H = 350;
export const SPLASH_W = 1280;
export const SPLASH_H = 720;
export const HEKATE_W = 720;
export const HEKATE_H = 1280;
export const IPS_MAX_RECORD = 0xffff;

export const PATCH_INFO = {
  C79F22F18169FCD3B3698A881394F6240385CDB1: 1668164,
  "01890C643E9D6E17B2CDA77A9749ECB9A4F676D6": 1962240,
  C088ADC91417EBAE6ADBDF3E47946858CAFE1A82: 1962240,
  "3EC573CB22744A993DFE281701E9CBFE66C03ABD": 1716480,
  "7B4123290DE2A6F52DE4AB72BEA1A83D11214C71": 1831168,
  "723DF02F6955D903DF7134105A16D48F06012DB1": 1835264,
  "967F4C3DFC7B165E4F7981373EC1798ACA234A45": 1573120,
  "98446A07BC664573F1578F3745C928D05AB73349": 1589504,
  "0767302E1881700608344A3859BC57013150A375": 1593600,
  "7C5894688EDA24907BC9CE7013630F365B366E4A": 1593600,
  "7421EC6021AC73DD60A635BC2B3AD6FCAE2A6481": 1536256,
  "96529C3226BEE906EE651754C33FE3E24ECAE832": 1544448,
  D689E9FAE7CAA4EC30B0CD9B419779F73ED3F88B: 1655040,
  "65A23B52FCF971400CAA4198656D73867D7F1F1D": 1655040,
  B295D3A8F8ACF88CB0C5CE7C0488CC5511B9C389: 1696000,
  "82EE58BEAB54C1A9D4B3D9ED414E84E31502FAC6": 1708288,
  AFEAACF3E88AB539574689D1458060657E81E088: 1716480,
  "7E9BB552AAEFF82363D1E8C97B5C6B95E3989E1A": 1704192,
  BA15B407573B8CECF0FAE2B367D3103A2A1E821C: 2191616,
  "34D15383767E313EE76F1EE991CD00AD2BF8C62A": 2023680,
  "9D8D6EFEE01E97E95E00D573530C09CB5AB5B8A0": 2031872,
  D94508595598713DD2C3390BD0518C9A748D273F: 2031872,
  B4CC8E35D5011901554107EFC883EEAFC745FBEF: 2007296,
  AFC93F0B66744F3FDE73C02D244B9E309B8738DE: 2007296,
  CBF3505D9F075CD771B1F7A2D7202D2C0D3CEE62: 1990912,
  "9527BE3A3BAAFBFB987A6DE1B62EF4792C01A19E": 1970432,
};

export function prepareCanvas(img, tw, th, mode, background) {
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (background === "black") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, tw, th);
  } else {
    ctx.clearRect(0, 0, tw, th);
  }
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (mode === "stretch" || (iw === tw && ih === th)) {
    ctx.drawImage(img, 0, 0, tw, th);
    return canvas;
  }
  if (mode === "cover") {
    const scale = Math.max(tw / iw, th / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    ctx.drawImage(img, (tw - nw) / 2, (th - nh) / 2, nw, nh);
    return canvas;
  }
  const scale = Math.min(tw / iw, th / ih);
  const nw = Math.max(1, iw * scale);
  const nh = Math.max(1, ih * scale);
  ctx.drawImage(img, (tw - nw) / 2, (th - nh) / 2, nw, nh);
  return canvas;
}

export function canvasRGBA(canvas) {
  return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
}

function recordsFromNewLogo(bytes) {
  const records = [];
  for (let offset = 0; offset < bytes.length; offset += IPS_MAX_RECORD) {
    records.push([offset, bytes.subarray(offset, offset + IPS_MAX_RECORD)]);
  }
  return records;
}

function concatBytes(parts) {
  let total = 0;
  for (const part of parts) total += part.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const part of parts) {
    out.set(part, pos);
    pos += part.length;
  }
  return out;
}

export function buildIps(rgba, extraOffset) {
  const records = recordsFromNewLogo(rgba);
  const parts = [new TextEncoder().encode("PATCH")];
  for (const [offset, data] of records) {
    if (!data.length) continue;
    const head = new Uint8Array(5);
    const abs = offset + extraOffset;
    head[0] = (abs >> 16) & 0xff;
    head[1] = (abs >> 8) & 0xff;
    head[2] = abs & 0xff;
    head[3] = (data.length >> 8) & 0xff;
    head[4] = data.length & 0xff;
    parts.push(head, data);
  }
  parts.push(new TextEncoder().encode("EOF"));
  return concatBytes(parts);
}

export function generatePatches(logoCanvas) {
  const rgba = canvasRGBA(logoCanvas);
  const files = {};
  for (const [buildId, offset] of Object.entries(PATCH_INFO)) {
    files[`atmosphere/exefs_patches/logo/${buildId}.ips`] = buildIps(rgba, offset);
  }
  return files;
}

function rotate90Ccw(src) {
  const dst = document.createElement("canvas");
  dst.width = src.height;
  dst.height = src.width;
  const ctx = dst.getContext("2d");
  ctx.translate(0, dst.height);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  return dst;
}

export function write32bitBmp(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const rgba = canvasRGBA(canvas);
  const pixels = new Uint8Array(width * height * 4);
  let o = 0;
  for (let y = height - 1; y >= 0; y--) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = row + x * 4;
      pixels[o++] = rgba[i + 2];
      pixels[o++] = rgba[i + 1];
      pixels[o++] = rgba[i];
      pixels[o++] = rgba[i + 3];
    }
  }
  const headerSize = 54;
  const fileSize = headerSize + pixels.length;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  bytes[0] = 0x42;
  bytes[1] = 0x4d;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, headerSize, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 32, true);
  view.setUint32(34, pixels.length, true);
  bytes.set(pixels, headerSize);
  return bytes;
}

export function writeHekateBmp(splashCanvas) {
  const opaque = document.createElement("canvas");
  opaque.width = SPLASH_W;
  opaque.height = SPLASH_H;
  const ctx = opaque.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SPLASH_W, SPLASH_H);
  ctx.drawImage(splashCanvas, 0, 0);
  return write32bitBmp(rotate90Ccw(opaque));
}
