import argparse
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--persist_dir", default="rag_slm/vectordb")
    ap.add_argument("--collection", default="medrag")
    ap.add_argument("--base_url", default="http://127.0.0.1:11434")
    args = ap.parse_args()

    emb = OllamaEmbeddings(model="nomic-embed-text", base_url=args.base_url)

    vs = Chroma(
        persist_directory=args.persist_dir,
        collection_name=args.collection,
        embedding_function=emb,
    )

    # count docs (Chroma internal collection)
    col = vs._collection
    count = col.count()
    print(f"✅ Collection: {args.collection}")
    print(f"✅ Persist Dir: {args.persist_dir}")
    print(f"✅ Document chunks stored: {count}")

    if count > 0:
        sample = col.get(limit=3, include=["documents", "metadatas"])
        print("\n--- SAMPLE CHUNKS ---")
        for i, doc in enumerate(sample["documents"], start=1):
            md = sample["metadatas"][i-1]
            print(f"\n[{i}] metadata={md}")
            print(doc[:400], "..." if len(doc) > 400 else "")

if __name__ == "__main__":
    main()
