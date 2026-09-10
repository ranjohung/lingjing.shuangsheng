#!/usr/bin/env bash
# v5.10 redesign 全流程截图（每张都用 playwright-cli 单次连续调用）
export PATH="/c/Users/Administrator/AppData/Roaming/npm:$PATH"
cd 'F:/开发软件项目文件/灵境 · 双生' || exit 1
OUT="output/preview/screenshots/v58"

snap() {
  local cmd="$1"; local file="$2"
  playwright-cli close > /dev/null 2>&1 || true
  playwright-cli open --browser=chrome "http://127.0.0.1:8765/redesign.html?$file" > /dev/null 2>&1
  sleep 4
  if [ -n "$cmd" ]; then
    playwright-cli eval "$cmd" > /dev/null 2>&1
    sleep 3
  fi
  playwright-cli screenshot --filename="$OUT/$file" > /dev/null 2>&1
  echo "  $file done"
}

snap "" v58-01-home.png
snap "goView('novel-list'); selectGenre('all');" v58-02-novel-all.png
snap "goView('novel-list'); selectGenre('classroom');" v58-03-class.png
snap "goView('novel-list'); selectGenre('neon');" v58-04-neon.png
snap "goView('novel-detail'); openNovel('pavilion');" v58-05-detail.png
snap "goView('game'); openNovel('pavilion'); setTimeout(function(){startGame(false);}, 500); setTimeout(function(){if(story&&story.pavilion&&story.pavilion.chapters[0])showDialogue(story.pavilion.chapters[0]);}, 1500);" v58-06-game.png
snap "goView('game'); openNovel('pavilion'); setTimeout(function(){startGame(false);}, 500);" v58-07-game-choice.png
snap "goView('game'); openNovel('pavilion'); setTimeout(function(){startGame(false); setTimeout(askNPC, 1500);}, 500);" v58-08-npc.png
snap "goView('companion');" v58-09-companion.png
snap "goView('novel-list'); selectGenre('xianxia');" v58-10-xianxia.png
snap "goView('novel-list'); selectGenre('livingroom');" v58-11-living.png
snap "goView('studio');" v58-12-studio.png

playwright-cli close > /dev/null 2>&1 || true
echo "md5 check:"
md5sum "$OUT"/*.png | head -15
echo "DONE"