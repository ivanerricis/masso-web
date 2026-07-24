#!/usr/bin/env bash
# Configura un indirizzo IP statico sulla VM Proxmox (Debian/Ubuntu).
# Rileva automaticamente netplan, NetworkManager o ifupdown (/etc/network/interfaces)
# e scrive la configurazione corrispondente. Chiede sempre conferma prima di
# applicarla, perché un valore errato puo' interrompere la connessione SSH.
# Uso: scripts/configure-static-ip.sh
set -euo pipefail

if [ "$(uname -s)" != "Linux" ]; then
    echo "Questo script e' pensato per la VM Linux (Proxmox)." >&2
    exit 1
fi

if ! command -v ip >/dev/null 2>&1; then
    echo "Comando 'ip' non trovato (pacchetto iproute2)." >&2
    exit 1
fi

if [ "$(id -u)" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

is_valid_ipv4() {
    local ip="$1"
    [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || return 1
    local IFS='.'
    local -a octets=($ip)
    local octet
    for octet in "${octets[@]}"; do
        (( 10#$octet >= 0 && 10#$octet <= 255 )) || return 1
    done
    return 0
}

is_valid_cidr() {
    local cidr="$1"
    [[ "$cidr" == */* ]] || return 1
    local ip="${cidr%/*}"
    local prefix="${cidr#*/}"
    is_valid_ipv4 "$ip" || return 1
    [[ "$prefix" =~ ^[0-9]+$ ]] && (( 10#$prefix >= 0 && 10#$prefix <= 32 )) || return 1
    return 0
}

echo ""
echo "Configurazione IP statico"
echo ""

DEFAULT_IFACE="$(ip -4 route show default 2>/dev/null | awk '{print $5; exit}')"
if [ -z "$DEFAULT_IFACE" ]; then
    echo "Impossibile rilevare automaticamente l'interfaccia di rete predefinita."
    read -r -p "Nome interfaccia (es. eth0, ens18): " DEFAULT_IFACE
fi

CURRENT_CIDR="$(ip -4 -o addr show dev "$DEFAULT_IFACE" 2>/dev/null | awk '{print $4; exit}')"
CURRENT_GATEWAY="$(ip -4 route show default dev "$DEFAULT_IFACE" 2>/dev/null | awk '{print $3; exit}')"
CURRENT_DNS="$(awk '/^nameserver/{print $2}' /etc/resolv.conf 2>/dev/null | paste -sd, -)"

echo "Interfaccia rilevata: $DEFAULT_IFACE"
echo "IP attuale:           ${CURRENT_CIDR:-sconosciuto}"
echo "Gateway attuale:      ${CURRENT_GATEWAY:-sconosciuto}"
echo "DNS attuali:          ${CURRENT_DNS:-sconosciuto}"
echo ""

read -r -p "Interfaccia da configurare [$DEFAULT_IFACE]: " IFACE
IFACE="${IFACE:-$DEFAULT_IFACE}"

while true; do
    read -r -p "Indirizzo IP statico con prefisso, es. 192.168.1.50/24 [${CURRENT_CIDR:-}]: " STATIC_CIDR
    STATIC_CIDR="${STATIC_CIDR:-$CURRENT_CIDR}"
    if is_valid_cidr "$STATIC_CIDR"; then
        break
    fi
    echo "Formato non valido. Usa IP/prefisso, es. 192.168.1.50/24."
done

while true; do
    read -r -p "Gateway [${CURRENT_GATEWAY:-}]: " GATEWAY
    GATEWAY="${GATEWAY:-$CURRENT_GATEWAY}"
    if is_valid_ipv4 "$GATEWAY"; then
        break
    fi
    echo "Formato non valido. Inserisci un indirizzo IPv4 valido."
done

DEFAULT_DNS="${CURRENT_DNS:-1.1.1.1,8.8.8.8}"
read -r -p "DNS separati da virgola [$DEFAULT_DNS]: " DNS_INPUT
DNS_INPUT="${DNS_INPUT:-$DEFAULT_DNS}"

echo ""
echo "Riepilogo:"
echo "  Interfaccia: $IFACE"
echo "  IP statico:  $STATIC_CIDR"
echo "  Gateway:     $GATEWAY"
echo "  DNS:         $DNS_INPUT"
echo ""

read -r -p "Confermi questi valori? [s/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sSyY] ]]; then
    echo "Operazione annullata, nessuna modifica scritta."
    exit 0
fi

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

apply_now_prompt() {
    local apply_cmd="$1"
    echo ""
    echo "ATTENZIONE: se i valori inseriti sono sbagliati potresti perdere subito la connessione SSH a questa VM."
    read -r -p "Applico la configurazione adesso? [s/N]: " APPLY
    if [[ "$APPLY" =~ ^[sSyY] ]]; then
        eval "$apply_cmd"
        echo "Configurazione di rete applicata."
    else
        echo "Configurazione scritta su disco ma non applicata."
        echo "Applicala manualmente quando pronto, oppure riavvia la VM."
    fi
}

if command -v netplan >/dev/null 2>&1 && ls /etc/netplan/*.yaml >/dev/null 2>&1; then
    echo "Rilevato netplan."
    NETPLAN_FILE="/etc/netplan/99-masso-static.yaml"

    IFS=',' read -ra DNS_ARRAY <<< "$DNS_INPUT"
    DNS_YAML_LIST="$(printf '"%s", ' "${DNS_ARRAY[@]}")"
    DNS_YAML_LIST="[${DNS_YAML_LIST%, }]"

    $SUDO tee "$NETPLAN_FILE" > /dev/null <<EOF
network:
  version: 2
  ethernets:
    $IFACE:
      dhcp4: false
      addresses: [$STATIC_CIDR]
      routes:
        - to: default
          via: $GATEWAY
      nameservers:
        addresses: $DNS_YAML_LIST
EOF
    $SUDO chmod 600 "$NETPLAN_FILE"
    echo "File scritto: $NETPLAN_FILE"
    $SUDO netplan generate
    apply_now_prompt "$SUDO netplan apply"

elif command -v nmcli >/dev/null 2>&1 && systemctl is-active --quiet NetworkManager 2>/dev/null; then
    echo "Rilevato NetworkManager."
    CONN_NAME="$(nmcli -t -f NAME,DEVICE connection show --active 2>/dev/null | awk -F: -v ifc="$IFACE" '$2==ifc {print $1; exit}')"
    if [ -z "$CONN_NAME" ]; then
        CONN_NAME="$(nmcli -t -f NAME,DEVICE connection show 2>/dev/null | awk -F: -v ifc="$IFACE" '$2==ifc {print $1; exit}')"
    fi
    if [ -z "$CONN_NAME" ]; then
        echo "Impossibile trovare una connessione NetworkManager per $IFACE." >&2
        exit 1
    fi

    echo "Connessione NetworkManager: $CONN_NAME"
    APPLY_CMD="$SUDO nmcli connection modify \"$CONN_NAME\" ipv4.addresses \"$STATIC_CIDR\" ipv4.gateway \"$GATEWAY\" ipv4.dns \"$DNS_INPUT\" ipv4.method manual && $SUDO nmcli connection up \"$CONN_NAME\""
    apply_now_prompt "$APPLY_CMD"

elif [ -f /etc/network/interfaces ] && systemctl is-active --quiet networking 2>/dev/null; then
    echo "Rilevato ifupdown (/etc/network/interfaces)."
    IFACES_FILE="/etc/network/interfaces"
    BACKUP_FILE="${IFACES_FILE}.bak-${TIMESTAMP}"
    $SUDO cp "$IFACES_FILE" "$BACKUP_FILE"
    echo "Backup creato: $BACKUP_FILE"

    TMP_FILE="$(mktemp)"
    awk -v ifc="$IFACE" '
        BEGIN { skip=0 }
        {
            if ($0 ~ "^[[:space:]]*auto[[:space:]]+"ifc"[[:space:]]*$") { next }
            if ($0 ~ "^[[:space:]]*iface[[:space:]]+"ifc"[[:space:]]") { skip=1; next }
            if (skip==1) {
                if ($0 ~ "^[[:space:]]*(iface|auto|mapping|source)") { skip=0 } else { next }
            }
            print
        }
    ' "$IFACES_FILE" > "$TMP_FILE"

    {
        echo ""
        echo "auto $IFACE"
        echo "iface $IFACE inet static"
        echo "    address $STATIC_CIDR"
        echo "    gateway $GATEWAY"
        if [ -n "$DNS_INPUT" ]; then
            echo "    dns-nameservers ${DNS_INPUT//,/ }"
        fi
    } >> "$TMP_FILE"

    $SUDO cp "$TMP_FILE" "$IFACES_FILE"
    rm -f "$TMP_FILE"
    echo "File aggiornato: $IFACES_FILE"
    echo "Nota: 'dns-nameservers' richiede il pacchetto 'resolvconf' per avere effetto."

    apply_now_prompt "$SUDO ifdown --force $IFACE 2>/dev/null || true; $SUDO ifup $IFACE"

elif systemctl is-active --quiet systemd-networkd 2>/dev/null; then
    echo "Rilevato systemd-networkd."
    NETWORKD_FILE="/etc/systemd/network/99-masso-static.network"

    IFS=',' read -ra DNS_ARRAY <<< "$DNS_INPUT"
    DNS_LINES=""
    for dns in "${DNS_ARRAY[@]}"; do
        DNS_LINES="${DNS_LINES}DNS=${dns}"$'\n'
    done

    $SUDO tee "$NETWORKD_FILE" > /dev/null <<EOF
[Match]
Name=$IFACE

[Network]
Address=$STATIC_CIDR
Gateway=$GATEWAY
$DNS_LINES
EOF
    $SUDO chmod 644 "$NETWORKD_FILE"
    echo "File scritto: $NETWORKD_FILE"
    apply_now_prompt "$SUDO systemctl restart systemd-networkd"

else
    echo "Impossibile rilevare automaticamente il sistema di rete (netplan/NetworkManager/ifupdown/systemd-networkd)." >&2
    echo "Configura l'IP statico manualmente in base alla distribuzione in uso." >&2
    exit 1
fi
