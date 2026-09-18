"""
🐍 Dalelak WhatsApp AI Agent - Python Integration Example
=============================================================
This script demonstrates how any Python program can monitor, query,
or trigger actions on the standalone WhatsApp AI Agent microservice.
"""

import json
import time
try:
    import urllib.request
except ImportError:
    pass

BASE_URL = "http://localhost:3005"


def get_radar_health():
    """Fetches the real-time health and multi-slot anti-ban metrics."""
    req = urllib.request.Request(f"{BASE_URL}/api/whatsapp/health")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_ai_conversations():
    """Fetches all active customer conversation threads and intent states."""
    req = urllib.request.Request(f"{BASE_URL}/api/whatsapp/ai/conversations")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def mute_for_human(phone: str, minutes: int = 1440):
    """Mutes the AI agent for a specific phone number to allow human takeover."""
    data = json.dumps({"phone": phone, "minutes": minutes}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/whatsapp/ai/mute",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def trigger_gift_and_qr(phone: str, slot: str = "1"):
    """Manually triggers the dispatch of a high-resolution QR card & promotional gift."""
    data = json.dumps({"phone": phone, "slot": slot}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/whatsapp/gift/send-manual",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


if __name__ == "__main__":
    print("==================================================")
    print("📡 Testing Connection to Dalelak WhatsApp Agent...")
    print("==================================================")
    try:
        health = get_radar_health()
        print(f"Status: {health.get('status')}")
        print(f"Any Connected: {health.get('isAnyConnected')}")
        slots = health.get("slots", [])
        for s in slots:
            slot_id = s.get("slotId")
            state = s.get("state")
            sent = s.get("safety", {}).get("messagesSentLastHour", 0)
            risk = s.get("safety", {}).get("riskScore", 0)
            print(f"  - Slot {slot_id}: {state} | Sent/Hr: {sent}/40 | Risk: {risk}%")
        print("\n✅ Python integration is functional and ready!")
    except Exception as e:
        print(f"❌ Could not connect to agent at {BASE_URL}: {e}")
        print("Make sure to run 'run.bat' in dalelak-whatsapp-agent first.")
