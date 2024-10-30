import time
from model_provider import ModelProvider
from groq_model_provider import GroqModelProvider
from sambanova_model_provider import SambanovaModelProvider
from dotenv import load_dotenv
import os
from datetime import datetime
import json
import logging

METRICS_PATH = "../vector-velocity/metrics"


def create_dir(dir_path: str):
    if not os.path.isdir(dir_path):
        os.makedirs(dir_path)


def measure_tokens_per_second(prompt: str, model_provider: ModelProvider) -> float:
    start_time = time.time()
    generated_text = model_provider.generate_response(prompt)
    end_time = time.time()
    elapsed_time = end_time - start_time
    num_tokens = len(generated_text.split())
    tokens_per_second = num_tokens / elapsed_time if elapsed_time > 0 else 0
    return tokens_per_second


def read_json_file(file_path: str):
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as json_file:
            try:
                data = json.load(json_file)
                return data
            except json.JSONDecodeError:
                logger.error("Error: File is not a valid JSON.")
                raise Exception("File is not a valid JSON.")
    else:
        logger.error("Error: File does not exist.")
        return None


def save_provider_metrics(
    provider_name: str, avg_tokens_per_second: int, current_date: str
):
    current_provider_metric = read_json_file(
        f"{METRICS_PATH}/{provider_name}/metrics.json"
    )
    if current_provider_metric is not None:
        current_provider_metric["averageTokenVelocity"] = {
            "metricDate": current_date,
            "metricValue": avg_tokens_per_second,
        }

        if (
            current_provider_metric["peakTokenVelocity"]["metricValue"]
            < avg_tokens_per_second
        ):
            current_provider_metric["peakTokenVelocity"] = {
                "metricDate": current_date,
                "metricValue": avg_tokens_per_second,
            }

        if (
            current_provider_metric["lowestTokenVelocity"]["metricValue"]
            > avg_tokens_per_second
        ):
            current_provider_metric["lowestTokenVelocity"] = {
                "metricDate": current_date,
                "metricValue": avg_tokens_per_second,
            }
    else:
        current_provider_metric = {
            "averageTokenVelocity": {
                "metricDate": current_date,
                "metricValue": avg_tokens_per_second,
            },
            "peakTokenVelocity": {
                "metricDate": current_date,
                "metricValue": avg_tokens_per_second,
            },
            "lowestTokenVelocity": {
                "metricDate": current_date,
                "metricValue": avg_tokens_per_second,
            },
        }

    with open(f"{METRICS_PATH}/{model_provider.PROVIDER_NAME}/metrics.json", "w") as f:
        json.dump(current_provider_metric, f)
    logger.info(f"Successfully saved metrics for {provider_name}")


def read_last_5_files():
    files = [file for file in os.listdir(f"{METRICS_PATH}") if file.endswith(".json")]
    dates = sorted([file.split("_")[0] for file in files], reverse=True)
    recent_files = [f"{METRICS_PATH}/{date}_run.json" for date in dates[:5]]
    return recent_files


load_dotenv()

create_dir("../logs")
create_dir(f"{METRICS_PATH}")
create_dir(f"{METRICS_PATH}/latest_metrics")
create_dir(f"{METRICS_PATH}/recent_metrics")
create_dir(f"{METRICS_PATH}/{GroqModelProvider.PROVIDER_NAME}")
create_dir(f"{METRICS_PATH}/{SambanovaModelProvider.PROVIDER_NAME}")

current_date = datetime.today().strftime("%Y-%m-%d")
logging.basicConfig(
    filename=f"../logs/{current_date}.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

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

    save_provider_metrics(
        model_provider.PROVIDER_NAME, avg_tokens_per_second, current_date
    )


with open(f"{METRICS_PATH}/{current_date}_run.json", "w") as f:
    json.dump(data, f)
with open(f"{METRICS_PATH}/latest_metrics/metrics.json", "w") as f:
    json.dump(data, f)
logger.info(f"Successfully saved latest metrics")

recent_files = read_last_5_files()
metrics = []
for file in recent_files:
    metrics.append(read_json_file(file))
data = {"recentMetrics": metrics}

with open(f"{METRICS_PATH}/recent_metrics/metrics.json", "w") as f:
    json.dump(data, f)
logger.info(f"Successfully saved recent metrics")
