import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib

# =====================================
# Load Dataset
# =====================================

df = pd.read_csv("data/train_transaction.csv")

# =====================================
# Drop Columns With >80% Missing Values
# =====================================

missing_percentage = df.isnull().mean()
columns_to_drop = missing_percentage[missing_percentage > 0.80].index

df = df.drop(columns=columns_to_drop)

print("Shape After Dropping Columns:")
print(df.shape)

# =====================================
# Fill Remaining Missing Values
# =====================================

df = df.fillna(0)

print("\nRemaining Missing Values:")
print(df.isnull().sum().sum())

# =====================================
# Find Categorical Columns
# =====================================

cat_cols = df.select_dtypes(include=["object"]).columns

print("\nCategorical Columns:")
print(list(cat_cols))

# =====================================
# Encode Categorical Columns
# =====================================

encoders = {}

for col in cat_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    encoders[col] = le

joblib.dump(encoders, "encoders.pkl")

print("Encoders Saved Successfully")

print("\nEncoding Completed")

# =====================================
# Verify No Object Columns Remain
# =====================================

print("\nRemaining Object Columns:")
print(df.select_dtypes(include=["object"]).columns)

# =====================================
# Separate Features and Target
# =====================================

X = df.drop("isFraud", axis=1)
y = df["isFraud"]

print("\nFeatures Shape:", X.shape)
print("Target Shape:", y.shape)

# =====================================
# Save Feature Columns
# =====================================

feature_columns = X.columns.tolist()

joblib.dump(
    feature_columns,
    "feature_columns.pkl"
)

print("Feature Columns Saved Successfully")

# =====================================
# Train-Test Split
# =====================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("\nTraining Data Shape:", X_train.shape)
print("Testing Data Shape:", X_test.shape)

from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score

print("\nTraining XGBoost Model...")

model = XGBClassifier(
    n_estimators=50,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
    eval_metric="logloss"
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

y_prob = model.predict_proba(X_test)
print("\nSample Risk Scores:")
print(y_prob[:5])

accuracy = accuracy_score(y_test, y_pred)

print("\nModel Training Completed")
print("Accuracy:", accuracy)


from sklearn.metrics import classification_report

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

joblib.dump(model, "fraud_model.pkl")

print("\nModel Saved Successfully")