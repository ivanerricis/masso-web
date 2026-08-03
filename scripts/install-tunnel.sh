#!/usr/bin/env bash
# One-time setup on the Proxmox VM: creates the Cloudflare Tunnel that publishes EasyLab
# on its public domain, and writes the ingress config the `cloudflared` compose service
# reads. Run with sudo before the first `scripts/start-server.sh`.
#
# Re-running it is safe and is also how you change domain later: it keeps the existing
# tunnel and credentials, rewrites the ingress and re-points the DNS record.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "Esegui questo script con sudo/root." >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$REPO_ROOT/ops/cloudflared"
ENV_PATH="$REPO_ROOT/.env"
TUNNEL_NAME="easylab"
# L'immagine ufficiale gira come utente `nonroot`: i file di configurazione devono
# appartenere a quell'uid, altrimenti il container non riesce a leggerli.
CLOUDFLARED_UID=65532
# Directory di default di cloudflared dentro l'immagine (la home di `nonroot`). Non è una
# scelta nostra: `tunnel login` ci scrive il certificato a prescindere da ogni opzione.
CLOUDFLARED_HOME="/home/nonroot/.cloudflared"
CLOUDFLARED_IMAGE="cloudflare/cloudflared:latest"

command -v docker >/dev/null 2>&1 || { echo "docker non trovato. Installa Docker Engine e riprova." >&2; exit 1; }

echo ""
echo "Configurazione del dominio pubblico di EasyLab"
echo ""
echo "Serve un dominio già presente nel tuo account Cloudflare (nameserver puntati a"
echo "Cloudflare). Indica il nome completo con cui l'applicazione sarà raggiungibile,"
echo "ad esempio: easylab.iltuodominio.it"
echo ""

CURRENT_DOMAIN=""
if [ -f "$ENV_PATH" ]; then
    CURRENT_DOMAIN="$(grep -E '^PUBLIC_DOMAIN=' "$ENV_PATH" | cut -d= -f2- || true)"
fi

while true; do
    if [ -n "$CURRENT_DOMAIN" ]; then
        read -r -p "Dominio pubblico [$CURRENT_DOMAIN]: " PUBLIC_DOMAIN
        PUBLIC_DOMAIN="${PUBLIC_DOMAIN:-$CURRENT_DOMAIN}"
    else
        read -r -p "Dominio pubblico: " PUBLIC_DOMAIN
    fi

    # Volutamente permissivo: serve a intercettare gli errori di battitura evidenti
    # (spazi, "https://", dominio senza punto), non a validare un FQDN in modo rigoroso.
    if [[ "$PUBLIC_DOMAIN" =~ ^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$ ]]; then
        break
    fi

    echo "Dominio non valido. Inserisci solo il nome host, senza https:// e senza percorsi." >&2
done

mkdir -p "$CONFIG_DIR"
chown -R "$CLOUDFLARED_UID:$CLOUDFLARED_UID" "$CONFIG_DIR"

# `run --rm` con la directory montata in scrittura: l'installazione è l'unico momento in
# cui questi file vengono creati, a regime la compose li monta in sola lettura.
#
# Il mount deve stare esattamente su $CLOUDFLARED_HOME, non su un percorso a scelta:
# `tunnel login` ignora --origincert per decidere dove *scrivere* il certificato e usa
# sempre la propria directory di default. Montando altrove, il cert.pem finisce dentro il
# container e sparisce con lui, e il comando successivo non lo trova.
cloudflared_run() {
    docker run --rm -i -t \
        -v "$CONFIG_DIR:$CLOUDFLARED_HOME" \
        "$CLOUDFLARED_IMAGE" \
        "$@"
}

if [ ! -f "$CONFIG_DIR/cert.pem" ]; then
    echo ""
    echo "Autorizzazione dell'account Cloudflare."
    echo "Si aprirà un link: copialo in un browser, accedi e scegli il dominio da usare."
    echo ""
    cloudflared_run tunnel login
else
    echo ""
    echo "Account Cloudflare già autorizzato (cert.pem presente), passo oltre."
fi

if [ ! -f "$CONFIG_DIR/$TUNNEL_NAME.json" ]; then
    echo ""
    echo "Creazione del tunnel \"$TUNNEL_NAME\"..."
    cloudflared_run tunnel create --credentials-file "$CLOUDFLARED_HOME/$TUNNEL_NAME.json" "$TUNNEL_NAME"
else
    echo ""
    echo "Tunnel \"$TUNNEL_NAME\" già esistente, riuso le credenziali presenti."
fi

echo ""
echo "Scrittura della configurazione di ingress..."

# `service: http://frontend:80` sfrutta il DNS interno della compose: cloudflared parla con
# nginx sulla rete dei container, quindi il frontend non deve pubblicare nessuna porta.
cat > "$CONFIG_DIR/config.yml" <<EOF
# Generato da scripts/install-tunnel.sh. Per cambiare dominio rilancia lo script:
# modificarlo a mano non aggiorna il record DNS su Cloudflare.
tunnel: $TUNNEL_NAME
credentials-file: $CLOUDFLARED_HOME/$TUNNEL_NAME.json

ingress:
  - hostname: $PUBLIC_DOMAIN
    service: http://frontend:80
  # Regola finale obbligatoria: qualunque altro hostname non deve raggiungere l'app.
  - service: http_status:404
EOF

chown -R "$CLOUDFLARED_UID:$CLOUDFLARED_UID" "$CONFIG_DIR"
chmod 600 "$CONFIG_DIR/cert.pem" "$CONFIG_DIR/$TUNNEL_NAME.json"

echo ""
echo "Creazione del record DNS per $PUBLIC_DOMAIN..."

# Primo tentativo senza --overwrite-dns di proposito: se sul dominio esistono altri
# sottodomini in uso, un errore di battitura qui dirotterebbe uno di quelli su EasyLab
# senza dire niente. Se il record esiste già, meglio fermarsi e far decidere a chi installa.
if ! cloudflared_run tunnel route dns "$TUNNEL_NAME" "$PUBLIC_DOMAIN"; then
    echo ""
    echo "Esiste già un record DNS per $PUBLIC_DOMAIN."
    echo "Se è di un altro servizio, sovrascriverlo lo renderà irraggiungibile."
    echo "Se è di un'installazione precedente di EasyLab, sovrascriverlo è corretto."
    echo ""
    read -r -p "Sovrascrivere il record esistente? [s/N]: " OVERWRITE

    if [[ "$OVERWRITE" =~ ^[sSyY] ]]; then
        cloudflared_run tunnel route dns --overwrite-dns "$TUNNEL_NAME" "$PUBLIC_DOMAIN"
    else
        echo ""
        echo "Record DNS lasciato invariato. La configurazione del tunnel è comunque salvata:"
        echo "rilancia questo script con un altro sottodominio, oppure crea a mano su"
        echo "Cloudflare un record CNAME da $PUBLIC_DOMAIN al tunnel \"$TUNNEL_NAME\"." >&2
        exit 1
    fi
fi

# Il dominio serve solo per mostrarlo all'avvio: l'applicazione non lo usa da nessuna
# parte, ed è per questo che cambiarlo non richiede di ricostruire le immagini.
if [ -f "$ENV_PATH" ] && grep -qE '^PUBLIC_DOMAIN=' "$ENV_PATH"; then
    sed -i "s#^PUBLIC_DOMAIN=.*#PUBLIC_DOMAIN=$PUBLIC_DOMAIN#" "$ENV_PATH"
else
    printf '\nPUBLIC_DOMAIN=%s\n' "$PUBLIC_DOMAIN" >> "$ENV_PATH"
fi

echo ""
echo "Tunnel configurato."
echo "Avvia (o riavvia) lo stack con: scripts/start-server.sh"
echo "L'applicazione sarà raggiungibile su: https://$PUBLIC_DOMAIN"
