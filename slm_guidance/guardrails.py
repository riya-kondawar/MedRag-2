import re,json

BAD = ["mg","ml","tablet","dose","ibuprofen","paracetamol","amoxicillin"]

def unsafe(obj):
    txt=json.dumps(obj).lower()
    return any(b in txt for b in BAD)
