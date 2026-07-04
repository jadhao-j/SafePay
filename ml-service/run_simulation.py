from flwr.simulation import run_simulation
from app.fl.coordinator.server import app as server_app
from app.fl.clients.client_app import app as client_app

if __name__ == '__main__':
    run_simulation(
        server_app=server_app,
        client_app=client_app,
        num_supernodes=3,
    )
