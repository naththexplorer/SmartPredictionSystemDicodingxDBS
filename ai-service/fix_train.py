with open("train.py", "r") as f:
    lines = f.readlines()

new_lines = ["def display(x): print(x)\n"]
for line in lines:
    if line.startswith("%") or "from IPython.display import display" in line: continue
    new_lines.append(line)

with open("train.py", "w") as f:
    f.writelines(new_lines)
