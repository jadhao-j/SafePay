"""Federated Learning task utilities for SafePay."""

import os
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from flwr.common.config import unflatten_dict
from sklearn.model_selection import train_test_split

# ==========================================================
# Dataset Folder
# ==========================================================

SERVICE_ROOT = Path(__file__).resolve().parents[2]
DATASET_FOLDER = SERVICE_ROOT / "data"
DATASET_PATH = DATASET_FOLDER / "train_transaction.csv"

# ==========================================================
# Client Partitioning
# ==========================================================


def get_partition_frame(partition_id: int, num_partitions: int = 3) -> pd.DataFrame:
    """Return only the rows assigned to the given client partition."""

    if not 0 <= partition_id < num_partitions:
        raise ValueError(f"Invalid partition id: {partition_id}")

    df = pd.read_csv(DATASET_PATH)
    df = df.reset_index(drop=True)
    df["_partition"] = np.arange(len(df)) % num_partitions
    partition = df[df["_partition"] == partition_id].copy()
    partition.drop(columns=["_partition"], inplace=True)
    return partition.reset_index(drop=True)


def load_data(partition_id: int, num_partitions: int = 3):
    """Load only one bank partition from the shared training data."""

    partition_frame = get_partition_frame(partition_id, num_partitions=num_partitions)
    print(f"\nLoading Dataset Partition {partition_id}: {len(partition_frame)} rows")

    X = partition_frame.drop("isFraud", axis=1)
    y = partition_frame["isFraud"]

    X_train, X_valid, y_train, y_valid = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42 + partition_id,
        stratify=y,
    )

    # Encode string columns to numeric before XGBoost
    string_cols = X_train.select_dtypes(include="object").columns.tolist()
    for col in string_cols:
        X_train[col] = X_train[col].astype("category").cat.codes
        X_valid[col] = X_valid[col].astype("category").cat.codes
    train_dmatrix = xgb.DMatrix(X_train, label=y_train)
    valid_dmatrix = xgb.DMatrix(X_valid, label=y_valid)

    return train_dmatrix, valid_dmatrix, len(X_train), len(X_valid)


DEFAULT_FL_PARAMS = {
    "objective": "binary:logistic",
    "eta": 0.1,
    "max_depth": 8,
    "eval_metric": "auc",
    "nthread": 16,
    "num_parallel_tree": 1,
    "subsample": 1,
    "tree_method": "hist",
}


def replace_keys(input_dict, match="-", target="_"):
    """Replace '-' with '_' in Flower config keys."""

    new_dict = {}

    for key, value in input_dict.items():
        new_key = key.replace(match, target)
        if isinstance(value, dict):
            new_dict[new_key] = replace_keys(value, match, target)
        else:
            new_dict[new_key] = value

    return new_dict


def get_run_config(context):
    """Return a normalized run configuration with sensible defaults."""

    raw_run_config = getattr(context, "run_config", {}) or {}
    if not isinstance(raw_run_config, dict):
        raw_run_config = {}

    run_config = dict(raw_run_config)
    run_config.setdefault("num-server-rounds", int(os.getenv("NUM_SERVER_ROUNDS", "1")))
    run_config.setdefault("local-epochs", int(os.getenv("LOCAL_EPOCHS", "1")))
    run_config.setdefault("fraction-train", float(os.getenv("FRACTION_TRAIN", "1.0")))
    run_config.setdefault("fraction-evaluate", float(os.getenv("FRACTION_EVALUATE", "1.0")))
    run_config.setdefault("params", DEFAULT_FL_PARAMS)

    return replace_keys(unflatten_dict(run_config))
