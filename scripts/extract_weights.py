import json
import numpy as np
import tensorflow as tf
import os

def extract_weights_from_ipynb(ipynb_path):
    # Read the IPYNB file
    with open(ipynb_path, 'r') as f:
        notebook = json.load(f)
    
    # Extract the model weights from the notebook
    weights = []
    for cell in notebook['cells']:
        if cell['cell_type'] == 'code':
            for line in cell['source']:
                if 'model.get_weights()' in line or 'model.weights' in line:
                    # Extract weights from the output
                    weights = eval(line.strip())
                    break
    
    return weights

def save_weights_to_json(weights, output_path):
    # Convert weights to JSON-serializable format
    weights_json = []
    for w in weights:
        weights_json.append(w.tolist())
    
    # Save weights to JSON file
    with open(output_path, 'w') as f:
        json.dump(weights_json, f)

def main():
    # Path to your IPYNB file
    ipynb_path = r'C:\Users\RAJ KUMAR GUPTA\Desktop\BML\Semester-IV\prj2\AI-powered-Fraud-Detection System.ipynb'
    
    # Create output directory if it doesn't exist
    output_dir = '../models/transaction_model'
    os.makedirs(output_dir, exist_ok=True)
    
    # Extract weights
    weights = extract_weights_from_ipynb(ipynb_path)
    
    # Save weights to JSON
    output_path = os.path.join(output_dir, 'weights.json')
    save_weights_to_json(weights, output_path)
    print(f'Weights saved to {output_path}')

if __name__ == '__main__':
    main() 