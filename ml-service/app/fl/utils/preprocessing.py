
import os
import joblib
import pandas as pd

from sklearn.preprocessing import LabelEncoder

# ==========================================
# SafePay Federated Learning Preprocessing
# ==========================================

DATASET_FOLDER = r"D:\final year project\SafePay\fl-service\app\datasets"

BANK_FILES = [
    "bank_a.csv",
    "bank_b.csv",
    "bank_c.csv"
]

print("=" * 60)
print("SafePay Federated Learning Dataset Preprocessing")
print("=" * 60)

for file_name in BANK_FILES:

    print(f"\nProcessing {file_name}...")

    file_path = os.path.join(DATASET_FOLDER, file_name)

    df = pd.read_csv(file_path)

    print("Original Shape:", df.shape)

    # =====================================
    # Drop Columns (>80% Missing)
    # =====================================

    missing_percentage = df.isnull().mean()

    columns_to_drop = missing_percentage[
        missing_percentage > 0.80
    ].index

    df = df.drop(columns=columns_to_drop)

    print("After Dropping Columns:", df.shape)

    # =====================================
    # Fill Missing Values
    # =====================================

    df = df.fillna(0)

    # =====================================
    # Encode Categorical Columns
    # =====================================

    categorical_columns = df.select_dtypes(
        include=["object"]
    ).columns

    encoders = {}

    for col in categorical_columns:

        encoder = LabelEncoder()

        df[col] = encoder.fit_transform(
            df[col].astype(str)
        )

        encoders[col] = encoder

    # =====================================
    # Save Processed Dataset
    # =====================================

    processed_file = file_name.replace(
        ".csv",
        "_processed.csv"
    )

    processed_path = os.path.join(
        DATASET_FOLDER,
        processed_file
    )

    df.to_csv(
        processed_path,
        index=False
    )

    print(f"Saved: {processed_file}")

print("\nSaving Encoders...")

joblib.dump(
    encoders,
    os.path.join(DATASET_FOLDER, "fl_encoders.pkl")
)

print("\nPreprocessing Completed Successfully!")