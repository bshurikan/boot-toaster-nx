
<div align="center">[https://bshurikan.github.io/boot-toaster-nx/](<img width="512" alt="toaster" src="https://github.com/user-attachments/assets/22c891ff-6b6f-454e-9b0c-a95ec28cf751" />)</div>

# [Boot Toaster NX](https://bshurikan.github.io/boot-toaster-nx/)

Create Nintendo Switch **Atmosphere boot-logo patches** and a **Hekate splash** via the web.

No GitHub account, fork, pull request, or wait. Pick images, click **Create for SD**, copy the folders onto your SD card.

<img width="952" height="1880" alt="image" src="https://github.com/user-attachments/assets/047b0c6f-d61e-4d61-a0da-6a38b42bf11d" />

This is a local companion to [RobZilla10001's Automatic BootLogo Creator](https://gbatemp.net/threads/automatic-bootlogo-creator.684230/). The IPS math comes from [friedkeenan/switch-logo-patcher](https://github.com/friedkeenan/switch-logo-patcher).

## What you need

- A modded Switch running Atmosphere / Hekate
- Any image (PNG, JPG, WebP, BMP). Size is fitted for you

The window shows two 16:9 boot previews:

| Order | Screen | What it replaces | SD path |
|---|---|---|---|
| 1 | Hekate splash | First screen if you boot through Hekate | `bootloader/bootlogo.bmp` |
| 2 | Atmosphère triangle | Small stock AMS mark. Needs a rebuild of Atmosphère | not an SD drop-in |
| 3 | Switch logo | Nintendo logo during Horizon boot | `atmosphere/exefs_patches/logo/*.ips` |

Until you pick an image, each side shows a layout placeholder. **That side is not exported.** Nintendo's official logo is not included (trademark). Placeholders are preview-only.

If you boot through Hekate `pkg3`/`fss0` (the usual setup), the full-screen Atmosphère/fusee splash never appears. The stock triangle still does - that is baked into `boot.kip` and cannot be replaced with an SD drop-in.

For the full boot-order writeup, see [binkinator's Splash Screens blog](https://gbatemp.net/blogs/splash-screens.19288/). The app footer link **Boot screens explained** opens the same page.

## Use it

1. Run the latest [LocalBootLogoCreator.exe](https://github.com/bshurikan/local-bootlogo-creator/releases/)
2. Click a preview (or **Choose image**) on one or both sides
3. Click **Create for SD**
4. Copy the output folders onto the SD card (merge)
5. For the Hekate splash, edit `sd:/bootloader/hekate_ipl.ini` (see **INSTRUCTIONS** on the splash card):
