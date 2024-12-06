from dotenv import load_dotenv
from flask import Flask, request, jsonify
from transformers import (
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
)
import openai
import torch
import os
import logging
import traceback

# Load environment variables
load_dotenv()

# Flask app setup
app = Flask(__name__)

# Environment variables
USE_OPENAI = os.getenv("USE_OPENAI", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
HUGGINGFACE_MODEL_NAME = os.getenv("HUGGINGFACE_MODEL_NAME", "EleutherAI/gpt-neo-1.3B")
OPENAI_MODEL_NAME = os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo")
HF_AUTH_TOKEN = os.getenv("HF_AUTH_TOKEN", None)

os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def format_prompt(prompt, system_prompt=""):
    if system_prompt:
        system_prompt = f"<<SYS>>\n{system_prompt}\n<</SYS>>\n\n"
    else:
        system_prompt = ""
    return f"[INST] {system_prompt}{prompt.strip()} [/INST]"


# Determine model type based on the model name
def get_model_type(model_name):
    model_name = model_name.lower()
    if "llama" in model_name:
        return "llama"
    elif "t5" in model_name or "flan" in model_name:
        return "t5"
    elif "gpt" in model_name:
        return "gpt"
    else:
        return "gpt"  # Default to GPT-like causal models

# OpenAI setup
if USE_OPENAI:
    if not OPENAI_API_KEY:
        raise ValueError("OpenAI API key is required when USE_OPENAI is true.")
    openai.api_key = OPENAI_API_KEY
    logger.info("Using OpenAI model.")
else:
    # Hugging Face setup
    model_type = get_model_type(HUGGINGFACE_MODEL_NAME)
    logger.info(f"Loading Hugging Face model: {HUGGINGFACE_MODEL_NAME} (type: {model_type})")
    
    if HF_AUTH_TOKEN:
        auth_args = {"use_auth_token": HF_AUTH_TOKEN}
    else:
        auth_args = {}
    
    if model_type == "llama":
        tokenizer = AutoTokenizer.from_pretrained(
            HUGGINGFACE_MODEL_NAME, use_fast=False, **auth_args
        )
        model = AutoModelForCausalLM.from_pretrained(
            HUGGINGFACE_MODEL_NAME,
            device_map="auto",
            torch_dtype=torch.float16,
            **auth_args
        )
    elif model_type == "t5":
        tokenizer = AutoTokenizer.from_pretrained(HUGGINGFACE_MODEL_NAME, **auth_args)
        model = AutoModelForSeq2SeqLM.from_pretrained(HUGGINGFACE_MODEL_NAME, **auth_args)
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model.to(device)
    else:
        tokenizer = AutoTokenizer.from_pretrained(HUGGINGFACE_MODEL_NAME, **auth_args)
        model = AutoModelForCausalLM.from_pretrained(HUGGINGFACE_MODEL_NAME, **auth_args)
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model.to(device)
    
    logger.info("Hugging Face model loaded.")

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    prompt = data.get('prompt', '')
    max_length = int(data.get('max_length', 500))

    if not prompt:
        return jsonify({'response': "Please provide a valid prompt."}), 400

    try:
        if USE_OPENAI:
            response = openai.ChatCompletion.create(
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
                model=OPENAI_MODEL_NAME,
                max_tokens=max_length,
                temperature=0.5,
            )
            generated_text = response.choices[0].message.content.strip()
        else:
            if model_type == "t5":
                inputs = tokenizer(prompt, return_tensors='pt', max_length=512, truncation=True).to(model.device)
                outputs = model.generate(
                    **inputs,
                    max_length=max_length,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9
                )
                generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            elif model_type == "llama":
                # Format prompt for Llama-2 Chat
                system_prompt = "You are a helpful assistant."
                prompt_template = format_prompt(prompt, system_prompt)
                inputs = tokenizer(prompt_template, return_tensors='pt').to(model.device)
                # Ensure special tokens are set
                if model.config.eos_token_id is None:
                    model.config.eos_token_id = tokenizer.eos_token_id
                if model.config.bos_token_id is None:
                    model.config.bos_token_id = tokenizer.bos_token_id
                if model.config.pad_token_id is None:
                    model.config.pad_token_id = tokenizer.eos_token_id
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=max_length,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    repetition_penalty=1.2,
                    eos_token_id=model.config.eos_token_id,
                    pad_token_id=model.config.pad_token_id
                )
                # Decode the output
                generated_tokens = outputs[0][inputs['input_ids'].shape[1]:]
                logger.info(f"max_length: {max_length}")
                logger.info(f"Number of generated tokens: {len(generated_tokens)}")

                generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()
                logger.info(f"Generated text: {generated_text}")


            else:
                inputs = tokenizer(prompt, return_tensors='pt').to(model.device)
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=max_length,
                    do_sample=True,
                    temperature=0.3,
                    top_p=0.9,
                    repetition_penalty=1.2,
                    pad_token_id=tokenizer.eos_token_id
                )
                text = tokenizer.decode(outputs[0], skip_special_tokens=True)
                generated_text = text[len(prompt):].strip()

            # Remove repeated sections
            lines = generated_text.split('\n')
            unique_lines = []
            for line in lines:
                if line not in unique_lines:
                    unique_lines.append(line)
            generated_text = "\n".join(unique_lines)

        if not generated_text:
            return jsonify({'response': "I don't know. The model did not provide an answer."})
        
        logger.info(f"Generated response: {generated_text}")
        
        return jsonify({'response': generated_text})
    except Exception as e:
        logger.error(f"Error during generation: {e}")
        traceback.print_exc()
        return jsonify({'response': "An error occurred during text generation."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
