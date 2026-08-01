"""WebSocket route for the admin live transaction feed."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.redis import redis_client
from app.core.security import decode_token

router = APIRouter(tags=["ws"])

ALLOWED_ROLES = {"admin", "fraud_analyst", "compliance_officer"}


@router.websocket("/ws/admin/feed")
async def admin_feed(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = decode_token(token)
    except Exception:
        await websocket.close(code=1008)
        return

    if payload.get("role") not in ALLOWED_ROLES:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    pubsub = redis_client.pubsub()
    await pubsub.subscribe("admin:tx-feed")

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message is not None:
                await websocket.send_text(message["data"])
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe("admin:tx-feed")
        await pubsub.aclose()