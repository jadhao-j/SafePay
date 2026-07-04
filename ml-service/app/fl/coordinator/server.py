"""SafePay Federated Learning Server"""

import json
import os
import urllib.request
from pathlib import Path

import numpy as np
import xgboost as xgb

from flwr.app import ArrayRecord, Context
from flwr.common.config import unflatten_dict
from flwr.serverapp import Grid, ServerApp

from app.fl.coordinator.strategy import create_strategy
from app.fl.task import get_run_config

# Create Flower Server
app = ServerApp()

SERVICE_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = SERVICE_ROOT / "fraud_model_fl.json"
ROUND_LOG_PATH = SERVICE_ROOT / "data" / "fl_rounds.jsonl"


def _notify_model_reload(round_number: int, participating_clients: list[str], metrics: dict) -> None:
    """Notify the ML service to reload the latest federated model."""

    ml_service_url = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8001")
    backend_url = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
    payload = {
        "round_number": round_number,
        "model_version": os.getenv("MODEL_VERSION", "fl-xgboost-v1"),
        "participating_clients": participating_clients,
        "metrics": metrics,
    }

    def _post_json(url: str, suffix: str) -> None:
        request = urllib.request.Request(
            f"{url}{suffix}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=5) as response:
            response.read()

    try:
        _post_json(ml_service_url, "/model/reload")
        print("Reload notification sent to ML service")
    except Exception as exc:  # pragma: no cover - best effort
        print(f"ML service reload notification failed: {exc}")

    try:
        _post_json(backend_url, "/api/v1/admin/fl-round")
        print("Round log notification sent to backend")
    except Exception as exc:  # pragma: no cover - best effort
        print(f"Backend round log notification failed: {exc}")

    ROUND_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with ROUND_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")


@app.main()
def main(grid: Grid, context: Context):

    # ==========================================
    # Read Configuration
    # ==========================================

    cfg = get_run_config(context)
    num_rounds = int(cfg.get("num_server_rounds", 1))
    params = cfg["params"]

    # ==========================================
    # Initial Global Model
    # ==========================================

    global_model = b""

    arrays = ArrayRecord(
        [
            np.frombuffer(
                global_model,
                dtype=np.uint8,
            )
        ]
    )

    # ==========================================
    # Federated Strategy
    # ==========================================

    strategy = create_strategy()

    # ==========================================
    # Start Training
    # ==========================================

    result = strategy.start(
        grid=grid,
        initial_arrays=arrays,
        num_rounds=num_rounds,
    )

    # ==========================================
    # Save Global Model
    # ==========================================

    bst = xgb.Booster(params=params)

    if "0" not in result.arrays:
        print("No model arrays received - all clients failed. Skipping model save.")
        return

    global_model = bytearray(result.arrays["0"].numpy().tobytes())
    bst.load_model(global_model)

    print("\nSaving Federated Model...")
    bst.save_model(str(MODEL_PATH))

    participating_clients = os.getenv("FL_CLIENTS", "bank_a,bank_b,bank_c").split(",")
    metrics = {
        "num_rounds": int(num_rounds),
        "status": "completed",
        "model_path": str(MODEL_PATH.name),
    }

    _notify_model_reload(
        
        round_number=int(num_rounds),
        participating_clients=[client.strip() for client in participating_clients if client.strip()],
        metrics=metrics,
    )
