const PDF_WORKER_URL = './libs/pdf.worker.min.js';
const OCR_WORKER_URL = './libs/tesseract.worker.min.js';

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
}

const tools = {
  pdf: {
    title: "PDF Converter",
    sub: "Convert PDF documents (including scanned PDFs) to Word, Excel, or Slides.",
    accept: ".pdf",
    hint: "Accepted format: .pdf",
    options: [
      { val: "docx", label: "Word (.docx)" },
      { val: "xlsx", label: "Excel (.xlsx)" },
      { val: "pptx", label: "Slides (.pptx)" }
    ]
  },
  word: {
    title: "Word Converter",
    sub: "Convert Word (.docx) to Excel, PDF, or Slides.",
    accept: ".docx",
    hint: "Accepted format: .docx",
    options: [
      { val: "xlsx", label: "Excel (.xlsx)" },
      { val: "pdf", label: "PDF (.pdf)" },
      { val: "pptx", label: "Slides (.pptx)" }
    ]
  },
  excel: {
    title: "Excel Converter",
    sub: "Convert Excel (.xls, .xlsx) to PDF, Slides, or Word.",
    accept: ".xls,.xlsx",
    hint: "Accepted formats: .xls, .xlsx",
    options: [
      { val: "pdf", label: "PDF (.pdf)" },
      { val: "pptx", label: "Slides (.pptx)" },
      { val: "docx", label: "Word (.docx)" }
    ]
  },
  slide: {
    title: "PowerPoint Slide Converter",
    sub: "Convert Slides (.pptx) to PDF, Word, or Excel.",
    accept: ".pptx",
    hint: "Accepted format: .pptx",
    options: [
      { val: "pdf", label: "PDF (.pdf)" },
      { val: "docx", label: "Word (.docx)" },
      { val: "xlsx", label: "Excel (.xlsx)" }
    ]
  },
  jpg: {
    title: "JPG Image Converter",
    sub: "Convert JPG images to PNG or SVG.",
    accept: ".jpg,.jpeg",
    hint: "Accepted formats: .jpg, .jpeg",
    options: [
      { val: "png", label: "PNG (.png)" },
      { val: "svg", label: "SVG (.svg)" }
    ]
  },
  png: {
    title: "PNG Image Converter",
    sub: "Convert PNG images to JPEG, JPG, WebP, or SVG.",
    accept: ".png",
    hint: "Accepted format: .png",
    options: [
      { val: "jpeg", label: "JPEG (.jpeg)" },
      { val: "jpg", label: "JPG (.jpg)" },
      { val: "webp", label: "WebP (.webp)" },
      { val: "svg", label: "SVG (.svg)" }
    ]
  }
};

const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const fileBadge = document.getElementById('selected-file-name');
const statusBox = document.getElementById('status-box');
const convertBtn = document.getElementById('convert-btn');

function showStatus(msg, isError = false) {
  statusBox.textContent = msg;
  statusBox.className = isError ? 'alert alert-error' : 'alert alert-success';
  statusBox.style.display = 'block';
}

function updateProgress(percent, label = "") {
  const wrapper = document.getElementById('progress-wrapper');
  const fill = document.getElementById('progress-fill');
  const pctText = document.getElementById('progress-percent');
  const lblText = document.getElementById('progress-label');

  if (percent === null) {
    wrapper.style.display = 'none';
    fill.style.width = '0%';
    return;
  }

  wrapper.style.display = 'block';
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  fill.style.width = `${clamped}%`;
  pctText.textContent = `${clamped}%`;
  if (label) lblText.textContent = label;
}


function selectTool(key, cardEl) {
  document.querySelectorAll('.tool-card').forEach(c => c.classList.remove('active'));
  cardEl.classList.add('active');

  const config = tools[key];
  document.getElementById('converter-heading').textContent = config.title;
  document.getElementById('converter-sub').textContent = config.sub;
  document.getElementById('source_type').value = key;
  document.getElementById('file-hint').textContent = config.hint;

  fileInput.value = "";
  fileInput.accept = config.accept;
  fileBadge.style.display = "none";
  statusBox.style.display = "none";

  const pillsContainer = document.getElementById('format-pills');
  pillsContainer.innerHTML = config.options
    .map((opt, idx) => `<button type="button" class="format-pill ${idx === 0 ? 'active' : ''}" data-val="${opt.val}" onclick="selectFormat(this)">${opt.label}</button>`)
    .join('');

  document.getElementById('target_format').value = config.options.at(0).val;
}

function selectFormat(btn) {
  document.querySelectorAll('.format-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('target_format').value = btn.getAttribute('data-val');
}

function updateFileName(file) {
  if (file) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    fileBadge.textContent = `Selected: ${file.name} (${sizeMB} MB)`;
    fileBadge.style.display = "inline-block";
    statusBox.style.display = "none";
  }
}

fileInput.addEventListener('change', (e) => updateFileName(e.target.files.item(0)));

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    updateFileName(e.dataTransfer.files.item(0));
  }
});
async function confirmAndDownload(blob, filename) {
  const sizeKB = (blob.size / 1024).toFixed(1);
  const sizeText = blob.size >= 1024 * 1024
    ? `${(blob.size / (1024 * 1024)).toFixed(2)} MB`
    : `${sizeKB} KB`;

  const modal = document.getElementById('download-modal');
  document.getElementById('dl-modal-info').textContent = `${filename} (${sizeText}) is ready.`;
  modal.showModal();

  const isConfirmed = await new Promise((resolve) => {
    const finish = (result) => { modal.close(); resolve(result); };
    document.getElementById('dl-confirm-btn').onclick = () => finish(true);
    document.getElementById('dl-cancel-btn').onclick = () => finish(false);
    modal.oncancel = () => resolve(false);
  });

  if (!isConfirmed) {
    showStatus(`Download canceled for ${filename}.`, true);
    return false;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}


async function runPageOCR(page, pageNum, totalPages, basePct, stepPct) {
  if (!window.Tesseract) return "(Scanned Page - OCR library missing)";
  updateProgress(basePct, `Scanning page ${pageNum} of ${totalPages} (OCR)...`);

  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');

  await page.render({ canvasContext: ctx, viewport }).promise;

  // Convert relative paths to full absolute URLs for Web Workers
  const fullWorkerUrl = new URL('./libs/tesseract.worker.min.js', window.location.href).href;
  const fullCoreUrl = new URL('./libs/tesseract-core-simd.wasm.js', window.location.href).href;

  const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
    workerPath: fullWorkerUrl,
    corePath: fullCoreUrl,
    workerBlobURL: false,
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const subPct = basePct + (m.progress * stepPct);
        updateProgress(subPct, `Recognizing text on page ${pageNum} of ${totalPages}...`);
      }
    }
  });

  canvas.width = 0;
  canvas.height = 0;
  return text.trim() || "(No readable text found on scanned page)";
}



async function extractSections(file, sourceType) {
  const buffer = await file.arrayBuffer();

  // 1. PDF Extraction (Coordinate Line/Table Detection + OCR Fallback)
  if (sourceType === 'pdf') {
    if (!window.pdfjsLib) throw new Error("PDF library failed to load.");
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const stepPct = 65 / pdf.numPages;
      const currentPct = 15 + ((i - 1) * stepPct);
      updateProgress(currentPct, `Extracting page ${i} of ${pdf.numPages}...`);

      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const linesMap = new Map();
      content.items.forEach(item => {
        if (!item.str || !item.str.trim()) return;
        const y = Math.round(item.transform.at(5) / 5) * 5;
        const x = item.transform.at(4);
        if (!linesMap.has(y)) linesMap.set(y, []);
        linesMap.get(y).push({ x, str: item.str, width: item.width || (item.str.length * 4) });
      });

      const sortedYs = Array.from(linesMap.keys()).sort((a, b) => b - a);
      const pageLines = sortedYs.map(y => {
        const rowItems = linesMap.get(y).sort((a, b) => a.x - b.x);
        let lineText = "";
        let lastEndX = null;

        rowItems.forEach(item => {
          if (lastEndX !== null) {
            const gap = item.x - lastEndX;
            if (gap > 20) lineText += " | ";
            else if (gap > 2) lineText += " ";
          }
          lineText += item.str;
          lastEndX = item.x + item.width;
        });
        return lineText.trim();
      }).filter(Boolean);

      if (pageLines.length > 0) {
        pages.push(pageLines.join('\n'));
      } else {
        const ocrText = await runPageOCR(page, i, pdf.numPages, currentPct, stepPct);

      }
    }
    return pages.length ? pages : ["(Empty PDF)"];
  }

  // 2. WORD (.docx) Extraction
  if (sourceType === 'word') {
    if (!window.mammoth) throw new Error("Word reader library failed to load.");
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value, "text/html");
    const blocks = [];

    doc.body.childNodes.forEach(node => {
      if (node.nodeName === 'TABLE') {
        const rows = Array.from(node.querySelectorAll('tr')).map(tr =>
          Array.from(tr.querySelectorAll('td, th'))
            .map(cell => cell.textContent.trim().replace(/\s+/g, ' '))
            .join(' | ')
        );
        if (rows.length) blocks.push(rows.join('\n'));
      } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        const items = Array.from(node.querySelectorAll('li'))
          .map((li, idx) => `${node.nodeName === 'OL' ? `${idx + 1}.` : '-'} ${li.textContent.trim()}`);
        if (items.length) blocks.push(items.join('\n'));
      } else if (/^H[1-6]$/.test(node.nodeName) && node.textContent.trim()) {
        blocks.push(`# ${node.textContent.trim()}`);
      } else if (node.textContent && node.textContent.trim()) {
        blocks.push(node.textContent.trim());
      }
    });

    return blocks.length ? blocks : ["(Empty Word Document)"];
  }

  // 3. EXCEL (.xls, .xlsx) Extraction
  if (sourceType === 'excel') {
    if (!window.XLSX) throw new Error("Excel library failed to load.");
    const wb = XLSX.read(buffer, { type: 'array' });
    const sections = [];
    wb.SheetNames.forEach(name => {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
      const cleanRows = rows
        .filter(r => r.some(cell => String(cell).trim() !== ""))
        .map(r => r.map(cell => String(cell).trim()).join(' | '));
      if (cleanRows.length) {
        sections.push(`[Sheet: ${name}]\n` + cleanRows.join('\n'));
      }
    });
    return sections.length ? sections : ["(Empty Spreadsheet)"];
  }

  // 4. POWERPOINT (.pptx) Extraction
  if (sourceType === 'slide') {
    if (!window.JSZip) throw new Error("Slide reader library failed to load.");
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => parseInt(a.match(/\d+/).at(0), 10) - parseInt(b.match(/\d+/).at(0), 10));

    const parser = new DOMParser();
    const slides = [];
    for (const path of slideFiles) {
      const xml = await zip.files[path].async('text');
      const xmlDoc = parser.parseFromString(xml, "text/xml");
      const paragraphs = Array.from(xmlDoc.getElementsByTagName("a:p"));
      const pTexts = paragraphs.map(p =>
        Array.from(p.getElementsByTagName("a:t")).map(t => t.textContent).join('')
      ).filter(t => t.trim());

      if (pTexts.length) slides.push(pTexts.join('\n'));
    }
    return slides.length ? slides : ["(Empty Presentation)"];
  }
}
async function convertImage(file, targetFmt) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (targetFmt === 'svg') {
          const svg = `<svg xmlns="http://w3.org" width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}"><image href="${e.target.result}" width="${img.width}" height="${img.height}"/></svg>`;

          return resolve(new Blob([svg], { type: 'image/svg+xml' }));
        }

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (targetFmt === 'jpg' || targetFmt === 'jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        const mime = targetFmt === 'png' ? 'image/png' : targetFmt === 'webp' ? 'image/webp' : 'image/jpeg';

        canvas.toBlob((blob) => {
          canvas.width = 0;
          canvas.height = 0;
          if (!blob) return reject(new Error("Browser failed to encode image."));
          resolve(blob);
        }, mime, 0.96);
      };
      img.onerror = () => reject(new Error("Could not read image file."));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read uploaded file."));
    reader.readAsDataURL(file);
  });
}

function chunkLinesForSlides(text, maxChars = 850) {
  const lines = text.split('\n');
  const chunks = [];
  let current = [];
  let count = 0;

  lines.forEach(line => {
    if (count + line.length > maxChars && current.length > 0) {
      chunks.push(current.join('\n'));
      current = [line];
      count = line.length;
    } else {
      current.push(line);
      count += line.length;
    }
  });
  if (current.length) chunks.push(current.join('\n'));
  return chunks;
}

document.getElementById('convert-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = fileInput.files.item(0);
  if (!file) return showStatus("Please select a file first.", true);

  const sourceType = document.getElementById('source_type').value;
  const targetFmt = document.getElementById('target_format').value;
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const outName = `${baseName}.${targetFmt}`;

  convertBtn.disabled = true;
  convertBtn.textContent = "Converting...";
  statusBox.style.display = "none";
  updateProgress(10, "Reading uploaded file...");

  try {
    let outputBlob = null;

    if (sourceType === 'jpg' || sourceType === 'png') {
      updateProgress(50, `Converting image to ${targetFmt.toUpperCase()}...`);
      outputBlob = await convertImage(file, targetFmt);
    } else {
      const sections = await extractSections(file, sourceType);
      updateProgress(85, `Building ${targetFmt.toUpperCase()} file...`);


      // 1. PDF OUTPUT (Renders clean tables, headings, and wrapped paragraphs)
      if (targetFmt === 'pdf') {
        if (!window.jspdf) throw new Error("PDF generator failed to load.");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = 180;
        let y = 18;

        sections.forEach((sec, sIdx) => {
          if (sIdx > 0 && y > 240) {
            doc.addPage();
            y = 18;
          }

          sec.split('\n').forEach(rawLine => {
            const cleanLine = rawLine.replace(/[^\x20-\x7E]/g, ' ').trim();
            if (!cleanLine) return;

            if (cleanLine.includes('|')) {
              const cells = cleanLine.split('|').map(c => c.trim());
              const colW = pageWidth / cells.length;
              const cellLines = cells.map(c => doc.splitTextToSize(c, colW - 3));
              const maxLines = Math.max(...cellLines.map(l => l.length));
              const rowH = Math.max(7, maxLines * 5 + 2);

              if (y + rowH > 282) {
                doc.addPage();
                y = 18;
              }

              doc.setFont("helvetica", "normal");
              doc.setFontSize(9);
              cells.forEach((_, idx) => {
                const x = 15 + idx * colW;
                doc.rect(x, y - 4, colW, rowH);
                doc.text(cellLines.at(idx), x + 1.5, y);
              });
              y += rowH;
            } else {
              const isHeading = cleanLine.startsWith('# ') || cleanLine.startsWith('[Sheet:');
              const displayText = cleanLine.replace(/^#\s+/, '').replace(/^\[|\]$/g, '');
              doc.setFont("helvetica", isHeading ? "bold" : "normal");
              doc.setFontSize(isHeading ? 12 : 10);

              const wrapped = doc.splitTextToSize(displayText, pageWidth);
              wrapped.forEach(line => {
                if (y > 280) {
                  doc.addPage();
                  y = 18;
                }
                doc.text(line, 15, y);
                y += isHeading ? 7 : 5.5;
              });
            }
          });
          y += 5;
        });
        outputBlob = doc.output('blob');

      // 2. EXCEL OUTPUT (Auto-sized columns & multi-sheet support)
      } else if (targetFmt === 'xlsx') {
        if (!window.XLSX) throw new Error("Excel generator failed to load.");
        const wb = XLSX.utils.book_new();

        sections.forEach((sec, idx) => {
          const lines = sec.split('\n');
          let sheetName = `Page_${idx + 1}`;
          if (lines.at(0) && lines.at(0).startsWith('[Sheet:')) {
            sheetName = lines.at(0).replace('[Sheet:', '').replace(']', '').trim().slice(0, 31);
            lines.shift();
          }

          const rows = lines.map(line =>
            line.includes('|') ? line.split('|').map(c => c.trim()) : [line.trim()]
          );

          const ws = XLSX.utils.aoa_to_sheet(rows);
          const colWidths = [];
          rows.forEach(r => r.forEach((val, cIdx) => {
            const len = String(val).length + 4;
            colWidths[cIdx] = Math.min(50, Math.max(colWidths[cIdx] || 12, len));
          }));
          ws['!cols'] = colWidths.map(w => ({ wch: w }));

          XLSX.utils.book_append_sheet(wb, ws, sheetName || `Sheet_${idx + 1}`);
        });

        const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        outputBlob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        // 3. WORD (.docx) OUTPUT (True tables + headings)
      } else if (targetFmt === 'docx') {
        if (!window.docx) throw new Error("Word generator failed to load.");
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel } = window.docx;
        const docChildren = [];

        sections.forEach((sec, sIdx) => {
          const lines = sec.split('\n');
          let tableBuffer = [];

          const flushTable = () => {
            if (!tableBuffer.length) return;
            const maxCols = Math.max(...tableBuffer.map(r => r.length));
            const tableRows = tableBuffer.map((cells, rIdx) => {
              const padded = [...cells];
              while (padded.length < maxCols) padded.push("");
              return new TableRow({
                children: padded.map(cellText => new TableCell({
                  width: { size: Math.floor(100 / maxCols), type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: cellText, bold: rIdx === 0 })]
                }))
              });
            });
            docChildren.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            docChildren.push(new Paragraph(""));
            tableBuffer = [];
          };

          lines.forEach(line => {
            if (line.startsWith('[Sheet:') || line.startsWith('# ')) {
              flushTable();
              docChildren.push(new Paragraph({
                text: line.replace(/^#\s+/, '').replace(/\[|\]/g, ''),
                heading: HeadingLevel.HEADING_2
              }));
            } else if (line.includes('|')) {
              tableBuffer.push(line.split('|').map(c => c.trim()));
            } else {
              flushTable();
              docChildren.push(new Paragraph(line));
            }
          });
          flushTable();
          if (sIdx < sections.length - 1) docChildren.push(new Paragraph(""));
        });

        const doc = new Document({ sections: [{ children: docChildren }] });
        outputBlob = await Packer.toBlob(doc);

      // 4. POWERPOINT (.pptx) OUTPUT (Native tables + auto-paginated slides)
      } else if (targetFmt === 'pptx') {
        if (!window.PptxGenJS) throw new Error("PowerPoint generator failed to load.");
        const pptx = new PptxGenJS();
        let slideCounter = 1;

        sections.forEach(sec => {
          const chunks = chunkLinesForSlides(sec, 850);
          chunks.forEach(chunk => {
            const slide = pptx.addSlide();
            slide.addText(`Slide ${slideCounter++}`, { x: 0.5, y: 0.3, w: 9, h: 0.45, fontSize: 18, bold: true, color: "1E293B" });

            const lines = chunk.split('\n');
            const isTable = lines.filter(l => l.includes('|')).length >= 2;

            if (isTable) {
              const tableRows = lines.map((l, rIdx) => {
                const cells = l.includes('|') ? l.split('|').map(c => c.trim()) : [l.trim()];
                return cells.map(text => ({
                  text,
                  options: { fontSize: 10, bold: rIdx === 0, fill: rIdx === 0 ? "E2E8F0" : "FFFFFF" }
                }));
              });
              slide.addTable(tableRows, { x: 0.5, y: 0.9, w: 9, border: { pt: 0.5, color: "CBD5E1" } });
            } else {
              slide.addText(chunk, {
                x: 0.5, y: 0.9, w: 9, h: 4.4,
                fontSize: 12, color: "334155", valign: "top", breakLine: true
              });
            }
          });
        });

        outputBlob = await pptx.write({ outputType: 'blob' });
      }
    }

    updateProgress(100, "Conversion complete!");
    if (outputBlob && await confirmAndDownload(outputBlob, outName)) {
      showStatus(`Converted successfully! Downloading ${outName}`);
    }
  } catch (err) {
    console.error("Conversion error:", err);
    const reason = err?.message || (typeof err === 'string' ? err : 'Worker or library blocked. Check Console (F12).');
    showStatus(`Conversion failed: ${reason}`, true);
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = "Convert & Download File";
    setTimeout(() => updateProgress(null), 1200);
  }

});
