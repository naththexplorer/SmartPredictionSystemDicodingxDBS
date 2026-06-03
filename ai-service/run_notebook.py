import json

with open("notebook.ipynb", "r") as f:
    nb = json.load(f)

code_lines = []
for cell in nb["cells"]:
    if cell["cell_type"] == "code":
        code_lines.extend(cell["source"])
        code_lines.append("\n")

code = "".join(code_lines)
code = code.replace("group.index.to_numpy()", "group.index.to_numpy().copy()")

with open("train.py", "w") as f:
    f.write(code)
