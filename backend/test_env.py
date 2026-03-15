import sys
import pkg_resources

required = {
    'transformers': '4.36.0',
    'torch': '2.0.0',
    'pillow': '9.0.0',
    'sentencepiece': '0.1.99'
}

print(f"Python: {sys.version}")
print("-" * 20)

all_good = True
for package, min_version in required.items():
    try:
        dist = pkg_resources.get_distribution(package)
        print(f"{package}: {dist.version}")
    except pkg_resources.DistributionNotFound:
        print(f"{package}: NOT FOUND (Required >= {min_version})")
        all_good = False
    except Exception as e:
        print(f"{package}: Error {e}")
        all_good = False

print("-" * 20)
try:
    import torch
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Device Name: {torch.cuda.get_device_name(0)}")
except ImportError:
    print("Torch not importable")

print("-" * 20)
if all_good:
    print("Environment matches basic requirements.")
else:
    print("Some dependencies are missing. Run: pip install -r backend/requirements.txt")
