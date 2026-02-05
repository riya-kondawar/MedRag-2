ALLOWED_STATUS = {"HIGH","LOW","ABNORMAL"}
ALLOWED_SEVERITY = {"mild","moderate","severe","unknown"}

DEFAULT_FINDING = {
    "status": "ABNORMAL",
    "severity": "unknown",
    "possible_causes": [],
    "lifestyle_guidance": [],
    "nutrition_hints": [],
    "follow_up_tests": [],
    "when_to_see_doctor": [],
    "red_flags": []
}

def validate(data):

    # Top level
    data.setdefault("summary","")
    data.setdefault("abnormal_findings",[])
    data.setdefault("disclaimer","General information only; not a diagnosis.")

    for f in data["abnormal_findings"]:

        # Name
        f.setdefault("name","")

        # Status
        if f.get("status") not in ALLOWED_STATUS:
            f["status"]="ABNORMAL"

        # Severity
        if f.get("severity") not in ALLOWED_SEVERITY:
            f["severity"]="unknown"

        # Lists
        for k in DEFAULT_FINDING:
            f.setdefault(k,[])

        for k in [
            "possible_causes",
            "lifestyle_guidance",
            "nutrition_hints",
            "follow_up_tests",
            "when_to_see_doctor",
            "red_flags"
        ]:
            if not isinstance(f[k],list):
                f[k]=[]
