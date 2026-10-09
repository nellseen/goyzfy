#!/usr/bin/env bash

# ==============================================================================
# Script Otomatisasi Setup Goyzfy untuk Termux (Android)
# Repository: https://github.com/nellseen/goyzfy.git
# ==============================================================================

set -e

# Warna output terminal
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🎵 GOYZFY - SETUP OTOMATIS TERMUX         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Update package & pastikan git dan nodejs terinstall di Termux
echo -e "${YELLOW}[1/5] Memperbarui package Termux & mengecek dependensi...${NC}"
if command -v pkg &> /dev/null; then
    pkg update -y
    pkg install git nodejs -y
else
    # Fallback jika dijalankan di environment Linux non-Termux
    echo -e "${YELLOW}Perintah pkg tidak ditemukan. Menggunakan package manager sistem...${NC}"
    if command -v apt-get &> /dev/null; then
        apt-get update -y && apt-get install -y git nodejs npm
    fi
fi

# 2. Clone repository dari GitHub
echo -e "\n${YELLOW}[2/5] Mengunduh repository goyzfy dari GitHub...${NC}"
REPO_URL="https://github.com/nellseen/goyzfy.git"
DIR_NAME="goyzfy"

if [ -d "$DIR_NAME" ]; then
    echo -e "${GREEN}Folder '$DIR_NAME' sudah ada. Memperbarui repository...${NC}"
    cd "$DIR_NAME"
    git pull || true
else
    git clone "$REPO_URL"
    cd "$DIR_NAME"
fi

# 3. Install dependency Node.js
echo -e "\n${YELLOW}[3/5] Menginstall dependensi Node.js...${NC}"
npm install

# 4. Informasi IP dan Port
echo -e "\n${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ SETUP BERHASIL SELESAI            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo -e "Aplikasi akan dijalankan pada port ${CYAN}3000${NC}"
echo -e "Buka browser Anda dan akses: ${CYAN}http://localhost:3000${NC}"
echo ""

# 5. Jalankan server lokal
echo -e "${YELLOW}[4/5] Menjalankan server Goyzfy...${NC}"
node server.js
