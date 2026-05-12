# Javalarm — Monitoramento de Tensão via LoRa

## Contexto

A invasão de javalis (*Sus scrofa*) em áreas de agricultura familiar é um problema grave no Vale do Paraíba e em diversas regiões do Brasil. Esses animais destroem plantações inteiras em uma única noite, comprometendo a segurança alimentar e a renda de famílias agricultoras. Cercas elétricas são a principal defesa, mas sua eficácia depende de manutenção constante: uma simples falha de tensão abre caminho para o ataque.

Foi a partir dessa demanda concreta, trazida pelas organizações parceiras durante o diagnóstico participativo, que iniciamos a primeira rodada do SEMEA-TEC.

## Arquitetura da solução

Desenvolvemos um sistema de monitoramento remoto da tensão da cerca elétrica, com comunicação via rádio LoRa. A arquitetura do protótipo combina:

### Sensoriamento

O sinal de uma cerca elétrica é complexo: pulsos de alta tensão (na casa dos kV), de curta duração e com forma de onda irregular. Na primeira iteração, tentamos captar o sinal por indução em bobina, mas a abordagem mostrou-se ineficaz — o sinal capturado não retratava fielmente os pulsos da cerca, exibindo apenas interferências e problemas de aterramento.

A solução veio com duas frentes complementares:

- **Sensor de efeito Hall**: detecta o campo magnético gerado pelo pulso da cerca, oferecendo uma leitura indireta porém robusta da passagem de corrente.
- **Voltímetro de cerca dedicado**: instrumento específico para aferir a tensão real nos terminais, fornecendo uma medição direta e confiável.

Essa combinação permitiu interpretar corretamente o funcionamento da cerca, distinguindo operação normal de eventos de falha.

### Processamento e comunicação

- **Microcontrolador**: responsável por ler os sensores e gerenciar o rádio.
- **Transceptor LoRa**: operando na banda ISM 915 MHz (regulamentada no Brasil), com modulação *chirp spread spectrum* (CSS), que oferece excelente alcance em áreas rurais e alta imunidade a ruído.
- **Protocolo próprio de confirmação**: implementamos um handshake simples — o transmissor envia o alerta de queda de tensão e aguarda *acknowledgment* do receptor. Caso o receptor esteja offline (fora de alcance momentâneo, desligado), o transmissor retransmite o alerta até obter confirmação. Isso garante que uma falha na cerca jamais passe despercebida.

### Enlace de comunicação

O enlace é do tipo **ponto-a-ponto simplex com confirmação**, priorizando confiabilidade sobre *throughput* — adequado ao perfil de tráfego esporádico típico de eventos de falha (ordem de grandeza: poucos bytes por evento, alguns eventos por semana).

## Status atual e próximos passos

**Concluído:**
- Leitura e interpretação correta do sinal da cerca (efeito Hall + voltímetro).
- Protocolo de comunicação com handshake e retransmissão.
- Comunicação LoRa ponto-a-ponto funcional.

**Em andamento / próximo ciclo:**
- Integração de todos os módulos em um único dispositivo de campo.
- *Design* de case para proteção contra intempéries (sol, chuva, poeira).
- Otimização do *bootloader* para permitir atualização remota de *firmware*.

---

> Este é o MVP (*Minimum Viable Product*) da primeira rodada do projeto. Os aprendizados em campo alimentam diretamente o design da segunda rodada (Shitakiometer) e contribuem para a pesquisa de doutorado associada.
