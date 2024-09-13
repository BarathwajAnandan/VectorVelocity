// Import required modules
const dotenv = require('dotenv');
import('node-fetch').then(({ default: fetch }) => {
  // Your code using fetch goes here
}).catch(err => console.error('Failed to load node-fetch:', err));
const OpenAI = require('openai');

// Load environment variables
dotenv.config();

// API Provider configurations
const API_PROVIDERS = {
    GROQ: {
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.1-70b-versatile',
        makeApiCall: makeGroqApiCall
    },
    SAMBANOVA: {
        name: 'SambaNova',
        apiUrl: 'https://api.sambanova.ai/v1/chat/completions',
        apiKey: process.env.SNOVA_API_KEY,
        model: 'Meta-Llama-3.1-70B-Instruct',
        makeApiCall: makeSambanovaApiCall
    },
    NVIDIA: {
        name: 'NVIDIA',
        apiKey: process.env.NVIDIA_API_KEY,
        model: 'meta/llama-3.1-70b-instruct',
        makeApiCall: makeNvidiaApiCall
    }
    // Add more providers here as needed
};

// Generic function to make API calls
async function makeApiCall(provider, prompt) {
    const headers = {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
    };
    
    const payload = {
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
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
    const openai = new OpenAI({
        apiKey: API_PROVIDERS.NVIDIA.apiKey,
        baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const completion = await openai.chat.completions.create({
        model: API_PROVIDERS.NVIDIA.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
        stream: true
    });

    return completion[Symbol.asyncIterator]();
}

// Function to stream tokens per second
async function* streamTokensPerSecond(provider, prompt) {
    try {
        const reader = await provider.makeApiCall(prompt);
        const decoder = new TextDecoder();

        let startTime = Date.now();
        let tokenCount = 0;
        let buffer = '';

        if (provider.name === 'NVIDIA') {
            for await (const chunk of reader) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    tokenCount += content.trim().split(/\s+/).filter(word => word.length > 0).length;
                    const elapsedTime = (Date.now() - startTime) / 1000;
                    const tokensPerSecond = tokenCount / elapsedTime;
                    yield tokensPerSecond;
                }
            }
        } else {
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
                                const tokensPerSecond = tokenCount / elapsedTime;
                                yield tokensPerSecond;
                            }
                        } catch (parseError) {
                            console.warn('Error parsing JSON:', parseError);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        yield 0;
    }
}

// Function to update tokens per second for a given provider
async function updateTokensPerSecond(provider, prompt) {
    const tokenStream = streamTokensPerSecond(provider, prompt);
    let totalTokensPerSecond = 0;
    let count = 0;

    for await (const tokensPerSecond of tokenStream) {
        console.log(`Current tokens per second (${provider.name}): ${tokensPerSecond.toFixed(2)}`);
        totalTokensPerSecond += tokensPerSecond;
        count++;
        // Update your UI here, e.g.:
        // document.getElementById(`${provider.name.toLowerCase()}TokensPerSecond`).textContent = tokensPerSecond.toFixed(2);
    }

    return count > 0 ? totalTokensPerSecond / count : 0;
}

// Example usage
async function runTokensPerSecondComparison() {
    const prompt = 'Tell me about the Milky Way galaxy in 1000 words';
    const results = {};

    // Run for each provider
    for (const provider of Object.values(API_PROVIDERS)) {
        results[provider.name] = await updateTokensPerSecond(provider, prompt);
    }

    // Calculate and print average tokens per second
    for (const [providerName, avgTokensPerSecond] of Object.entries(results)) {
        console.log(`Average tokens per second for ${providerName}: ${avgTokensPerSecond.toFixed(2)}`);
    }
}

// Call this function to start the comparison
runTokensPerSecondComparison();

// To add a new provider, simply add a new entry to the API_PROVIDERS object
// and implement its specific makeApiCall function if needed.
// Example:
/*
API_PROVIDERS.NEW_PROVIDER = {
    name: 'New Provider',
    apiUrl: 'https://api.newprovider.com/v1/chat/completions',
    apiKey: process.env.NEW_PROVIDER_API_KEY,
    model: 'new-provider-model',
    makeApiCall: makeNewProviderApiCall
};

async function makeNewProviderApiCall(prompt) {
    // Implement the specific API call for the new provider
    // or use the generic makeApiCall if it follows the same pattern
    return makeApiCall(API_PROVIDERS.NEW_PROVIDER, prompt);
}
*/
