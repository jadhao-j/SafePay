import os
import pandas as pd
from sklearn.model_selection import train_test_split

# ==========================================
# SafePay - Federated Learning Dataset Splitter
# ==========================================

# Original IEEE Fraud Dataset
dataset_path = r"D:\final year project\SafePay\ml-service\data\train_transaction.csv"

# Output Folder
output_folder = r"D:\final year project\SafePay\fl-service\app\datasets"

# ==========================================
# Load Dataset
# ==========================================

print("Loading Dataset...")

df = pd.read_csv(dataset_path)

print(f"Original Dataset Shape: {df.shape}")

# ==========================================
# Shuffle Dataset
# ==========================================

print("\nShuffling Dataset...")

df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# ==========================================
# Split Dataset into 3 Banks
# ==========================================

print("\nSplitting Dataset...")

part1, temp = train_test_split(
    df,
    test_size=2/3,
    random_state=42,
    shuffle=True
)

part2, part3 = train_test_split(
    temp,
    test_size=0.5,
    random_state=42,
    shuffle=True
)

print(f"Bank A Shape : {part1.shape}")
print(f"Bank B Shape : {part2.shape}")
print(f"Bank C Shape : {part3.shape}")

# ==========================================
# Create Output Folder
# ==========================================

os.makedirs(output_folder, exist_ok=True)

# ==========================================
# Save CSV Files
# ==========================================

bank_a_path = os.path.join(output_folder, "bank_a.csv")
bank_b_path = os.path.join(output_folder, "bank_b.csv")
bank_c_path = os.path.join(output_folder, "bank_c.csv")

part1.to_csv(bank_a_path, index=False)
part2.to_csv(bank_b_path, index=False)
part3.to_csv(bank_c_path, index=False)

# ==========================================
# Verify Saved Files
# ==========================================

print("\nVerifying Files...")

print(f"Bank A Exists : {os.path.exists(bank_a_path)}")
print(f"Bank B Exists : {os.path.exists(bank_b_path)}")
print(f"Bank C Exists : {os.path.exists(bank_c_path)}")

print(f"Bank A Size : {os.path.getsize(bank_a_path):,} bytes")
print(f"Bank B Size : {os.path.getsize(bank_b_path):,} bytes")
print(f"Bank C Size : {os.path.getsize(bank_c_path):,} bytes")

print("\n==========================================")
print("Datasets Created Successfully!")
print("Location:")
print(output_folder)
print("==========================================")