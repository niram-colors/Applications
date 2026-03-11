# Image Text Copy (Local OCR)

A standalone web application that extracts text from images directly in the browser.

## Why this matches your requirement

- No upload flow: users can drag/drop, pick a local file, paste an image from clipboard, or capture screen directly.
- No storage: OCR happens locally in the browser via `tesseract.js` and WebAssembly.
- Easy to distribute: host these static files as a website, package in a desktop wrapper, or run locally.

## Keyboard activation

- `Ctrl/Cmd + Shift + S` → open screen capture and load image
- `Ctrl/Cmd + Enter` → run OCR extraction
- `Ctrl/Cmd + Shift + C` → copy extracted text

If your OS copies **Print Screen** screenshots to clipboard, press `PrtSc` and then `Ctrl/Cmd + V` in the app to use that image.

## Run locally (recommended)

Use the safe local server that blocks hidden folders like `.git`:

```bash
python3 secure_server.py
```

Then open exactly:

```text
http://localhost:4173/
```

> If you open `http://localhost:4173/.git/`, you will now get **403 Forbidden** by design.

## Windows quick steps

1. Open PowerShell in the project folder.
2. Run:
   ```powershell
   py secure_server.py
   ```
3. Open `http://localhost:4173/`.

## Files

- `index.html` - app UI
- `styles.css` - styling
- `script.js` - OCR + keyboard shortcut + clipboard logic
- `secure_server.py` - safer local static server (blocks hidden paths)
