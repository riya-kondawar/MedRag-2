import requests,json

def call(prompt,system):

    r=requests.post("http://localhost:11434/api/generate",json={
        "model":"gemma3:1b",
        "prompt":prompt,
        "system":system,
        "stream":False,
        "options":{"temperature":0.2}
    })

    return r.json()["response"]

def extract(text):
    s=text.find("{")
    e=text.rfind("}")
    return json.loads(text[s:e+1])
