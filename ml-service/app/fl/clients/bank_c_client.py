"""Bank C Flower Client"""

from app.fl.task import load_data


class BankCClient:

    def __init__(self):
        self.partition_id = 2
        self.client_name = "bank_c"

    def load_dataset(self):
        return load_data(self.partition_id)