import json,argparse
from prompts import SYSTEM_PROMPT,USER_PROMPT
from ollama_client import call,extract
from schema import validate
from guardrails import unsafe

def main():

    ap=argparse.ArgumentParser()
    ap.add_argument("--infile",default="../cbc_structured.json")
    ap.add_argument("--outfile",default="guidance.json")
    args=ap.parse_args()

    report=json.load(open(args.infile))

    abnormal=report.get("abnormal",[])

    compact={
        "patient_info":report.get("patient_info"),
        "report_type":report.get("report_type"),
        "abnormal":abnormal
    }

    prompt=USER_PROMPT.format(json=json.dumps(compact))

    text=call(prompt,SYSTEM_PROMPT)
    data=extract(text)

    validate(data)

    if unsafe(data):
        raise Exception("Unsafe medical content")

    json.dump(data,open(args.outfile,"w"),indent=2)

    print("Saved:",args.outfile)

if __name__=="__main__":
    main()
