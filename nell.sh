#!/usr/bin/env bash

# ==============================================================================
# Script Otomatisasi Setup Goyzfy untuk Termux & PRoot (Android)
# Repository: https://github.com/nellseen/goyzfy.git
# ==============================================================================

set -e

# Warna output terminal
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║             🎵 GOYZFY - SETUP TERMUX & PROOT                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ------------------------------------------------------------------------------
# 1. Deteksi Environment Otomatis (Termux Native vs PRoot)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[1/5] Mendeteksi Environment...${NC}"

ENV_TYPE="Unknown"

# Cek apakah Termux Native
if [ -n "$TERMUX_VERSION" ] || (command -v pkg &> /dev/null && [ -d "/data/data/com.termux/files/usr" ]); then
    ENV_TYPE="Termux Native"
    echo -e "${GREEN}✓ Terdeteksi:${NC} ${PURPLE}Termux Native Environment${NC}"
    echo -e "  Menggunakan package manager Termux (${CYAN}pkg${NC})..."
    
    pkg update -y
    pkg install git nodejs -y

# Cek apakah PRoot (proot-distro / chroot di Android)
else
    # Cek tanda-tanda PRoot / Linux Container di Android
    if [ -d "/data/data/com.termux" ] || [ -f "/proc/sys/kernel/osrelease" ] || [ -f "/etc/os-release" ]; then
        ENV_TYPE="PRoot Environment"
        echo -e "${GREEN}✓ Terdeteksi:${NC} ${PURPLE}PRoot Linux Environment (Tanpa Sudo)${NC}"
    else
        ENV_TYPE="Linux Container"
        echo -e "${GREEN}✓ Terdeteksi:${NC} ${PURPLE}Standard Linux Environment (Tanpa Sudo)${NC}"
    fi

    echo -e "  Mengecek package manager sistem..."

    # Install dependensi menggunakan package manager yang tersedia (TANPA SUDO)
    if command -v apt-get &> /dev/null; then
        echo -e "  Menggunakan ${CYAN}apt-get${NC}..."
        apt-get update -y
        apt-get install -y git nodejs npm
    elif command -v apk &> /dev/null; then
        echo -e "  Menggunakan ${CYAN}apk (Alpine)${NC}..."
        apk update
        apk add git nodejs npm
    elif command -v pacman &> /dev/null; then
        echo -e "  Menggunakan ${CYAN}pacman (Arch)${NC}..."
        pacman -Sy --noconfirm git nodejs npm
    elif command -v dnf &> /dev/null; then
        echo -e "  Menggunakan ${CYAN}dnf (Fedora)${NC}..."
        dnf install -y git nodejs npm
    else
        echo -e "${RED}⚠️  Package manager tidak dikenali. Pastikan git, node, dan npm sudah terpasang.${NC}"
    fi
fi

# Pastikan git dan nodejs sudah terpasang
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git gagal dipasang. Silakan pasang git secara manual.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js / NPM belum terpasang. Silakan pasang Node.js secara manual.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) & Git $(git --version | awk '{print $3}') siap digunakan.${NC}"

# ------------------------------------------------------------------------------
# 2. Clone repository dari GitHub
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[2/5] Mengunduh repository goyzfy dari GitHub...${NC}"
REPO_URL="https://github.com/nellseen/goyzfy.git"
DIR_NAME="goyzfy"

# Jika dijalankan di luar folder repo, clone atau masuk
if [ ! -f "server.js" ]; then
    if [ -d "$DIR_NAME" ]; then
        echo -e "${GREEN}Folder '$DIR_NAME' sudah ada. Memperbarui...${NC}"
        cd "$DIR_NAME"
        git pull || true
    else
        git clone "$REPO_URL"
        cd "$DIR_NAME"
    fi
else
    echo -e "${GREEN}Sudah berada di dalam direktori proyek.${NC}"
fi

# ------------------------------------------------------------------------------
# 3. Install dependency Node.js
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[3/5] Menginstall dependensi Node.js (npm install)...${NC}"
npm install

# ------------------------------------------------------------------------------
# 4. Ringkasan Status
# ------------------------------------------------------------------------------
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     ✅ SETUP SELESAI                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo -e "Environment : ${PURPLE}$ENV_TYPE${NC}"
echo -e "Port        : ${CYAN}3000${NC}"
echo -e "URL Browser : ${CYAN}http://localhost:3000${NC}"
echo ""

# ------------------------------------------------------------------------------
# 5. Jalankan server lokal
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[5/5] Menjalankan server Goyzfy...${NC}"
node server.js
