# SNACKE LIVE BOT

Módulo separado em `src/bot/`. Ele transforma **evidência de visão real** em eventos do jogo, sem controlar a direção da cobra.

## Fluxo
captura autorizada -> provedor/detector visual -> `SnackeLiveBot.acceptVisionEvidence()` -> confiança >= 0.85 -> deduplicação -> `POST /api/bot/gift` -> WebSocket `gift_received` -> GameEngine.

## Presentes iniciais
`rose`, `doughnut`, `heart_me`, `galaxy`.

## Contrato da evidência
```json
{"giftId":"rose","username":"viewer","displayName":"Viewer","avatar":"","repeatCount":1,"confidence":0.95,"fingerprint":"frame-region-event-id"}
```

## Segurança
O módulo não usa senha, cookie ou sessionid do TikTok. Texto é sanitizado, confiança abaixo de 0.85 é rejeitada e o backend volta a validar o presente no catálogo.

## Limitação importante
A captura de tela existente fornece frames reais, mas este repositório ainda não contém um modelo OCR/visão treinado capaz de inferir com confiabilidade presente + usuário diretamente dos pixels. `GiftDetector` valida/normaliza a evidência de um detector visual real; ele deliberadamente não inventa resultados. O painel manual continua sendo o fallback.

A integração oficial TikTok permanece separada e só deve consumir eventos LIVE quando esse acesso existir para o aplicativo.
