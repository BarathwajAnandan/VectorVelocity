import os
import json
import asyncio
import aiohttp
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Read API Provider configurations from JSON file
with open('api_providers.json', 'r') as f:
    API_PROVIDERS = json.load(f)

# Replace environment variable placeholders with actual values
for provider in API_PROVIDERS.values():
    if provider['apiKey'].startswith('process.env.'):
        env_var_name = provider['apiKey'].replace('process.env.', '')
        provider['apiKey'] = os.getenv(env_var_name)

async def make_api_call(provider, prompt):
    headers = {
        'Authorization': f"Bearer {provider['apiKey']}",
        'Content-Type': 'application/json'
    }
    
    payload = {
        'model': provider['selectedModel'],
        'messages': [
            {'role': 'system', 'content': 'You are a helpful assistant'},
            {'role': 'user', 'content': prompt}
        ],
        'stream': True
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(provider['apiUrl'], headers=headers, json=payload) as response:
            if response.status != 200:
                raise Exception(f"HTTP error! status: {response.status}")
            
            async for line in response.content:
                yield line.decode('utf-8')

async def stream_tokens_per_second(provider, prompt):
    try:
        start_time = asyncio.get_event_loop().time()
        token_count = 0
        buffer = ''

        async for chunk in make_api_call(provider, prompt):
            buffer += chunk
            lines = buffer.split('\n')
            buffer = lines.pop()

            for line in lines:
                if line.startswith('data: '):
                    data = line[6:].strip()
                    if data == '[DONE]':
                        break
                    
                    try:
                        json_data = json.loads(data)
                        content = json_data['choices'][0]['delta'].get('content', '')
                        print(f'content: {content}')
                        if content:
                            token_count += len(content.strip().split())
                            elapsed_time = asyncio.get_event_loop().time() - start_time
                            if elapsed_time > 0:
                                tokens_per_second = token_count / elapsed_time
                                print(f'tokenCount: {token_count}, elapsedTime: {elapsed_time:.2f}, tokensPerSecond: {tokens_per_second:.2f}')
                                provider['tokensPerSecondList'].append(tokens_per_second)
                                yield tokens_per_second
                    except json.JSONDecodeError:
                        print('Error parsing JSON:', data)

    except Exception as error:
        print('Error:', str(error))
        yield 0

async def run_tokens_per_second_comparison(prompt):
    results = {}

    for provider_name, provider in API_PROVIDERS.items():
        print(f"Starting comparison for {provider['name']}")
        provider['tokensPerSecondList'] = []
        async for tokens_per_second in stream_tokens_per_second(provider, prompt):
            pass  # We're just collecting the data, not using it immediately

        if provider['tokensPerSecondList']:
            avg_tokens_per_second = sum(provider['tokensPerSecondList']) / len(provider['tokensPerSecondList'])
            results[provider['name']] = avg_tokens_per_second
            print(f"Average tokens per second for {provider['name']}: {avg_tokens_per_second:.2f}")
        else:
            print(f"No valid tokens received for {provider['name']}. Check the API response.")

    return results

# Example usage
async def main():
    prompt = "Tell me about the Milky Way galaxy in 100 words"
    results = await run_tokens_per_second_comparison(prompt)
    print("Final results:", results)

if __name__ == "__main__":
    asyncio.run(main())
