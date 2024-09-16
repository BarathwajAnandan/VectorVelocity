import os
import time
import asyncio
import aiohttp
from dotenv import load_dotenv
import json
load_dotenv()

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
API_URL = 'https://api.groq.com/openai/v1/chat/completions'

async def measure_streaming_time():
    headers = {
        'Authorization': f'Bearer {GROQ_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'model': 'llama3-70b-8192',
        'messages': [{'role': 'user', 'content': 'Write a short story about a robot learning to paint.'}],
        'max_tokens': None,
        'stream': True
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(API_URL, json=payload, headers=headers) as response:
            start_time = time.time()
            token_count = 0
            async for line in response.content:
                if line.startswith(b'data: '):
                    data = line[6:].decode('utf-8').strip()
                    if data == '[DONE]':
                        break
                    try:
                        json_data = json.loads(data)
                        if 'choices' in json_data and json_data['choices']:
                            content = json_data['choices'][0].get('delta', {}).get('content', '')
                            if content:
                                token_count += len(content.split())
                    except json.JSONDecodeError:
                        pass
                    
                    current_time = time.time()
                    elapsed_time = current_time - start_time
                    tokens_per_second = float(token_count) / elapsed_time
                    print(f"Tokens per second: {(tokens_per_second / 100):.2f}")

async def main():
    await measure_streaming_time()

if __name__ == '__main__':
    asyncio.run(main())
