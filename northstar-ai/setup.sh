#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "=============================="
echo "NorthStar AI Setup"
echo "=============================="

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate

python -m pip install --upgrade pip
pip install mlx mlx-lm

echo ""
echo "Checking required files..."

required_files=(
  "scripts/chat_api.py"
  "scripts/resume_pipeline.py"
  "scripts/resume_pipeline_api.py"
  "scripts/resume_validator.py"
  "adapters/northstar-v5-2900/adapter_config.json"
  "adapters/northstar-v5-2900/adapters.safetensors"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "MISSING: $file"
    exit 1
  fi
done

echo ""
echo "NorthStar AI setup complete."
echo "The base Qwen model will download automatically when first used."
