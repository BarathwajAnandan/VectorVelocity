from abc import ABC, abstractmethod


class ModelProvider(ABC):
    def generate_response(self, prompt: str) -> str:
        pass
