"""Bank B Flower Client"""

from app.fl.task import load_data


class BankBClient:

    def __init__(self):
        self.partition_id = 1
        self.client_name = "bank_b"

    def load_dataset(self):
        return load_data(self.partition_id)