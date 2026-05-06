# Mushroom Greenhouse — Autonomous Environmental Sensing

## Context

Mushroom production in greenhouses requires strict control of environmental variables. Temperature, relative humidity, and CO₂ concentration directly affect crop productivity and quality. For the family farmer, manually monitoring these variables is unfeasible — especially when the greenhouse is in a remote location, without access to the electrical grid or the internet.

The second round of SEMEA-TEC was born from this demand, with the goal of designing an **autonomous sensing station that is long-range and energy-self-sufficient**.

## Solution architecture

### Field hardware

| Component | Specification | Function |
|-----------|---------------|----------|
| **Microcontroller + radio** | Heltec ESP32 with integrated LoRa (SX1276 chip) | Processing, LoRa communication, and power management |
| **Temperature and humidity sensor** | DHT22 | Range: -40 °C to 80 °C, accuracy ±0.5 °C; humidity 0–100% RH, accuracy ±2% |
| **CO₂ sensor (primary)** | MH-Z19B (NDIR) | CO₂ measurement via non-dispersive infrared, range 0–5000 ppm |
| **CO₂ sensor (high precision)** | SCD40 (NDIR) | Photoacoustic sensor with superior precision, for controlled environments |
| **Power supply** | Solar panel 5V / 1.25W + 18650 battery (~2500 mAh) | Energy autonomy with charge management circuit |
| **Firmware** | Custom code with deep sleep support | Reducing average consumption for positive energy balance |

### Backend infrastructure

The data collected in the field follows this flow:

```
LoRa Gateway → Mosquitto (MQTT) → Node-RED → InfluxDB → Grafana
```

- **Mosquitto**: MQTT broker responsible for orchestrating messages arriving from the LoRa gateway.
- **Node-RED**: automation flows that bridge MQTT and persistence, also enabling alert logic (e.g., notify if CO₂ exceeds a given threshold).
- **InfluxDB**: database optimized for time series, ideal for continuous sensor logging.
- **Grafana**: interactive dashboards for real-time visualization of environmental variables.

### Energy strategy

The energy balance is the heart of the system's autonomy. With a 1.25W panel and a ~2500 mAh battery, the ESP32 must operate with an average consumption below the panel's daily generation. To achieve this, we implement:

- **Cyclic deep sleep**: the ESP32 remains in ultra-low-power mode most of the time, waking only for sensor reading and transmission (typical duty cycle of ~1% or less).
- **Peripheral shutdown**: sensors and radio are powered only during the active measurement and transmission window.

This energy autonomy challenge is one of the direct convergence points with the doctoral research on harvest energy.

## Current progress

### Completed

- Integration and validation of readings from all three sensors (DHT22, MH-Z19B, and SCD40) via firmware.
- Simplified point-to-point LoRa communication between devices.
- Complete backend stack operational: Mosquitto, Node-RED, InfluxDB, and Grafana.
- Preliminary real-time visualization dashboards.

### In progress

- **Energy optimization**: implementation of deep sleep strategies to ensure average consumption stays below solar panel generation.
- **UX customization for the farmer**: adjusting Grafana interfaces and Node-RED alerts for the language and specific needs of those working daily in the greenhouse (e.g., critical CO₂ level notifications via Telegram/WhatsApp).
- **Resilience and backup**: configuring automatic InfluxDB backups.
- **Field testing**: validating range, packet loss, and enclosure weather sealing directly at the actual production site.

### Possible technology swap

The current stack (Mosquitto + Node-RED + InfluxDB + Grafana) is functional, but we will evaluate lighter alternatives for scenarios where local server computing power is limited — maintaining the principle of low cost and low operational complexity.

---

> This second round is under active development. Documentation will be updated as milestones are reached.
