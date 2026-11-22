# DocuConvert — Instant Client-Side File Converter

**Live App:** ([https://github.io](https://chakridhar11.github.io/Docuconveter/))

DocuConvert is a 100% browser-based document and image converter. All file parsing, OCR text recognition, table reconstruction, and file generation run locally on your device—**zero files are ever uploaded to a server**.

---

## Features

* **100% Private & Local:** Files stay on your computer or phone; works even on restricted networks using self-hosted libraries.
* **Built-In Scanned PDF OCR:** Automatically detects image-only or scanned PDF pages and extracts text using Tesseract OCR.
* **Structure & Table Preservation:** Reconstructs multi-column tables and headings when converting between PDF, Word, Excel, and PowerPoint.
* **Modern Responsive UI:** Includes Light/Dark mode toggle, animated conversion progress bar, drag-and-drop file upload, and download confirmation prompts.
* **Feedback & Issue Tracking:** Integrated **Raise Token** modal connected directly to GitHub Issues.

---

## Supported Conversions (18 Formats)

| Source Format | Supported Output Formats |
| :--- | :--- |
| **PDF (`.pdf`)** | Word (`.docx`), Excel (`.xlsx`), PowerPoint Slides (`.pptx`) |
| **Word (`.docx`)** | Excel (`.xlsx`), PDF (`.pdf`), PowerPoint Slides (`.pptx`) |
| **Excel (`.xls`, `.xlsx`)** | PDF (`.pdf`), PowerPoint Slides (`.pptx`), Word (`.docx`) |
| **PowerPoint (`.pptx`)** | PDF (`.pdf`), Word (`.docx`), Excel (`.xlsx`) |
| **JPG (`.jpg`, `.jpeg`)** | PNG (`.png`), SVG (`.svg`) |
| **PNG (`.png`)** | JPEG (`.jpeg`), JPG (`.jpg`), WebP (`.webp`), SVG (`.svg`) |

---

## Project Structure

```text
Docuconveter/
├── index.html      # Main UI, Dark Mode toggle, and Raise Token modal
├── styles.css      # Responsive styling, animations, and theme variables
├── app.js          # Client-side parsers, OCR fallback, and file builders
└── libs/           # Self-contained conversion libraries (no external CDN dependency)
```

---

## Run Locally

Because PDF and OCR workers require an HTTP context, serve the folder locally using Python or VS Code Live Server:

```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.
