import paho.mqtt.client as mqtt
import time
import random
from datetime import datetime

# ───────────────────────── BROKER CONFIG ─────────────────────────
BROKER   = "broker.emqx.io"
PORT     = 1883
USERNAME = "evzin_led"
PASSWORD = "63I9YhMaXpa49Eb"

# ───────────────────────── TOPICS & DEVICES ─────────────────────────
TOPICS = [
    ("gateway_Wifi_2/telemetry/CyclicData", "gateway_Wifi_2"),
    ("gateway_LTE_1/telemetry/CyclicData",  "gateway_LTE_1"),
]

INTERVAL = 15  # seconds


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to MQTT broker")
    else:
        print(f"❌ Connection failed with code {rc}")


def on_publish(client, userdata, mid):
    print(f"   📤 Message published (mid={mid})")


def random_rs485_1():  return round(random.uniform(20.0, 45.0), 2)
def random_rs485_2():  return round(random.uniform(20.0, 45.0), 2)
def random_rs232_1():  return random.randint(900, 1050)
def random_rs232_2():  return random.randint(900, 1050)


def build_payload(device_id, rs485_1, rs485_2, rs232_1, rs232_2):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return (
        f"{{device_id:\n{device_id}:\n[{timestamp}]:\n"
        f"RS485_1:{rs485_1}:\n"
        f":RS485_2:{rs485_2}\n"
        f":RS232_1:{rs232_1}\n"
        f":RS232_2:{rs232_2}\n"
        f"}}"
    )


def main():
    client = mqtt.Client()
    client.username_pw_set(USERNAME, PASSWORD)
    client.on_connect = on_connect
    client.on_publish = on_publish

    print(f"🔌 Connecting to {BROKER}:{PORT} …")
    client.connect(BROKER, PORT)
    client.loop_start()

    time.sleep(2)  # wait for connection

    print(f"🚀 Publishing to {len(TOPICS)} topics every {INTERVAL}s  (Ctrl+C to stop)\n")

    try:
        while True:
            for topic, device_id in TOPICS:
                rs485_1 = random_rs485_1()
                rs485_2 = random_rs485_2()
                rs232_1 = random_rs232_1()
                rs232_2 = random_rs232_2()

                payload = build_payload(device_id, rs485_1, rs485_2, rs232_1, rs232_2)
                client.publish(topic, payload, qos=1)

                print(f"📡 Topic   : {topic}")
                print(f"   Device  : {device_id}")
                print(f"📟 RS485_1 : {rs485_1}  |  RS485_2 : {rs485_2}")
                print(f"📟 RS232_1 : {rs232_1}  |  RS232_2 : {rs232_2}")
                print("-" * 40)

            time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print("\n🛑 Stopped by user.")
    finally:
        client.loop_stop()
        client.disconnect()
        print("🔌 Disconnected.")


if __name__ == "__main__":
    main()