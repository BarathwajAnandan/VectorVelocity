from model_provider import ModelProvider
import os
from groq import Groq


class GroqModelProvider(ModelProvider):
    PROVIDER_NAME = "Groq"

    def __init__(self, model: str):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = model

    def generate_response(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}], model=self.model
        )
        return response.choices[0].message.content
