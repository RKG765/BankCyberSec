const fs = require('fs');
const path = require('path');

async function applyWeights() {
    try {
        // Load the weights from JSON
        const weightsPath = path.join(__dirname, '../models/transaction_model/weights.json');
        const weightsData = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));
        
        // Convert weights to binary format
        const weightsBuffer = Buffer.from(JSON.stringify(weightsData));
        
        // Save weights to binary file
        const modelDir = path.join(__dirname, '../models/transaction_model');
        fs.writeFileSync(path.join(modelDir, 'weights.bin'), weightsBuffer);
        
        console.log('Weights saved successfully!');
    } catch (error) {
        console.error('Error applying weights:', error);
    }
}

applyWeights(); 