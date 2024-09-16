// Import required modules
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Read API Provider configurations from JSON file
const API_PROVIDER_OG = JSON.parse(fs.readFileSync(path.join(__dirname, 'api_providers.json'), 'utf8'));

// Dynamically import makeApiCall functions
for (const provider in API_PROVIDER_OG) {
    const makeApiCallFunctionName = API_PROVIDER_OG[provider].makeApiCall;
    API_PROVIDER_OG[provider].makeApiCall = eval(makeApiCallFunctionName);
}

// Replace environment variable placeholders with actual values
for (const provider in API_PROVIDER_OG) {
    if (API_PROVIDER_OG[provider].apiKey.startsWith('process.env.')) {
        const envVarName = API_PROVIDER_OG[provider].apiKey.replace('process.env.', '');
        API_PROVIDER_OG[provider].apiKey = process.env[envVarName];
    }
}

// Create a copy of the original API providers
let API_PROVIDERS = { ...API_PROVIDER_OG };

// Function to update active providers based on checkbox state
function updateActiveProviders() {
    const activeProviders = Array.from(document.querySelectorAll('input[name="provider"]:checked')).map(checkbox => checkbox.value);
    console.log('Active providers:', activeProviders);

    // Reset API_PROVIDERS to the original state
    API_PROVIDERS = { ...API_PROVIDER_OG };

    // Remove providers that are not active
    for (const provider in API_PROVIDERS) {
        if (!activeProviders.includes(provider)) {
            console.log(`Removing provider: ${provider}`);
            delete API_PROVIDERS[provider];
        } else {
            console.log(`Keeping provider: ${provider}`);
        }
    }

    console.log('Updated API_PROVIDERS:', Object.keys(API_PROVIDERS));
}

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
        let lastYieldTime = startTime;
        const yieldInterval = 33; // Yield every 500ms

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
                            const currentTime = Date.now();
                            const elapsedTime = (currentTime - startTime) / 1000;
                            
                            if (currentTime - lastYieldTime >= yieldInterval) {
                                const tokensPerSecond = tokenCount / elapsedTime;
                                console.log('tokenCount:', tokenCount, 'elapsedTime:', elapsedTime.toFixed(3), 'tokensPerSecond:', tokensPerSecond.toFixed(2));  
                                provider.tokensPerSecondList.push(tokensPerSecond);
                                yield tokensPerSecond;
                                lastYieldTime = currentTime;
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
    const currentPrompt = getCurrentPrompt();
    console.log(`Using prompt: ${currentPrompt}`);
    
    const providerStreams = Object.values(API_PROVIDERS).map(provider => ({
        name: provider.name,
        stream: streamTokensPerSecond(provider, currentPrompt)
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
    const currentPrompt = getCurrentPrompt();
    console.log('Starting simultaneous comparison for all providers');
    console.log(`Using prompt: ${currentPrompt}`);
    const results = await streamAllProviders(currentPrompt);
    
    for (const [providerName, result] of Object.entries(results)) {
        console.log(`Results for ${providerName}:`, result);
    }

    console.log('Finished simultaneous comparison');
    return results;
}

// Function to update tokens per second for a given provider
async function updateTokensPerSecond(provider, prompt) {
    const currentPrompt = getCurrentPrompt();
    console.log(`Updating tokens per second for ${provider.name}`);
    console.log(`Using prompt: ${currentPrompt}`);
    const tokenStream = streamTokensPerSecond(provider, currentPrompt);
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
    const currentPrompt = getCurrentPrompt();
    console.log(`Using prompt: ${currentPrompt}`);
    const results = {};

    for (const provider of Object.values(API_PROVIDERS)) {
        console.log(`Starting comparison for ${provider.name}`);
        results[provider.name] = await updateTokensPerSecond(provider, currentPrompt);
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

// Add this new function to get the current prompt
function getCurrentPrompt() {
    const promptInput = document.getElementById('promptInput');
    return promptInput.value || 'Tell me about the Milky Way galaxy in 200 words';
}

// Expose necessary functions to the global scope
global.API_PROVIDERS = API_PROVIDERS;
global.getTokensPerSecondList = getTokensPerSecondList;
global.updateActiveProviders = updateActiveProviders;
global.runSimultaneousComparison = runSimultaneousComparison;
global.getCurrentPrompt = getCurrentPrompt;
