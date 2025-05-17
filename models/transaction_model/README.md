# Transaction Validation AI Model

This directory contains the AI model used for validating bank transactions. The model helps detect potentially fraudulent or suspicious transactions based on various features.

## Model Structure

The model takes the following features as input:
- Transaction amount
- Time of transaction (hour of day)
- Description length

## Setup Instructions

1. Install the required dependencies:
```bash
npm install
```

2. Place your trained model files in this directory:
   - `model.json`: The model architecture and weights
   - `weights.bin`: The model weights (if separate from model.json)

## Model Training

To train a new model:

1. Prepare your training data with the following features:
   - Transaction amount
   - Time of transaction
   - Description length
   - Label (0 for suspicious, 1 for legitimate)

2. Use TensorFlow.js to train the model:
```javascript
const model = tf.sequential();
model.add(tf.layers.dense({units: 16, activation: 'relu', inputShape: [3]}));
model.add(tf.layers.dense({units: 8, activation: 'relu'}));
model.add(tf.layers.dense({units: 1, activation: 'sigmoid'}));

model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
});

// Train the model
await model.fit(features, labels, {
    epochs: 100,
    validationSplit: 0.2
});

// Save the model
await model.save('file://./models/transaction_model');
```

## Model Usage

The model is automatically loaded when the server starts and is used to validate transactions in real-time. The validation endpoint `/api/transactions/validate` returns:

```json
{
    "isValid": boolean,
    "confidence": number,
    "reason": string | null
}
```

## Security Considerations

- The model is loaded only once when the server starts
- All predictions are made server-side
- Model files should be kept secure and not exposed to clients
- Regular model updates are recommended based on new transaction patterns 