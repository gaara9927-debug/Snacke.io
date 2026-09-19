# TikTok Login Kit Android — Snacke LIVE

App ID: `io.snacke.live`

O Android é gerado pelo Capacitor durante o workflow, então alterações nativas manuais seriam apagadas por `npx cap add android`. A integração web/OAuth server-side existente continua sendo a fonte de login no APK via WebView.

## Para habilitar o Login Kit Android nativo (OpenSDK v2)
No TikTok for Developers:
1. Adicione **Login Kit** ao app Snacke.
2. Adicione a plataforma **Android** com package `io.snacke.live`.
3. Cadastre os fingerprints MD5 e SHA-256 do certificado que assina o APK.
4. Cadastre uma Redirect URI HTTPS autorizada.

A implementação nativa deve seguir a documentação oficial v2: `AuthApi` + `AuthRequest`, scope inicial `user.info.basic`, Redirect URI HTTPS e PKCE. O callback entrega `authCode`; envie `authCode` + `code_verifier` ao backend para troca pelo token. **Nunca coloque client_secret no APK.**

## Variáveis do backend
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET` (secret; backend somente)
- `TIKTOK_REDIRECT_URI`
- `TIKTOK_TARGET_USERNAME=rainz878`

Não use `TIKTOK_SESSION`, senha ou cookies.

## Assinatura
O workflow atual produz um APK de debug, cuja chave de assinatura pode mudar entre runners. Para registrar fingerprints estáveis no TikTok, crie uma keystore de release e guarde-a como GitHub Actions Secret. Não comite a keystore nem suas senhas.

## Limite
Login Kit autentica o usuário; ele não deve ser tratado como confirmação de status LIVE nem como API de presentes. Esses recursos precisam de uma fonte real/autorizada separada.
