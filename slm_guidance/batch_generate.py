import os,json,subprocess

for f in os.listdir(".."):
    if f.endswith(".json") and "cbc" in f:
        os.system(f"python generate_guidance.py --infile ../{f} --outfile {f}_guidance.json")
