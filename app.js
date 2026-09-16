import {
  LOGO_W,
  LOGO_H,
  SPLASH_W,
  SPLASH_H,
  prepareCanvas,
  generatePatches,
  writeHekateBmp,
} from "./core.js";
import { buildZip, downloadBytes } from "./zip.js";
import "./bg.js";

const PLACEHOLDERS = {
  logo: "./assets/badpeach.png",
  splash: "./assets/atmosphere_splash.png",
};

const HELP = {
  logo: `
    <p>Copy this folder onto the root of your SD card, then reboot:</p>
    <pre>atmosphere/exefs_patches/logo/</pre>`,
  splash: `
    <p>1. Copy this file onto the root of your SD card:</p>
    <pre>bootloader/bootlogo.bmp</pre>
    <p>2. Edit sd:/bootloader/hekate_ipl.ini</p>
    <p>Under [config]:</p>
    <pre>[config]
bootwait=3</pre>
    <p>Under [CFW - emuMMC]:</p>
    <pre>[CFW - emuMMC]
logopath=bootloader/bootlogo.bmp</pre>
    <p>bootwait=0 hides the splash. Reboot through Hekate.</p>`,
};

const state = {
  logo: { img: null, file: null, mode: "contain", custom: false },
  splash: { img: null, file: null, mode: "cover", custom: false },
  pickTarget: "logo",
};

const fileInput = document.getElementById("file");
const helpDialog = document.getElementById("help");
const helpBody = document.getElementById("help-body");
const statusEl = document.getElementById("status");

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function fitted(kind) {
  const side = state[kind];
  if (kind === "logo") return prepareCanvas(side.img, LOGO_W, LOGO_H, side.mode, "transparent");
  return prepareCanvas(side.img, SPLASH_W, SPLASH_H, side.mode, "black");
}

function paintPreview(kind) {
  const src = fitted(kind);
  const canvas = document.getElementById(`${kind}-preview`);
  const cssW = Math.max(1, canvas.clientWidth || canvas.parentElement.clientWidth);
  const cssH = Math.max(1, Math.round((cssW * 9) / 16));
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = kind === "logo" ? "#000000" : "#25262b";
  ctx.fillRect(0, 0, cssW, cssH);
  if (kind === "logo") {
    const lw = (LOGO_W / SPLASH_W) * cssW;
    const lh = (LOGO_H / SPLASH_H) * cssH;
    ctx.drawImage(src, (cssW - lw) / 2, (cssH - lh) / 2, lw, lh);
  } else {
    ctx.drawImage(src, 0, 0, cssW, cssH);
  }
}

function updateStatus() {
  const parts = [];
  if (state.logo.custom) parts.push("Switch logo");
  if (state.splash.custom) parts.push("Hekate splash");
  statusEl.textContent = parts.length
    ? "Will export: " + parts.join("  ·  ")
    : "Set images above, then Create for SD.";
}

async function reset(kind) {
  state[kind].img = await loadImage(PLACEHOLDERS[kind]);
  state[kind].file = null;
  state[kind].custom = false;
  document.getElementById(`${kind}-file`).textContent =
    "Drop an image or tap to browse";
  requestAnimationFrame(() => paintPreview(kind));
  updateStatus();
}

async function setCustom(kind, file) {
  const url = URL.createObjectURL(file);
  try {
    state[kind].img = await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  state[kind].file = file;
  state[kind].custom = true;
  document.getElementById(`${kind}-file`).textContent = file.name;
  requestAnimationFrame(() => paintPreview(kind));
  updateStatus();
}

function pick(kind) {
  state.pickTarget = kind;
  fileInput.value = "";
  fileInput.click();
}

document.querySelectorAll("[data-pick]").forEach((el) => {
  el.addEventListener("click", () => pick(el.getAttribute("data-pick")));
});
document.querySelectorAll("[data-reset]").forEach((el) => {
  el.addEventListener("click", () => reset(el.getAttribute("data-reset")));
});
document.querySelectorAll("[data-help]").forEach((el) => {
  el.addEventListener("click", () => {
    helpBody.innerHTML = HELP[el.getAttribute("data-help")];
    helpDialog.showModal();
  });
});
document.getElementById("help-close").addEventListener("click", () => helpDialog.close());
document.querySelectorAll(".switch-focus-ring").forEach((el) => {
  el.addEventListener("pointerup", (ev) => {
    if (ev.pointerType !== "keyboard") el.blur();
  });
});

document.querySelectorAll(".seg").forEach((seg) => {
  const kind = seg.getAttribute("data-fit");
  seg.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state[kind].mode = btn.getAttribute("data-mode");
      seg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));
      paintPreview(kind);
    });
  });
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files && fileInput.files[0];
  if (file) setCustom(state.pickTarget, file);
});

document.querySelectorAll(".drop").forEach((el) => {
  const kind = el.getAttribute("data-pick");
  el.addEventListener("dragover", (ev) => {
    ev.preventDefault();
    el.classList.add("drag");
  });
  el.addEventListener("dragleave", () => el.classList.remove("drag"));
  el.addEventListener("drop", (ev) => {
    ev.preventDefault();
    el.classList.remove("drag");
    const file = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setCustom(kind, file);
  });
});

document.getElementById("create").addEventListener("click", async () => {
  if (!state.logo.custom && !state.splash.custom) {
    alert("Choose a Switch logo, a Hekate splash, or both.");
    return;
  }
  statusEl.textContent = "Building zip…";
  try {
    const files = {};
    const notes = [
      "Copy these folders onto the root of your Switch SD card (merge), then reboot.",
      "",
    ];
    if (state.logo.custom) {
      Object.assign(files, generatePatches(fitted("logo")));
      notes.push("atmosphere/exefs_patches/logo/");
    }
    if (state.splash.custom) {
      files["bootloader/bootlogo.bmp"] = writeHekateBmp(fitted("splash"));
      notes.push("bootloader/bootlogo.bmp");
      notes.push("");
      notes.push("Edit sd:/bootloader/hekate_ipl.ini:");
      notes.push("");
      notes.push("[config]");
      notes.push("bootwait=3");
      notes.push("");
      notes.push("[CFW - emuMMC]");
      notes.push("logopath=bootloader/bootlogo.bmp");
    }
    notes.push("");
    notes.push("Nintendo's official logo is not bundled with this tool.");
    files["COPY_TO_SD.txt"] = new TextEncoder().encode(notes.join("\n") + "\n");
    const zip = await buildZip(files);
    const stem = (state.logo.file || state.splash.file).name.replace(/\.[^.]+$/, "") || "bootlogo";
    downloadBytes(zip, `${stem}-sd.zip`);
    statusEl.textContent =
      "Downloaded " + Object.keys(files).filter((n) => n !== "COPY_TO_SD.txt").length + " files in the zip.";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Could not create files.";
    alert(err.message || String(err));
  }
});

window.addEventListener("resize", () => {
  if (state.logo.img) paintPreview("logo");
  if (state.splash.img) paintPreview("splash");
});

await reset("logo");
await reset("splash");
