#!/usr/bin/env python3
"""
App 端模拟器 — 模拟患者(<EYEAGENT_PHONE>)的真实 E2EE 聊天客户端

功能：
1. 生成真实 ECDH P-256 密钥对，上传公钥到服务端
2. 连接 WebSocket 监听实时消息
3. 收到 CHAT_MESSAGE 后用 ECDH+HKDF+AES-GCM 解密并显示明文
4. 自动标记已读 + 显示 TYPING/READ_RECEIPT 等事件

用法：直接运行，然后从平台端发起对话和消息
按 Ctrl+C 退出
"""

import json
import subprocess
import threading
import time
import sys
import base64
import hashlib
import hmac
import os

import websocket
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

BASE = "http://localhost:8081"
APP_WS = "ws://localhost:8081/ws/app/notify"
PHONE = os.environ.get("EYEAGENT_PHONE", "")
PASSWORD = os.environ.get("EYEAGENT_PASSWORD", "")
if not PHONE or not PASSWORD:
    raise SystemExit("Set EYEAGENT_PHONE and EYEAGENT_PASSWORD before running this simulator.")

# 全局状态
private_key = None
public_key_b64 = None
token = None
user_id = None
user_name = None
session_keys = {}  # sessionId -> AES key bytes
peer_public_keys = {}  # sessionId -> peer public key bytes


def generate_ecdh_keypair():
    """生成真实的 ECDH P-256 密钥对"""
    global private_key, public_key_b64
    private_key = ec.generate_private_key(ec.SECP256R1())
    pub_bytes = private_key.public_key().public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo
    )
    public_key_b64 = base64.b64encode(pub_bytes).decode()
    print(f"[KEY] 生成 ECDH P-256 密钥对")
    print(f"  公钥(Base64): {public_key_b64[:40]}...({len(public_key_b64)}字符)")


def derive_session_key(peer_pub_b64, session_id):
    """ECDH 协商 + HKDF 派生 AES-256 会话密钥"""
    if session_id in session_keys:
        return session_keys[session_id]

    peer_pub_bytes = base64.b64decode(peer_pub_b64)
    peer_public_key = serialization.load_der_public_key(peer_pub_bytes)

    shared_key = private_key.exchange(ec.ECDH(), peer_public_key)

    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=session_id.encode('utf-8'),
        info=b'chat-session',
    ).derive(shared_key)

    session_keys[session_id] = derived_key
    print("[ECDH] Session key derived")
    return derived_key


def decrypt_message(session_key_bytes, encrypted_content_b64, iv_b64):
    """AES-256-GCM 解密"""
    try:
        ciphertext = base64.b64decode(encrypted_content_b64)
        iv = base64.b64decode(iv_b64)
        aesgcm = AESGCM(session_key_bytes)
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
        return plaintext.decode('utf-8')
    except Exception as e:
        return f"[解密失败: {e}]"


def encrypt_message(session_key_bytes, plaintext):
    """AES-256-GCM 加密"""
    iv = os.urandom(12)
    aesgcm = AESGCM(session_key_bytes)
    ciphertext = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)
    return base64.b64encode(ciphertext).decode(), base64.b64encode(iv).decode()


def curl_json(method, path, data=None):
    cmd = ["curl", "-s"]
    if method == "POST":
        cmd += ["-X", "POST"]
    cmd += [f"{BASE}{path}", "-H", f"satoken: {token}"]
    if data:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(proc.stdout)


def upload_or_rotate_key():
    """上传或轮换公钥"""
    # 先尝试上传
    result = curl_json("POST", "/api/app/chat/keys/upload", {"publicKey": public_key_b64})
    if result.get("code") == 200:
        ver = result["data"]["keyVersion"]
        print(f"[KEY] 公钥上传成功, keyVersion={ver}")
        return ver

    # 已有公钥，用轮换
    result = curl_json("POST", "/api/app/chat/keys/rotate", {"publicKey": public_key_b64})
    if result.get("code") == 200:
        ver = result["data"]["keyVersion"]
        print(f"[KEY] 公钥轮换成功, keyVersion={ver}")
        return ver

    print(f"[ERROR] 公钥操作失败: {result.get('msg')}")
    return None


def get_peer_public_key(session_id):
    """获取对方公钥并协商密钥"""
    # 先查会话信息确定对方
    result = curl_json("GET", f"/api/app/chat/sessions/{session_id}")
    if result.get("code") != 200:
        return None
    session = result["data"]
    if session["patientId"] == user_id:
        peer_type, peer_id = "DOCTOR", session["doctorId"]
    else:
        peer_type, peer_id = "PATIENT", session["patientId"]

    # 获取对方公钥
    result = curl_json("GET", f"/api/app/chat/keys/{peer_type}/{peer_id}")
    if result.get("code") != 200:
        print(f"  [WARN] 获取对方公钥失败: {result.get('msg')}")
        return None
    peer_pub = result["data"]["publicKey"]
    return derive_session_key(peer_pub, session_id)


def login_and_setup():
    global token, user_id, user_name
    proc = subprocess.run([
        "curl", "-s", "-X", "POST", f"{BASE}/api/app/base/login",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"phone": PHONE, "password": PASSWORD})
    ], capture_output=True, text=True)
    data = json.loads(proc.stdout)
    if data["code"] != 200:
        print(f"[ERROR] 登录失败: {data['msg']}")
        sys.exit(1)
    token = data["data"]["token"]
    user_name = data["data"]["patientName"]
    user_id = data["data"]["patientId"]
    print(f"[LOGIN] {user_name} (ID: {user_id[:8]}...) 登录成功\n")

    # 生成密钥对并上传
    generate_ecdh_keypair()
    key_version = upload_or_rotate_key()
    print()

    # 查看现有会话
    result = curl_json("GET", "/api/app/chat/sessions")
    sessions = result.get("data", [])
    if sessions:
        print(f"[INFO] 当前 {len(sessions)} 个会话:")
        for s in sessions:
            print(f"  [{s['status']}] {s['doctorName']} ↔ {s['patientName']} | 未读: {s['unreadCount']}")
            # 预协商密钥
            if s['status'] == 'ACTIVE':
                try:
                    get_peer_public_key(s['id'])
                except Exception as e:
                    print(f"  [WARN] 密钥预协商失败: {e}")
    else:
        print("[INFO] 当前没有会话，等待对方发起...")

    return key_version


def run_simulator():
    key_version = login_and_setup()
    print()
    print("=" * 60)
    print(f" App 端 E2EE 模拟器 — {user_name}")
    print(f" WebSocket: {APP_WS}")
    print(f" 公钥版本: {key_version}")
    print(f" 等待平台端(医生)操作...")
    print(f" Ctrl+C 退出")
    print("=" * 60)
    print()

    stop_event = threading.Event()
    ws_ref = [None]

    def heartbeat():
        while not stop_event.is_set():
            time.sleep(25)
            if ws_ref[0] and not stop_event.is_set():
                try:
                    ws_ref[0].send(json.dumps({"type": "PING"}))
                except Exception:
                    pass

    threading.Thread(target=heartbeat, daemon=True).start()

    def on_message(ws, message):
        msg = json.loads(message)
        t = msg.get("type", "?")
        ts = time.strftime("%H:%M:%S")

        if t == "AUTH_OK":
            print(f"[{ts}] ✅ WebSocket 认证成功")
            return
        if t == "PONG":
            return

        if t == "CHAT_MESSAGE":
            sid = msg.get("sessionId", "")
            sender = msg.get("senderType", "?")
            msg_type = msg.get("messageType", "TEXT")
            enc = msg.get("encryptedContent", "")
            iv = msg.get("iv", "")
            file_url = msg.get("fileUrl")
            kv = msg.get("senderKeyVersion")

            # 尝试解密
            sk = session_keys.get(sid)
            if not sk:
                try:
                    sk = get_peer_public_key(sid)
                except Exception as e:
                    sk = None

            if sk:
                plaintext = decrypt_message(sk, enc, iv)
            else:
                plaintext = f"[未能协商密钥, 密文: {enc[:20]}...]"

            print(f"[{ts}] 📩 [{sender}] {msg_type}消息:")
            print(f"         明文: {plaintext}")
            if file_url:
                print(f"         文件: {file_url}")
            print(f"         (密钥版本:{kv}, 会话:{sid[:8]}...)")

            # 自动标记已读
            def do_read():
                r = curl_json("POST", f"/api/app/chat/sessions/{sid}/messages/read")
                if r.get("code") == 200:
                    print(f"         → 已自动标记已读")
            threading.Thread(target=do_read, daemon=True).start()
            return

        if t == "CHAT_TYPING":
            typing = "✏️ 正在输入..." if msg.get("isTyping") else "✋ 停止输入"
            print(f"[{ts}] {typing} (会话:{msg.get('sessionId','')[:8]}...)")
            return

        if t == "CHAT_READ_RECEIPT":
            print(f"[{ts}] 👁️ 对方已读 (会话:{msg.get('sessionId','')[:8]}...)")
            return

        if t == "CHAT_KEY_UPDATED":
            uid = msg.get("userId", "")
            ver = msg.get("newKeyVersion")
            print(f"[{ts}] 🔑 对方密钥更新 (version:{ver})")
            # 清除缓存
            to_del = [k for k in session_keys]
            for k in to_del:
                del session_keys[k]
            print(f"         → 已清除缓存密钥，下次消息自动重新协商")
            return

        if t == "NOTIFICATION":
            print(f"[{ts}] 📢 系统通知: {json.dumps(msg.get('data',{}), ensure_ascii=False)[:80]}")
            return

        print(f"[{ts}] [?] {json.dumps(msg, ensure_ascii=False)[:100]}")

    def on_error(ws, error):
        print(f"[ERROR] {error}")

    def on_close(ws, code, msg):
        if not stop_event.is_set():
            print(f"[WS] 连接断开 (code={code}), 3秒后重连...")
            time.sleep(3)
            start_ws()

    def on_open(ws):
        ws.send(json.dumps({"type": "AUTH", "satoken": token}))

    def start_ws():
        ws = websocket.WebSocketApp(
            APP_WS, on_open=on_open, on_message=on_message,
            on_error=on_error, on_close=on_close
        )
        ws_ref[0] = ws
        ws.run_forever()

    try:
        start_ws()
    except KeyboardInterrupt:
        print("\n[EXIT] 模拟器退出")
        stop_event.set()


if __name__ == "__main__":
    run_simulator()
