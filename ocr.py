"""
ALL-IN-ONE: Medical Report OCR (Image or Scanned PDF) using PaddleOCR + PyMuPDF (fitz)
- Input: .pdf / .png / .jpg / .jpeg
- Output: JSON with (1) full text (2) OCR lines with boxes+confidence (3) grouped table-like rows
- Uses PyMuPDF instead of pdf2image (so NO Poppler needed)

Install (CPU):
  pip install paddleocr opencv-python pillow pymupdf

IMPORTANT:
  PaddlePaddle must be installed with a Python version it supports (typically 3.8–3.10).
  Example:
    pip install paddlepaddle==2.6.2
"""

import os
import json
import argparse
from typing import List, Dict, Any, Tuple

import cv2
import fitz  # PyMuPDF
from paddleocr import PaddleOCR


def preprocess_image_cv2(img_bgr):
    """Preprocess to improve OCR on lab reports."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    thr = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 35, 11
    )
    return thr


def save_preprocessed_image(in_path: str, out_path: str) -> str:
    img = cv2.imread(in_path)
    if img is None:
        raise FileNotFoundError(f"Could not read image: {in_path}")
    pre = preprocess_image_cv2(img)
    cv2.imwrite(out_path, pre)
    return out_path


def pdf_to_images_fitz(pdf_path: str, out_dir: str, zoom: float = 2.0) -> List[str]:
    """
    Render PDF pages to images using PyMuPDF.
    zoom=2.0 roughly corresponds to ~300 DPI quality.
    Increase to 2.5–3.0 for very small fonts (slower + larger images).
    """
    os.makedirs(out_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    img_paths = []

    for i in range(doc.page_count):
        page = doc.load_page(i)
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        out_path = os.path.join(out_dir, f"page_{i+1}.png")
        pix.save(out_path)
        img_paths.append(out_path)

    doc.close()
    return img_paths


def group_into_rows(lines: List[Dict[str, Any]], y_threshold: int = 12) -> List[str]:
    """
    Groups OCR lines into table-like rows by their vertical position.
    Returns list of row strings, columns separated by " | ".
    """
    items: List[Tuple[float, float, str, float]] = []
    for l in lines:
        bbox = l["bbox"]
        text = l["text"]
        conf = float(l["conf"])
        y_avg = sum(p[1] for p in bbox) / 4.0
        x_min = min(p[0] for p in bbox)
        items.append((y_avg, x_min, text, conf))

    items.sort(key=lambda x: (x[0], x[1]))

    rows: List[str] = []
    current: List[Tuple[float, str, float]] = []
    last_y = None

    for y, x, text, conf in items:
        if last_y is None or abs(y - last_y) <= y_threshold:
            current.append((x, text, conf))
            last_y = y if last_y is None else (last_y + y) / 2.0
        else:
            current.sort(key=lambda t: t[0])
            rows.append(" | ".join([t[1] for t in current]))
            current = [(x, text, conf)]
            last_y = y

    if current:
        current.sort(key=lambda t: t[0])
        rows.append(" | ".join([t[1] for t in current]))

    return rows


def ocr_one_image(ocr: PaddleOCR, img_path: str, row_y_threshold: int = 14) -> Dict[str, Any]:
    """
    Runs OCR and returns:
      - lines: [{text, conf, bbox}]
      - full_text: concatenated text
      - rows: grouped table-like rows (list of strings)
    """
    result = ocr.ocr(img_path, cls=True)
    lines: List[Dict[str, Any]] = []

    if not result or not result[0]:
        return {"lines": [], "full_text": "", "rows": []}

    for item in result[0]:
        bbox = item[0]              # [[x,y], [x,y], [x,y], [x,y]]
        text = item[1][0]
        conf = float(item[1][1])
        lines.append({"text": text, "conf": conf, "bbox": bbox})

    full_text = "\n".join([l["text"] for l in lines])
    rows = group_into_rows(lines, y_threshold=row_y_threshold)

    return {"lines": lines, "full_text": full_text, "rows": rows}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", required=True, help="Path to image (.png/.jpg) or scanned PDF (.pdf)")
    ap.add_argument("--out", default="ocr_output.json", help="Output JSON path")
    ap.add_argument("--lang", default="en", help="PaddleOCR language (e.g., en)")
    ap.add_argument("--workdir", default="ocr_work", help="Working folder for temp images")
    ap.add_argument("--no_preprocess", action="store_true", help="Disable preprocessing (not recommended)")
    ap.add_argument("--pdf_zoom", type=float, default=2.0, help="PDF render zoom (2.0 ~300 DPI)")
    ap.add_argument("--row_y_threshold", type=int, default=14, help="Row grouping tolerance (px)")
    args = ap.parse_args()

    in_path = args.input
    ext = os.path.splitext(in_path)[1].lower()
    os.makedirs(args.workdir, exist_ok=True)

    # Init OCR once
    ocr = PaddleOCR(use_textline_orientation=True, lang=args.lang)

    # Build list of image paths to OCR
    if ext == ".pdf":
        page_dir = os.path.join(args.workdir, "pdf_pages")
        img_paths = pdf_to_images_fitz(in_path, page_dir, zoom=args.pdf_zoom)
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"]:
        img_paths = [in_path]
    else:
        raise ValueError("Unsupported input. Use an image (.png/.jpg) or scanned PDF (.pdf).")

    output: Dict[str, Any] = {
        "input": os.path.abspath(in_path),
        "pages": []
    }

    for idx, img_path in enumerate(img_paths, start=1):
        # Preprocess
        if args.no_preprocess:
            ocr_img_path = img_path
        else:
            pre_path = os.path.join(args.workdir, f"pre_{idx}.png")
            ocr_img_path = save_preprocessed_image(img_path, pre_path)

        page_result = ocr_one_image(ocr, ocr_img_path, row_y_threshold=args.row_y_threshold)

        output["pages"].append({
            "page_index": idx,
            "source_image": os.path.abspath(img_path),
            "ocr_image_used": os.path.abspath(ocr_img_path),
            "full_text": page_result["full_text"],
            "rows": page_result["rows"],
            "lines": page_result["lines"],
        })

    output["merged_full_text"] = "\n\n--- PAGE BREAK ---\n\n".join(
        p["full_text"] for p in output["pages"]
    )
    output["merged_rows"] = sum((p["rows"] for p in output["pages"]), [])

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Saved OCR JSON to: {os.path.abspath(args.out)}")
    print("Tip: check pages[*].rows for table-like lines; pages[*].lines for bbox/conf details.")


if __name__ == "__main__":
    main()
