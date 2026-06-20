import pandas as pd

def load_dataset(path):
    dataset = pd.read_csv(path)
    return dataset

if __name__ == "__main__":
    print("Dataset Loader Initialized")
