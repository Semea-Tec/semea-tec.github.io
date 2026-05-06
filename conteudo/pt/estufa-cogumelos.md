# Estufa de Cogumelos — Sensoriamento Ambiental Autônomo

## Contexto

A produção de cogumelos em estufas exige controle rigoroso de variáveis ambientais. Temperatura, umidade relativa e concentração de CO₂ afetam diretamente a produtividade e a qualidade do cultivo. Para o agricultor familiar, monitorar essas variáveis manualmente é inviável — especialmente quando a estufa está em local remoto, sem acesso à rede elétrica ou à internet.

A segunda rodada do SEMEA-TEC nasceu dessa demanda, com o objetivo de projetar uma **estação de sensoriamento autônoma, de longo alcance e energeticamente autossuficiente**.

## Arquitetura da solução

### Hardware de campo

| Componente | Especificação | Função |
|-----------|---------------|--------|
| **Microcontrolador + rádio** | Heltec ESP32 com LoRa integrado (chip SX1276) | Processamento, comunicação LoRa e gerenciamento de energia |
| **Sensor de temperatura e umidade** | DHT22 | Faixa: -40 °C a 80 °C, precisão de ±0.5 °C; umidade 0–100% UR, precisão de ±2% |
| **Sensor de CO₂ (primário)** | MH-Z19B (NDIR) | Medição de CO₂ por infravermelho não-dispersivo, faixa de 0–5000 ppm |
| **Sensor de CO₂ (alta precisão)** | SCD40 (NDIR) | Sensor fotoacústico de precisão superior, para ambientes controlados |
| **Alimentação** | Painel solar 5V / 1.25W + bateria 18650 (~2500 mAh) | Autonomia energética com circuito de gestão de carga |
| **Firmware** | Código customizado com suporte a deep sleep | Redução do consumo médio para balanço energético positivo |

### Infraestrutura de backend

O dado coletado em campo percorre o seguinte fluxo:

```
Gateway LoRa → Mosquitto (MQTT) → Node-RED → InfluxDB → Grafana
```

- **Mosquitto**: broker MQTT responsável por orquestrar as mensagens que chegam do gateway LoRa.
- **Node-RED**: fluxos de automação que fazem a ponte entre o MQTT e a persistência, além de permitir lógicas de alerta (ex: notificar se CO₂ ultrapassar determinado limiar).
- **InfluxDB**: banco de dados otimizado para séries temporais, ideal para logs contínuos de sensores.
- **Grafana**: dashboards interativos para visualização em tempo real das variáveis ambientais.

### Estratégia energética

O balanço energético é o coração da autonomia do sistema. Com um painel de 1.25W e uma bateria de ~2500 mAh, o ESP32 precisa operar com consumo médio abaixo da geração diária do painel. Para isso, implementamos:

- **Deep sleep cíclico**: o ESP32 permanece em modo de baixíssimo consumo a maior parte do tempo, acordando apenas para leitura dos sensores e transmissão (duty cycle típico de ~1% ou menos).
- **Desligamento de periféricos**: sensores e rádio são alimentados apenas durante a janela ativa de medição e envio.

Esse desafio de autonomia energética é um dos pontos de convergência direta com a pesquisa de doutorado em *harvest energy*.

## Progresso atual

### Concluído

- Integração e validação da leitura dos três sensores (DHT22, MH-Z19B e SCD40) via firmware.
- Comunicação LoRa ponto-a-ponto simplificada entre dispositivos.
- Stack completa de backend operacional: Mosquitto, Node-RED, InfluxDB e Grafana.
- Dashboards preliminares de visualização em tempo real.

### Em andamento

- **Otimização energética**: implementação das estratégias de deep sleep para garantir que o consumo médio fique abaixo da geração do painel solar.
- **Customização de UX para o agricultor**: ajuste das interfaces do Grafana e dos alertas do Node-RED para a linguagem e as necessidades específicas de quem está na lida diária da estufa (ex: notificações de níveis críticos de CO₂ via Telegram/WhatsApp).
- **Resiliência e backup**: configuração de backups automáticos do banco InfluxDB.
- **Testes de campo**: validação de alcance, perda de pacotes e vedação das caixas contra intempéries diretamente no sítio de produção real.

### Possibilidade de troca de tecnologias

A stack atual (Mosquitto + Node-RED + InfluxDB + Grafana) é funcional, mas avaliaremos alternativas mais leves para cenários onde o poder computacional do servidor local é limitado — mantendo o princípio de baixo custo e baixa complexidade operacional.

---

> Esta segunda rodada está em fase ativa de desenvolvimento. A documentação será atualizada conforme os marcos forem atingidos.
