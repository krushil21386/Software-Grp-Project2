import sys
import json
import os
import traceback

# Setup logging to file for debugging
import logging
logging.basicConfig(filename='ocr_debug.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def log_and_exit(error_msg, details=None):
    logging.error(error_msg)
    if details:
        logging.error(details)
    print(json.dumps({"success": False, "error": error_msg, "details": details}))
    sys.exit(1)

try:
    import torch
    from transformers import AutoModel, AutoTokenizer
except ImportError as e:
    log_and_exit("Missing dependencies", str(e))

# Suppress warnings more aggressively
import warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*model of type.*")
warnings.filterwarnings("ignore", message=".*You are using.*")

def main():
    if len(sys.argv) < 2:
        log_and_exit("No image path provided")

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        log_and_exit(f"Image file not found: {image_path}")

    try:
        logging.info("Starting OCR process...")
        logging.info(f"Image path: {image_path}")

        # Device selection
        device_str = 'cuda' if torch.cuda.is_available() else 'cpu'
        logging.info(f"Selected device: {device_str}")

        model_name = 'deepseek-ai/DeepSeek-OCR-2'
        
        logging.info(f"Loading tokenizer from {model_name}...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        except Exception as tokenizer_err:
            log_and_exit(f"Failed to load tokenizer: {str(tokenizer_err)}")
        
        logging.info(f"Loading model from {model_name}...")
        # Configure model loading based on device
        # Use eager attention for CPU, try flash_attention_2 for GPU but fallback to eager
        model_kwargs = {
            "trust_remote_code": True,
            "use_safetensors": True,
            "_attn_implementation": "eager"  # Always use eager to avoid compatibility issues
        }
        
        if device_str == 'cpu':
            model_kwargs["torch_dtype"] = torch.float32
        else:
            model_kwargs["torch_dtype"] = torch.bfloat16

        logging.info(f"Model kwargs: {model_kwargs}")
        
        try:
            # Suppress the model type warning by catching it
            import warnings
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", category=UserWarning)
                warnings.filterwarnings("ignore", message=".*model of type.*")
                model = AutoModel.from_pretrained(model_name, **model_kwargs)
        except Exception as load_err:
            error_msg = str(load_err)
            logging.error(f"Model loading error: {error_msg}")
            
            # Try with even more basic settings
            try:
                logging.info("Retrying with minimal configuration...")
                model_kwargs_minimal = {
                    "trust_remote_code": True,
                    "torch_dtype": torch.float32 if device_str == 'cpu' else torch.bfloat16
                }
                with warnings.catch_warnings():
                    warnings.filterwarnings("ignore")
                    model = AutoModel.from_pretrained(model_name, **model_kwargs_minimal)
            except Exception as retry_err:
                log_and_exit(f"Failed to load model after retry: {str(retry_err)}", traceback.format_exc())

        model = model.to(device_str)
        model = model.eval()

        if device_str == 'cpu':
             model = model.float() # Ensure float32 on CPU

        logging.info("Model loaded successfully.")
        
        prompt = "<image>\n<|grounding|>Convert the document to markdown."
        
        # Determine output path (required by the model signature, though we want the return value)
        output_dir = os.path.dirname(image_path)
        
        logging.info("Running inference...")
        
        # The infer method signature might vary based on the remote code version.
        # We try to pass arguments as named args to be safe.
        try:
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore")
                res = model.infer(
                    tokenizer, 
                    prompt=prompt, 
                    image_file=image_path, 
                    output_path=output_dir, 
                    base_size=1024, 
                    image_size=768, 
                    crop_mode=True, 
                    save_results=False 
                )
        except Exception as infer_err:
            log_and_exit(f"Inference failed: {str(infer_err)}", traceback.format_exc())
        
        logging.info("Inference complete.")

        result_text = ""
        if isinstance(res, str):
            result_text = res
        elif isinstance(res, dict) and 'text' in res:
            result_text = res['text']
        else:
            result_text = str(res)

        output = {
            "success": True,
            "text": result_text,
            "device": device_str
        }
        
        print(json.dumps(output))

    except Exception as e:
        log_and_exit("Runtime Error", traceback.format_exc())

if __name__ == "__main__":
    main()
