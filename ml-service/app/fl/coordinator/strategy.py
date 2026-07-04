"""
Federated Learning Strategy
"""

from flwr.serverapp.strategy import FedXgbBagging


def create_strategy():
    """
    Create SafePay Federated Learning Strategy.
    """

    strategy = FedXgbBagging(

        fraction_train=1.0,

        fraction_evaluate=1.0,

        min_train_nodes=3,

        min_evaluate_nodes=3,

        min_available_nodes=3,
    )

    return strategy