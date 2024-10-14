import time
from model_provider import ModelProvider
from groq_model_provider import GroqModelProvider
from sambanova_model_provider import SambanovaModelProvider
from dotenv import load_dotenv
import os
from datetime import datetime
import json
import logging

logging.basicConfig(
    filename="metrics_app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def measure_tokens_per_second(prompt: str, model_provider: ModelProvider) -> float:
    start_time = time.time()
    generated_text = model_provider.generate_response(prompt)
    end_time = time.time()
    elapsed_time = end_time - start_time
    num_tokens = len(generated_text.split())
    tokens_per_second = num_tokens / elapsed_time if elapsed_time > 0 else 0
    return tokens_per_second


load_dotenv()
if not os.path.isdir("../metrics"):
    os.makedirs("../metrics")
current_date = datetime.today().strftime("%Y-%m-%d")

model_providers = [
    GroqModelProvider("llama-3.1-8b-instant"),
    SambanovaModelProvider("Meta-Llama-3.1-8B-Instruct"),
]
prompt = "Talk about the signifincance of the milky way galaxy"

data = {"metricDate": current_date, "metrics": []}
for model_provider in model_providers:
    metrics = []
    for _ in range(3):
        metrics.append(measure_tokens_per_second(prompt, model_provider))
    avg_tokens_per_second = int(sum(metrics) / len(metrics))
    logger.info(
        f"Provider: {model_provider.PROVIDER_NAME}, Average Tokens Per Second: {avg_tokens_per_second}"
    )
    data["metrics"].append(
        {
            "provider": model_provider.PROVIDER_NAME,
            "tokenVelocity": avg_tokens_per_second,
        }
    )

with open(f"../metrics/{current_date}_run.json", "w") as f:
    json.dump(data, f)
logger.info(f"Successfully saved metrics to ../metrics/{current_date}_run.json")
