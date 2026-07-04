"""Bank A Flower Client"""

from app.fl.task import load_data


class BankAClient:

    def __init__(self):
        self.partition_id = 0
        self.client_name = "bank_a"

    def load_dataset(self):
        return load_data(self.partition_id)