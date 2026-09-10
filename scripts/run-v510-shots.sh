#!/usr/bin/env bash
# Playwright 真机模拟 v5.10 全场景截图
set -e
export PATH="/c/Users/Administrator/AppData/Roaming/npm:$PATH"
cd 'F:/开发软件项目文件/灵境 · 双生'

PC() {
  local genre="$1"
  local out="$2"
  playwright-cli close > /dev/null 2>&1 || true
  playwright-cli open --browser=chrome http://127.0.0.1:8765/game-3d.html > /dev/null 2>&1
  sleep 5
  playwright-cli eval "(function(){var c=document.querySelector('.picker-card[data-genre=$genre]');if(c)c.click();return c?'ok':'miss';})()" > /dev/null 2>&1
  sleep 8
  playwright-cli screenshot --filename="$out" > /dev/null 2>&1
  echo "  $out done"
}

echo "[1/5] pavilion"
PC pavilion v510-05-pavilion.png
echo "[2/5] classroom"
PC classroom v510-06-classroom.png
echo "[3/5] neon"
PC neon v510-07-neon.png
echo "[4/5] livingroom"
PC livingroom v510-08-living.png
echo "[5/5] xianxia"
PC xianxia v510-09-xianxia.png

playwright-cli console 2>&1 | tail -3
ls -la v510-05-*.png v510-06-*.png v510-07-*.png v510-08-*.png v510-09-*.png 2>/dev/null
echo "ALL DONE"