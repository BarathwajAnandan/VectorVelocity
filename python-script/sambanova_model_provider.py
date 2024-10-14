from model_provider import ModelProvider
import os
import openai


class SambanovaModelProvider(ModelProvider):
    PROVIDER_NAME = "SambaNova"

    def __init__(self, model: str):
        self.client = openai.OpenAI(
            api_key=os.getenv("SAMBANOVA_API_KEY"),
            base_url="https://api.sambanova.ai/v1",
        )
        self.model = model

    def generate_response(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}], model=self.model
        )
        return response.choices[0].message.content
