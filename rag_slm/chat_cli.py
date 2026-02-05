import argparse
from typing import List, Tuple

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings, ChatOllama


SYSTEM_PROMPT = """You are a medical lab report assistant.

You MUST answer in a clear paragraph that a patient can understand.

Rules:
- Use ONLY the provided CONTEXT.
- If the question asks for abnormal/high/low/out-of-range values, list ONLY tests that are flagged H or L OR clearly outside the given reference range.
- For each abnormal test include: test name, result + unit, reference range, and a short plain-English explanation.
- If nothing is abnormal, say: "No values are flagged abnormal in this report."
- Do NOT output just a test name. Always write complete sentences.
- End with a short one-line summary.
"""


def build_context(docs: List[Document]) -> str:
    summaries = [d for d in docs if (d.metadata or {}).get("doc_kind") == "summary"]
    tests = [d for d in docs if (d.metadata or {}).get("doc_kind") == "test"]
    ordered = summaries + tests
    return "\n\n---\n\n".join(d.page_content for d in ordered)


def flagged_only_context(docs: List[Document]) -> str:
    """
    Extract only flagged H/L test documents from retrieved docs.
    If none, return empty string.
    """
    flagged = []
    for d in docs:
        meta = d.metadata or {}
        if meta.get("doc_kind") == "test" and meta.get("flag") in ("H", "L"):
            flagged.append(d.page_content)
    return "\n\n---\n\n".join(flagged)


def is_abnormal_query(q: str) -> bool:
    ql = q.lower()
    keys = [
        "abnormal", "high", "low", "out of range", "flagged", "h/l",
        "which values are abnormal", "anything wrong"
    ]
    return any(k in ql for k in keys)


def pretty_sources(docs: List[Document], limit: int = 5) -> str:
    lines = []
    for i, d in enumerate(docs[:limit], start=1):
        meta = d.metadata or {}
        lines.append(
            f"[{i}] doc_kind={meta.get('doc_kind')} test={meta.get('test_name')} "
            f"flag={meta.get('flag')} source={meta.get('source')}"
        )
    return "\n".join(lines)


def ask_llm(llm: ChatOllama, context: str, question: str) -> str:
    prompt = f"""{SYSTEM_PROMPT}

CONTEXT:
{context}

QUESTION:
{question}

Answer:"""
    return llm.invoke(prompt).content


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--persist_dir", default="rag_slm/vectordb", help="Chroma persist dir")
    ap.add_argument("--collection", default="medrag", help="Chroma collection name")
    ap.add_argument("--top_k", type=int, default=8, help="Retriever top_k")
    ap.add_argument("--model", default="gemma3:1b", help="Ollama chat model")
    ap.add_argument("--embed_model", default="nomic-embed-text", help="Ollama embedding model")
    args = ap.parse_args()

    embeddings = OllamaEmbeddings(model=args.embed_model)
    db = Chroma(collection_name=args.collection, persist_directory=args.persist_dir, embedding_function=embeddings)
    retriever = db.as_retriever(search_kwargs={"k": args.top_k})

    llm = ChatOllama(model=args.model, temperature=0.2)

    print("MEDRAG Chat (type 'exit' to quit)\n")

    while True:
        q = input("You: ").strip()
        if not q:
            continue
        if q.lower() in ("exit", "quit"):
            break

        docs: List[Document] = retriever.invoke(q)

        # If user asks abnormal values, enforce flagged-only context when possible
        if is_abnormal_query(q):
            flagged_ctx = flagged_only_context(docs)
            if flagged_ctx.strip():
                context = "FLAGGED TESTS ONLY:\n\n" + flagged_ctx
            else:
                # fallback if no flagged docs retrieved
                context = build_context(docs)
        else:
            context = build_context(docs)

        answer = ask_llm(llm, context, q)

        print("\nAssistant:", answer.strip(), "\n")
        print("Sources (top chunks):")
        print(pretty_sources(docs))
        print()


if __name__ == "__main__":
    main()
