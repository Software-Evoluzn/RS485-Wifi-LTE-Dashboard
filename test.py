"""
Offline check for the publish/subscribe JSON payload format.
Doesn't touch the network — just verifies build_payload() (publish.py) and
parse_gateway_payload() (app.py) agree with each other.

Run: python test.py
"""

from publish import build_payload
from app import parse_gateway_payload

payload = build_payload("ESP32Gateway_01", 32.13, 32.06, 994, 995)
print("Generated payload:")
print(payload)
print()

parsed = parse_gateway_payload(payload)
print("Parsed back:", parsed)

assert parsed is not None, "Parser failed on publish.py's own payload!"
assert parsed["device_id"] == "ESP32Gateway_01"
assert parsed["RS485_1"] == 32.13
assert parsed["RS485_2"] == 32.06
assert parsed["RS232_1"] == 994
assert parsed["RS232_2"] == 995
print("✅ Payload round-trip OK")