import json
from pathlib import Path

import torch
from safetensors import safe_open
from safetensors.torch import save_file

SRC = Path("northstar-ai/adapters/northstar-v5-2900")
DST = Path("northstar-ai/converted/northstar-v5-2900-peft")

SRC_WEIGHTS = SRC / "adapters.safetensors"
SRC_CONFIG = SRC / "adapter_config.json"

DST_WEIGHTS = DST / "adapter_model.safetensors"
DST_CONFIG = DST / "adapter_config.json"

DST.mkdir(parents=True, exist_ok=True)

with open(SRC_CONFIG, "r") as f:
    mlx_config = json.load(f)

rank = int(mlx_config["lora_parameters"]["rank"])
scale = float(mlx_config["lora_parameters"]["scale"])
dropout = float(mlx_config["lora_parameters"]["dropout"])

# MLX uses:
#   output = base + scale * (x @ A @ B)
#
# PEFT uses:
#   scaling = lora_alpha / r
#
# therefore:
#   lora_alpha = scale * rank
lora_alpha = scale * rank

converted = {}
target_modules = set()

with safe_open(str(SRC_WEIGHTS), framework="pt", device="cpu") as f:
    for old_key in f.keys():
        tensor = f.get_tensor(old_key)

        if old_key.endswith(".lora_a"):
            base_key = old_key[:-len(".lora_a")]
            new_key = (
                "base_model.model."
                + base_key
                + ".lora_A.weight"
            )

            # MLX A: [input_dim, rank]
            # PEFT A: [rank, input_dim]
            converted[new_key] = tensor.T.contiguous()

        elif old_key.endswith(".lora_b"):
            base_key = old_key[:-len(".lora_b")]
            new_key = (
                "base_model.model."
                + base_key
                + ".lora_B.weight"
            )

            # MLX B: [rank, output_dim]
            # PEFT B: [output_dim, rank]
            converted[new_key] = tensor.T.contiguous()

        else:
            raise ValueError(f"Unexpected MLX adapter key: {old_key}")

        pieces = base_key.split(".")
        if pieces:
            target_modules.add(pieces[-1])

peft_config = {
    "base_model_name_or_path": "Qwen/Qwen3-4B",
    "bias": "none",
    "fan_in_fan_out": False,
    "inference_mode": True,
    "lora_alpha": lora_alpha,
    "lora_dropout": dropout,
    "modules_to_save": None,
    "peft_type": "LORA",
    "r": rank,
    "target_modules": sorted(target_modules),
    "task_type": "CAUSAL_LM",
    "use_dora": False,
    "use_rslora": False
}

save_file(converted, str(DST_WEIGHTS))

with open(DST_CONFIG, "w") as f:
    json.dump(peft_config, f, indent=2)

print("Converted adapter successfully.")
print()
print("SOURCE:", SRC)
print("DESTINATION:", DST)
print("Rank:", rank)
print("MLX scale:", scale)
print("PEFT alpha:", lora_alpha)
print("Target modules:")
for module in sorted(target_modules):
    print(" -", module)
print()
print("Converted tensors:", len(converted))
