import os
import json
import argparse
from typing import Dict, Any, List

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

from utils_docs import build_documents


def load_json_file(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def discover_json_inputs(path: str) -> List[str]:
    if os.path.isfile(path) and path.lower().endswith(".json"):
        return [path]

    if os.path.isdir(path):
        files = []
        for root, _, fs in os.walk(path):
            for fn in fs:
                if fn.lower().endswith(".json"):
                    files.append(os.path.join(root, fn))
        return sorted(files)

    raise FileNotFoundError(f"Invalid JSON path: {path}")


def chunk_documents(docs: List[Document], size: int, overlap: int) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    return splitter.split_documents(docs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", required=True, help="Structured JSON file or directory")
    ap.add_argument("--persist_dir", default="rag_slm/vectordb")
    ap.add_argument("--collection", default="medrag")
    ap.add_argument("--embed_model", default="nomic-embed-text")
    ap.add_argument("--chunk_size", type=int, default=900)
    ap.add_argument("--chunk_overlap", type=int, default=120)
    ap.add_argument("--reset", action="store_true")
    args = ap.parse_args()

    if args.reset and os.path.exists(args.persist_dir):
        import shutil
        shutil.rmtree(args.persist_dir, ignore_errors=True)
        print(f"🧹 Deleted old vectordb: {args.persist_dir}")

    json_files = discover_json_inputs(args.json)
    print(f"📄 Found {len(json_files)} JSON file(s)")

    all_docs: List[Document] = []

    for jf in json_files:
        report = load_json_file(jf)
        report_id = report.get("source") or jf
        docs = build_documents(report, report_id=report_id)
        all_docs.extend(docs)
        print(f"  ✅ {os.path.basename(jf)} → {len(docs)} docs")

    if not all_docs:
        raise RuntimeError("❌ No documents generated. Check utils_docs.build_documents().")

    chunks = chunk_documents(all_docs, args.chunk_size, args.chunk_overlap)
    print(f"✂️  Chunks created: {len(chunks)}")

    embeddings = OllamaEmbeddings(model=args.embed_model)

    Chroma(
        collection_name=args.collection,
        persist_directory=args.persist_dir,
        embedding_function=embeddings,
    ).add_documents(chunks)

    print("\n✅ INGEST COMPLETE")
    print(f"📦 Chunks stored: {len(chunks)}")
    print(f"📚 Collection: {args.collection}")
    print(f"💾 Persist dir: {args.persist_dir}")


if __name__ == "__main__":
    main()
