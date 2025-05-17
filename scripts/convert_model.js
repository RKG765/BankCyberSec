const fs = require('fs');
const path = require('path');

async function convertModel() {
    try {
        // Create the model directory if it doesn't exist
        const modelDir = path.join(__dirname, '../models/transaction_model');
        if (!fs.existsSync(modelDir)) {
            fs.mkdirSync(modelDir, { recursive: true });
        }

        // Create model.json file
        const modelJson = {
            format: "layers-model",
            generatedBy: "keras v2.15.0",
            convertedBy: "TensorFlow.js Converter v4.17.0",
            modelTopology: {
                class_name: "Sequential",
                config: {
                    name: "sequential_1",
                    layers: [
                        {
                            class_name: "Dense",
                            config: {
                                name: "dense_1",
                                trainable: true,
                                units: 16,
                                activation: "relu",
                                use_bias: true,
                                kernel_initializer: {
                                    class_name: "GlorotUniform",
                                    config: { seed: null }
                                },
                                bias_initializer: {
                                    class_name: "Zeros",
                                    config: {}
                                },
                                kernel_regularizer: null,
                                bias_regularizer: null,
                                activity_regularizer: null,
                                kernel_constraint: null,
                                bias_constraint: null
                            }
                        },
                        {
                            class_name: "Dense",
                            config: {
                                name: "dense_2",
                                trainable: true,
                                units: 8,
                                activation: "relu",
                                use_bias: true,
                                kernel_initializer: {
                                    class_name: "GlorotUniform",
                                    config: { seed: null }
                                },
                                bias_initializer: {
                                    class_name: "Zeros",
                                    config: {}
                                },
                                kernel_regularizer: null,
                                bias_regularizer: null,
                                activity_regularizer: null,
                                kernel_constraint: null,
                                bias_constraint: null
                            }
                        },
                        {
                            class_name: "Dense",
                            config: {
                                name: "dense_3",
                                trainable: true,
                                units: 1,
                                activation: "sigmoid",
                                use_bias: true,
                                kernel_initializer: {
                                    class_name: "GlorotUniform",
                                    config: { seed: null }
                                },
                                bias_initializer: {
                                    class_name: "Zeros",
                                    config: {}
                                },
                                kernel_regularizer: null,
                                bias_regularizer: null,
                                activity_regularizer: null,
                                kernel_constraint: null,
                                bias_constraint: null
                            }
                        }
                    ]
                }
            },
            weightsManifest: [
                {
                    paths: ["weights.bin"],
                    weights: [
                        { name: "dense_1/kernel", shape: [3, 16], dtype: "float32" },
                        { name: "dense_1/bias", shape: [16], dtype: "float32" },
                        { name: "dense_2/kernel", shape: [16, 8], dtype: "float32" },
                        { name: "dense_2/bias", shape: [8], dtype: "float32" },
                        { name: "dense_3/kernel", shape: [8, 1], dtype: "float32" },
                        { name: "dense_3/bias", shape: [1], dtype: "float32" }
                    ]
                }
            ]
        };

        // Save model.json
        fs.writeFileSync(
            path.join(modelDir, 'model.json'),
            JSON.stringify(modelJson, null, 2)
        );

        console.log('Model structure saved successfully!');
    } catch (error) {
        console.error('Error converting model:', error);
    }
}

convertModel(); 