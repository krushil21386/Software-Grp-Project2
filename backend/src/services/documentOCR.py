"""
Document Understanding Model for Medical Report OCR
Supports multiple models: Donut, LayoutLM, Qwen2-VL
"""
import sys
import json
import os
import traceback
import logging

logging.basicConfig(filename='document_ocr.log', level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def log_and_exit(error_msg, details=None):
    logging.error(error_msg)
    if details:
        logging.error(details)
    print(json.dumps({"success": False, "error": error_msg, "details": details}))
    sys.exit(1)

def extract_with_qwen2vl(image_path):
    """Extract text and structure using Qwen2-VL model"""
    try:
        from transformers import Qwen2VLProcessor, Qwen2VLForConditionalGeneration
        import torch
        from PIL import Image
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model_name = 'Qwen/Qwen2-VL-2B-Instruct'  # or 7B-Instruct for better quality
        
        logging.info(f"Loading Qwen2-VL model: {model_name}")
        processor = Qwen2VLProcessor.from_pretrained(model_name)
        model = Qwen2VLForConditionalGeneration.from_pretrained(
            model_name,
            torch_dtype=torch.bfloat16 if device == 'cuda' else torch.float32,
            device_map=device
        )
        
        image = Image.open(image_path).convert('RGB')
        
        # Prompt for medical report extraction
        prompt = """Analyze this medical report image and extract all test values in JSON format.
        For each test, provide: test name, value, unit, and normal range if available.
        Format: {"tests": [{"name": "Hemoglobin", "value": 12.5, "unit": "g/dL", "normal_range": "13.5-17.5"}, ...]}
        Also extract any diagnosis, findings, or medical conditions mentioned."""
        
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt}
                ]
            }
        ]
        
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        image_inputs, video_inputs = processor.process_visual_info(messages)
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt"
        ).to(device)
        
        generated_ids = model.generate(**inputs, max_new_tokens=2048)
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(
            generated_ids_trimmed, 
            skip_special_tokens=True, 
            clean_up_tokenization_spaces=False
        )[0]
        
        # Try to parse JSON from output
        try:
            # Extract JSON from markdown code blocks if present
            if '```json' in output_text:
                json_start = output_text.find('```json') + 7
                json_end = output_text.find('```', json_start)
                output_text = output_text[json_start:json_end].strip()
            elif '```' in output_text:
                json_start = output_text.find('```') + 3
                json_end = output_text.find('```', json_start)
                output_text = output_text[json_start:json_end].strip()
            
            extracted_data = json.loads(output_text)
            return {
                "success": True,
                "text": output_text,
                "structured_data": extracted_data,
                "model": "Qwen2-VL"
            }
        except json.JSONDecodeError:
            # Return raw text if JSON parsing fails
            return {
                "success": True,
                "text": output_text,
                "structured_data": None,
                "model": "Qwen2-VL"
            }
            
    except ImportError:
        log_and_exit("Qwen2-VL not installed. Install with: pip install transformers qwen-vl-utils")
    except Exception as e:
        log_and_exit("Qwen2-VL extraction failed", traceback.format_exc())

def extract_with_donut(image_path):
    """Extract text and structure using Donut model"""
    try:
        from transformers import DonutProcessor, VisionEncoderDecoderModel
        from PIL import Image
        import torch
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model_name = 'naver-clova-ix/donut-base'
        
        logging.info(f"Loading Donut model: {model_name}")
        processor = DonutProcessor.from_pretrained(model_name)
        model = VisionEncoderDecoderModel.from_pretrained(model_name)
        model.to(device)
        model.eval()
        
        image = Image.open(image_path).convert('RGB')
        
        # Prompt for medical report
        task_prompt = "<s_medical_report>"
        decoder_input_ids = processor.tokenizer(
            task_prompt, 
            add_special_tokens=False, 
            return_tensors="pt"
        )["input_ids"]
        
        pixel_values = processor(image, return_tensors="pt").pixel_values.to(device)
        
        outputs = model.generate(
            pixel_values,
            decoder_input_ids=decoder_input_ids.to(device),
            max_length=model.decoder.config.max_position_embeddings,
            early_stopping=True,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
            use_cache=True,
            num_beams=1,
            bad_words_ids=[[processor.tokenizer.unk_token_id]],
            return_dict_in_generate=True,
        )
        
        sequence = processor.batch_decode(outputs.sequences)[0]
        sequence = sequence.replace(processor.tokenizer.eos_token, "").replace(processor.tokenizer.pad_token, "")
        sequence = sequence.replace(task_prompt, "")
        
        return {
            "success": True,
            "text": sequence,
            "structured_data": None,
            "model": "Donut"
        }
        
    except ImportError:
        log_and_exit("Donut not installed. Install with: pip install transformers")
    except Exception as e:
        log_and_exit("Donut extraction failed", traceback.format_exc())

def extract_with_deepseek_ocr2(image_path):
    """Fallback to DeepSeek-OCR-2 if other models fail"""
    try:
        import torch
        from transformers import AutoModel, AutoTokenizer
        import warnings
        warnings.filterwarnings("ignore")
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model_name = 'deepseek-ai/DeepSeek-OCR-2'
        
        logging.info(f"Loading DeepSeek-OCR-2 model: {model_name}")
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        
        model_kwargs = {
            "trust_remote_code": True,
            "use_safetensors": True,
            "_attn_implementation": "eager" if device == 'cpu' else "flash_attention_2"
        }
        
        if device == 'cpu':
            model_kwargs["torch_dtype"] = torch.float32
        else:
            model_kwargs["torch_dtype"] = torch.bfloat16
        
        try:
            model = AutoModel.from_pretrained(model_name, **model_kwargs)
        except Exception:
            model_kwargs["_attn_implementation"] = "eager"
            model = AutoModel.from_pretrained(model_name, **model_kwargs)
        
        model = model.to(device).eval()
        
        if device == 'cpu':
            model = model.float()
        
        prompt = "<image>\n<|grounding|>Convert the document to markdown."
        output_dir = os.path.dirname(image_path)
        
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
        
        result_text = res if isinstance(res, str) else (res.get('text', '') if isinstance(res, dict) else str(res))
        
        return {
            "success": True,
            "text": result_text,
            "structured_data": None,
            "model": "DeepSeek-OCR-2"
        }
        
    except Exception as e:
        log_and_exit("DeepSeek-OCR-2 extraction failed", traceback.format_exc())

def main():
    if len(sys.argv) < 3:
        log_and_exit("Usage: python documentOCR.py <image_path> <model_type>")
    
    image_path = sys.argv[1]
    model_type = sys.argv[2].lower()  # 'qwen', 'donut', 'deepseek'
    
    if not os.path.exists(image_path):
        log_and_exit(f"Image file not found: {image_path}")
    
    try:
        logging.info(f"Starting document OCR with {model_type}")
        
        if model_type == 'qwen':
            result = extract_with_qwen2vl(image_path)
        elif model_type == 'donut':
            result = extract_with_donut(image_path)
        else:  # default to deepseek
            result = extract_with_deepseek_ocr2(image_path)
        
        print(json.dumps(result))
        
    except Exception as e:
        log_and_exit("Runtime Error", traceback.format_exc())

if __name__ == "__main__":
    main()
