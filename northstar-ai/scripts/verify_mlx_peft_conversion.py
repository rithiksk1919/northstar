from pathlib import Path
from safetensors import safe_open
import torch

SRC = Path("northstar-ai/adapters/northstar-v5-2900/adapters.safetensors")
DST = Path("northstar-ai/converted/northstar-v5-2900-peft/adapter_model.safetensors")

with safe_open(str(SRC), framework="pt", device="cpu") as src:
    src_keys = list(src.keys())
    src_tensors = {k: src.get_tensor(k) for k in src_keys}

with safe_open(str(DST), framework="pt", device="cpu") as dst:
    dst_keys = list(dst.keys())
    dst_tensors = {k: dst.get_tensor(k) for k in dst_keys}

failures = []
checked = 0
layers = set()
modules = set()

for old_key, old_tensor in src_tensors.items():
    if old_key.endswith(".lora_a"):
        base = old_key[:-len(".lora_a")]
        new_key = "base_model.model." + base + ".lora_A.weight"
    elif old_key.endswith(".lora_b"):
        base = old_key[:-len(".lora_b")]
        new_key = "base_model.model." + base + ".lora_B.weight"
    else:
        failures.append(f"Unexpected source key: {old_key}")
        continue

    parts = base.split(".")
    if len(parts) >= 3 and parts[0] == "model" and parts[1] == "layers":
        layers.add(int(parts[2]))

    modules.add(parts[-1])

    if new_key not in dst_tensors:
        failures.append(f"Missing converted tensor: {new_key}")
        continue

    expected = old_tensor.T.contiguous()
    actual = dst_tensors[new_key]

    if expected.shape != actual.shape:
        failures.append(
            f"Shape mismatch {new_key}: expected {expected.shape}, got {actual.shape}"
        )
        continue

    if not torch.equal(expected, actual):
        max_diff = (expected - actual).abs().max().item()
        failures.append(
            f"Value mismatch {new_key}: max difference {max_diff}"
        )
        continue

    checked += 1

print()
print("===================================")
print("NorthStar V5 conversion verification")
print("===================================")
print("Source tensors:", len(src_tensors))
print("Converted tensors:", len(dst_tensors))
print("Verified tensors:", checked)
print("Layers:", sorted(layers))
print("Number of adapted layers:", len(layers))
print("Target modules:", sorted(modules))
print()

if failures:
    print("FAILED")
    for failure in failures[:20]:
        print(" -", failure)

    if len(failures) > 20:
        print(f" ...and {len(failures) - 20} more")

    raise SystemExit(1)

if len(src_tensors) != len(dst_tensors):
    raise SystemExit(
        f"FAILED: tensor counts differ: {len(src_tensors)} vs {len(dst_tensors)}"
    )

print("PASS: Every MLX LoRA tensor was converted exactly.")
