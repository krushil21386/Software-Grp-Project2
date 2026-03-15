import sys
import torch
import transformers
import PIL
import numpy

print(f"Python version: {sys.version}")
print(f"Torch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"Transformers version: {transformers.__version__}")
print(f"Pillow version: {PIL.__version__}")
print(f"Numpy version: {numpy.__version__}")
print("Environment verification successful!")
