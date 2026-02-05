import re
from typing import Any, Dict, List, Optional
from langchain_core.documents import Document


def _norm(x: Any) -> str:
    if x is None:
        return ""
    return re.sub(r"\s+", " ", str(x)).strip()


def _safe_float(x: Any) -> Optional[float]:
    try:
        if x is None or x == "":
            return None
        return float(str(x).strip())
    except Exception:
        return None


def normalize_test(t: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize test objects across different report schemas.
    Works for:
      - {name, result, unit, ref_low, ref_high, flag, method}
      - {test, value, unit, reference_range}
      - {investigation, result, units, range}
    """
    name = t.get("name") or t.get("test") or t.get("investigation") or "Unknown Test"

    # result/value
    result = t.get("result", t.get("value"))
    result_num = _safe_float(result)

    # unit variations
    unit = t.get("unit") or t.get("units") or ""

    # range variations
    ref_low = t.get("ref_low", t.get("low"))
    ref_high = t.get("ref_high", t.get("high"))

    # sometimes the full range is stored like "12 - 15"
    if (ref_low is None or ref_high is None) and isinstance(t.get("reference_range"), str):
        m = re.search(r"(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)", t["reference_range"])
        if m:
            ref_low, ref_high = m.group(1), m.group(2)

    ref_low_num = _safe_float(ref_low)
    ref_high_num = _safe_float(ref_high)

    flag = t.get("flag")
    if isinstance(flag, str):
        flag = flag.strip().upper()
        if flag not in ("H", "L"):
            flag = None
    else:
        flag = None

    method = t.get("method")

    return {
        "name": _norm(name),
        "result_raw": result,
        "result_num": result_num,
        "unit": _norm(unit),
        "ref_low": ref_low_num,
        "ref_high": ref_high_num,
        "flag": flag,
        "method": _norm(method) if method else None,
    }


def patient_block(patient: Dict[str, Any]) -> str:
    name = _norm(patient.get("name", "Unknown"))
    age_gender = patient.get("age_gender_raw")

    if not age_gender:
        age_years = _norm(patient.get("age_years", ""))
        gender = _norm(patient.get("gender", ""))
        age_gender = f"{age_years} {gender}".strip()

    age_gender = _norm(age_gender)
    reg_date = _norm(patient.get("registration_date"))
    rpt_dt = _norm(patient.get("report_datetime"))

    lines = [
        f"Patient Name: {name}",
        f"Age/Gender: {age_gender}",
        f"Registration Date: {reg_date}",
        f"Report DateTime: {rpt_dt}",
    ]
    return "\n".join([x for x in lines if x.strip()])


def infer_flag_if_missing(result_num: Optional[float], low: Optional[float], high: Optional[float]) -> Optional[str]:
    """
    If OCR didn't explicitly provide H/L flags, infer it from numeric comparison.
    """
    if result_num is None or low is None or high is None:
        return None
    if result_num < low:
        return "L"
    if result_num > high:
        return "H"
    return None


def build_documents(report: Dict[str, Any], report_id: Optional[str] = None) -> List[Document]:
    """
    Produces:
      - 1 summary document
      - 1 document per test
    """
    source = report.get("source") or report_id or "unknown_source"
    report_type = report.get("report_type") or "UNKNOWN"

    patient = report.get("patient_info") or {}
    pblock = patient_block(patient)

    tests_raw = report.get("tests") or []
    tests = [normalize_test(t) for t in tests_raw]

    # Ensure abnormal is correctly identified
    enriched_tests = []
    for t in tests:
        flag = t.get("flag") or infer_flag_if_missing(t.get("result_num"), t.get("ref_low"), t.get("ref_high"))
        t["flag"] = flag
        enriched_tests.append(t)

    abnormal = [t for t in enriched_tests if t.get("flag") in ("H", "L")]

    # ---------- Summary doc ----------
    summary_lines = [
        f"REPORT TYPE: {report_type}",
        pblock,
        f"TOTAL TESTS: {len(enriched_tests)}",
        f"FLAGGED (H/L) TESTS: {len(abnormal)}",
    ]

    if abnormal:
        summary_lines.append("FLAGGED DETAILS:")
        for t in abnormal[:100]:
            lo = t.get("ref_low")
            hi = t.get("ref_high")
            summary_lines.append(
                f"- {t['name']}: {t.get('result_raw')} {t.get('unit')} | "
                f"Range: {lo} - {hi} | Flag: {t.get('flag')}"
            )
    else:
        summary_lines.append("No tests are flagged (H/L) in this report.")

    docs: List[Document] = [
        Document(
            page_content="\n".join([x for x in summary_lines if x.strip()]),
            metadata={
                "source": source,
                "report_type": report_type,
                "doc_kind": "summary",
            },
        )
    ]

    # ---------- Per-test docs ----------
    for idx, t in enumerate(enriched_tests):
        lo = t.get("ref_low")
        hi = t.get("ref_high")
        rnum = t.get("result_num")

        # embed-friendly compact chunk
        content_lines = [
            f"REPORT TYPE: {report_type}",
            pblock,
            f"TEST NAME: {t['name']}",
            f"RESULT: {t.get('result_raw')} {t.get('unit')}".strip(),
            f"REFERENCE RANGE: {lo} - {hi}",
            f"FLAG: {t.get('flag')}",
        ]
        if t.get("method"):
            content_lines.append(f"METHOD: {t.get('method')}")

        docs.append(
            Document(
                page_content="\n".join([x for x in content_lines if x.strip()]),
                metadata={
                    "source": source,
                    "report_type": report_type,
                    "doc_kind": "test",
                    "test_name": t["name"],
                    "test_index": idx,
                    "flag": t.get("flag"),
                    "result_num": rnum,
                    "ref_low": lo,
                    "ref_high": hi,
                },
            )
        )

    return docs
