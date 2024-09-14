// Import required modules
const dotenv = require('dotenv');
const OpenAI = require('openai');

// Load environment variables
dotenv.config();

// Original API Provider configurations
const API_PROVIDER_OG = {
    TOGETHERAI: {
        name: 'TogetherAI',
        apiUrl: 'https://api.together.xyz/v1/chat/completions',
        apiKey: process.env.TOGETHERAI_API_KEY,
        models: [
            'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
            'meta-llama/Meta-Llama-3.1-70B-Instruct',
            'meta-llama/Meta-Llama-3.1-34B-Instruct'
        ],
        selectedModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        makeApiCall: makeTogetherAIApiCall,
        tokensPerSecondList: []
    },
    GROQ: {
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY,
        models: [
            'llama-3.1-70b-versatile',
            'llama-3.1-34b-versatile'
        ],
        selectedModel: 'llama-3.1-70b-versatile',
        makeApiCall: makeGroqApiCall,
        tokensPerSecondList: []
    },
    SAMBANOVA: {
        name: 'SambaNova',
        apiUrl: 'https://api.sambanova.ai/v1/chat/completions',
        apiKey: process.env.SNOVA_API_KEY,
        models: [
            'Meta-Llama-3.1-70B-Instruct',
            'Meta-Llama-3.1-34B-Instruct'
        ],
        selectedModel: 'Meta-Llama-3.1-70B-Instruct',
        makeApiCall: makeSambanovaApiCall,
        tokensPerSecondList: []
    },
    NVIDIA: {
        name: 'NVIDIA',
        apiUrl: 'https://integrate.api.nvidia.com/v1/chat/completions',
        apiKey: process.env.NVIDIA_API_KEY,
        models: [
            'meta/llama-3.1-70b-instruct',
            'meta/llama-3.1-34b-instruct'
        ],
        selectedModel: 'meta/llama-3.1-70b-instruct',
        makeApiCall: makeNvidiaApiCall,
        tokensPerSecondList: []
    },
    // Add more providers here as needed
};

// Create a copy of the original API providers
let API_PROVIDERS = { ...API_PROVIDER_OG };

// Function to update active providers based on checkbox state
function updateActiveProviders() {
    const activeProviders = Array.from(document.querySelectorAll('input[name="provider"]:checked')).map(checkbox => checkbox.value);
    console.log('Active providers:', activeProviders);

    // Remove providers that are not active
    for (const provider in API_PROVIDERS) {
        if (!activeProviders.includes(provider)) {
            delete API_PROVIDERS[provider]; // Remove the provider if unchecked
        }
    }
}

// Call this function whenever a checkbox state changes
document.addEventListener('DOMContentLoaded', () => {
    const providerCheckboxes = document.querySelectorAll('input[name="provider"]');
    providerCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateActiveProviders();
            console.log('Active providers:', API_PROVIDERS);
            // updateProviderNames();
        });
    });
});

// Function to update provider names and model selection in the UI
function updateProviderNames() {
    const modelNamesContainer = document.getElementById('modelNames');
    modelNamesContainer.innerHTML = ''; // Clear existing names

    Object.keys(API_PROVIDERS).forEach(providerKey => {
        const provider = API_PROVIDERS[providerKey];
        const providerDiv = document.createElement('div');
        providerDiv.className = 'model-name';
        
        const modelSelect = document.createElement('select');
        modelSelect.id = `${providerKey}-model`;
        modelSelect.name = `${providerKey}-model`;
        provider.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            if (model === provider.selectedModel) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });

        modelSelect.addEventListener('change', (event) => {
            provider.selectedModel = event.target.value;
            console.log(`Selected model for ${provider.name}: ${provider.selectedModel}`);
        });

        providerDiv.innerHTML = `
            <input type="checkbox" id="${providerKey}" name="provider" value="${providerKey}" checked>
            <label for="${providerKey}">${provider.name}</label>
        `;
        providerDiv.appendChild(modelSelect);
        modelNamesContainer.appendChild(providerDiv);
    });
}

// Call this function to initialize the provider names when the page loads
updateProviderNames();

// Generic function to make API calls
async function makeApiCall(provider, prompt) {
    const headers = {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
    };
    
    const payload = {
        model: provider.selectedModel,
        messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: prompt }
        ],
        stream: true
    };

    const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body.getReader();
}

// Specific API call functions
async function makeGroqApiCall(prompt) {
    return makeApiCall(API_PROVIDERS.GROQ, prompt);
}

async function makeSambanovaApiCall(prompt) {
    return makeApiCall(API_PROVIDERS.SAMBANOVA, prompt);
}

async function makeNvidiaApiCall(prompt) {
    const headers = {
        'Authorization': `Bearer ${API_PROVIDERS.NVIDIA.apiKey}`,
        'Content-Type': 'application/json'
    };
    
    const payload = {
        model: API_PROVIDERS.NVIDIA.selectedModel,
        messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: prompt }
        ],
        stream: true,
        max_tokens: 1024,
        presence_penalty: 0,
        frequency_penalty: 0,
        top_p: 0.7,
        temperature: 0.2
    };

    const response = await fetch(API_PROVIDERS.NVIDIA.apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body.getReader();
}

async function makeTogetherAIApiCall(prompt) {
    const headers = {
        'Authorization': `Bearer ${API_PROVIDERS.TOGETHERAI.apiKey}`,
        'Content-Type': 'application/json'
    };
    
    const payload = {
        model: API_PROVIDERS.TOGETHERAI.selectedModel,
        messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: prompt }
        ],
        stream: true
    };

    const response = await fetch(API_PROVIDERS.TOGETHERAI.apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.body.getReader();
}

// Function to stream tokens per second
async function* streamTokensPerSecond(provider, prompt) {
    try {
        const reader = await provider.makeApiCall(prompt);
        const decoder = new TextDecoder();

        let startTime = Date.now();
        let tokenCount = 0;
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') break;
                    
                    try {
                        const jsonData = JSON.parse(data);
                        const content = jsonData.choices[0]?.delta?.content || '';
                        if (content) {
                            tokenCount += content.trim().split(/\s+/).filter(word => word.length > 0).length;
                            const elapsedTime = (Date.now() - startTime) / 1000;
                            if (elapsedTime > 0) {
                                const tokensPerSecond = tokenCount / elapsedTime;
                                provider.tokensPerSecondList.push(tokensPerSecond);
                                yield tokensPerSecond;
                            }
                        }
                    } catch (parseError) {
                        console.warn('Error parsing JSON:', parseError);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        yield 0;
    }
}

// Function to stream responses from all API providers concurrently
async function streamAllProviders(prompt) {
    const providerStreams = Object.values(API_PROVIDERS).map(provider => ({
        name: provider.name,
        stream: streamTokensPerSecond(provider, prompt)
    }));

    const results = {};
    const startTime = Date.now();

    const handleStream = async ({ name, stream }) => {
        let totalTokens = 0;
        let lastUpdateTime = startTime;

        console.log(`Starting to handle stream for ${name}`);

        let skipCount = 0;
        for await (const value of stream) {
            if (skipCount < 4) {
                skipCount++;
                continue;
            }

            if (value > 0) {
                const provider = Object.values(API_PROVIDERS).find(p => p.name === name);
                if (provider) {
                    provider.tokensPerSecondList.push(value);
                } else {
                    console.warn(`Provider ${name} not found in API_PROVIDERS`);
                }
            }
        }

        console.log(`Stream handling completed for ${name}`);

        const provider = Object.values(API_PROVIDERS).find(p => p.name === name);
        if (provider && provider.tokensPerSecondList.length > 0) {
            const avgTokensPerSecond = provider.tokensPerSecondList.reduce((acc, curr) => acc + curr, 0) / provider.tokensPerSecondList.length;
            console.log(`Average tokens per second for ${name}: ${avgTokensPerSecond.toFixed(2)}`);
            results[name] = { totalTokens, avgTokensPerSecond };
        } else {
            console.warn(`No tokens per second data available for ${name}`);
        }
    };

    await Promise.all(providerStreams.map(handleStream));

    for (const provider of Object.values(API_PROVIDERS)) {
        console.log(`Tokens per second list for ${provider.name}:`, provider.tokensPerSecondList);
    }

    return results;
}

// Example usage of the new function
async function runSimultaneousComparison() {
    const prompt = 'Tell me about the Milky Way galaxy in 100 words';
    console.log('Starting simultaneous comparison for all providers');
    const results = await streamAllProviders(prompt);
    
    for (const [providerName, result] of Object.entries(results)) {
        console.log(`Results for ${providerName}:`, result);
    }

    console.log('Finished simultaneous comparison');
    return results;
}

// Function to update tokens per second for a given provider
async function updateTokensPerSecond(provider, prompt) {
    const tokenStream = streamTokensPerSecond(provider, prompt);
    let totalTokensPerSecond = 0;
    let count = 0;

    for await (const tokensPerSecond of tokenStream) {
        if (tokensPerSecond > 0) {
            console.log(`Current tokens per second (${provider.name}): ${tokensPerSecond.toFixed(2)}`);
            totalTokensPerSecond += tokensPerSecond;
            count++;
        }
    }

    if (count === 0) {
        console.warn(`No valid tokens received for ${provider.name}. Check the API response.`);
        return 0;
    }

    console.log(`Tokens per second list for ${provider.name}:`, provider.tokensPerSecondList);

    return totalTokensPerSecond / count;
}

// Example usage
async function runTokensPerSecondComparison() {
    const prompt = 'Tell me about the Milky Way galaxy in 100 words';
    const results = {};

    for (const provider of Object.values(API_PROVIDERS)) {
        console.log(`Starting comparison for ${provider.name}`);
        results[provider.name] = await updateTokensPerSecond(provider, prompt);
        console.log(`Finished comparison for ${provider.name}. Result: ${results[provider.name]}`);
    }

    for (const [providerName, avgTokensPerSecond] of Object.entries(results)) {
        console.log(`Debug - Raw value for ${providerName}:`, avgTokensPerSecond);
        console.log(`Debug - Is finite: ${isFinite(avgTokensPerSecond)}, Is NaN: ${isNaN(avgTokensPerSecond)}`);
        
        if (isFinite(avgTokensPerSecond) && !isNaN(avgTokensPerSecond) && avgTokensPerSecond > 0) {
            console.log(`Average tokens per second for ${providerName}: ${avgTokensPerSecond.toFixed(2)}`);
        } else {
            console.log(`Average tokens per second for ${providerName}: Unable to calculate (possibly no valid tokens received)`);
        }
    }

    return results;
}

// Function to get tokens per second list for a specific provider
function getTokensPerSecondList(providerName) {
    const provider = API_PROVIDERS[providerName.toUpperCase()];
    if (provider) {
        return provider.tokensPerSecondList;
    } else {
        console.warn(`Provider ${providerName} not found.`);
        return null;
    }
}

// Expose API_PROVIDERS and getTokensPerSecondList to the global scope
global.API_PROVIDERS = API_PROVIDERS;
global.getTokensPerSecondList = getTokensPerSecondList;
