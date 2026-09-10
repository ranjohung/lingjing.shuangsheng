#!/bin/bash
export PATH=/c/Users/Administrator/AppData/Roaming/npm:$PATH
cd 'F:/开发软件项目文件/灵境 · 双生'

# 截图 1: 首页（不切场景）
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli screenshot --filename=v58-01-home.png > /dev/null 2>&1
echo "1 done"

# 截图 2: 进入小说世界（全部题材）
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('novel-list'); 'ok'" > /dev/null 2>&1
playwright-cli screenshot --filename=v58-02-novel-all.png > /dev/null 2>&1
echo "2 done"

# 截图 3: 切到校园
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('novel-list'); selectGenre('classroom'); 'ok'" > /dev/null 2>&1
playwright-cli screenshot --filename=v58-03-novel-class.png > /dev/null 2>&1
echo "3 done"

# 截图 4: 切到赛博
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('novel-list'); selectGenre('neon'); 'ok'" > /dev/null 2>&1
playwright-cli screenshot --filename=v58-04-novel-neon.png > /dev/null 2>&1
echo "4 done"

# 截图 5: 进入小说详情（雨夜·拔剑）
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('novel-list'); selectGenre('pavilion'); openNovel('pavilion'); 'ok'" > /dev/null 2>&1
playwright-cli screenshot --filename=v58-05-novel-detail.png > /dev/null 2>&1
echo "5 done"

# 截图 6: 沉浸剧情游戏页（雨夜·拔剑 进行中）
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('novel-list'); openNovel('pavilion'); setTimeout(() => startGame(), 100); 'ok'" > /dev/null 2>&1
playwright-cli screenshot --filename=v58-06-game-pavilion.png > /dev/null 2>&1
echo "6 done"

# 截图 7: 推进选项后的关系值变化
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('novel-list'); openNovel('pavilion'); setTimeout(() => { startGame(); setTimeout(() => { const btns = document.querySelectorAll('.game-opt'); if (btns[2]) btns[2].click(); }, 200); }, 100); 'ok'" > /dev/null 2>&1
sleep 2
playwright-cli screenshot --filename=v58-07-game-choices.png > /dev/null 2>&1
echo "7 done"

# 截图 8: NPC 模态框
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('novel-list'); openNovel('pavilion'); setTimeout(() => { startGame(); setTimeout(() => { const npcBtn = document.querySelector('.game-opt.npc'); if (npcBtn) npcBtn.click(); }, 200); }, 100); 'ok'" > /dev/null 2>&1
sleep 2
playwright-cli screenshot --filename=v58-08-npc-modal.png > /dev/null 2>&1
echo "8 done"

# 截图 9: 双生陪伴视图
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('companion'); 'ok'" > /dev/null 2>&1
playwright-cli screenshot --filename=v58-09-companion.png > /dev/null 2>&1
echo "9 done"

# 截图 10: 仙侠题材
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
playwright-cli eval "goView('novel-list'); selectGenre('xianxia'); 'ok'" > /dev/null 2>&1
playwright-cli screenshot --filename=v58-10-novel-xianxia.png > /dev/null 2>&1
echo "10 done"

ls v58-*.png 2>/dev/null | wc -l
echo "ALL DONE"