#!/bin/bash
export PATH=/c/Users/Administrator/AppData/Roaming/npm:$PATH
cd 'F:/开发软件项目文件/灵境 · 双生'

shot() {
  local name=$1
  local eval_cmd=$2
  playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
  # eval 并 sleep 0.3s 等渲染
  playwright-cli eval "new Promise(r => setTimeout(() => { $eval_cmd; r('done'); }, 300))" > /dev/null 2>&1
  playwright-cli screenshot --filename="$name" > /dev/null 2>&1
  echo "$name done"
}

# 1. 首页
shot "v58-01-home.png" ""

# 2. 小说世界（全部题材）
shot "v58-02-novel-all.png" "goView('novel-list')"

# 3. 校园题材
shot "v58-03-class.png" "goView('novel-list'); selectGenre('classroom')"

# 4. 赛博题材
shot "v58-04-neon.png" "goView('novel-list'); selectGenre('neon')"

# 5. 小说详情（雨夜凉亭）
shot "v58-05-detail.png" "openNovel('pavilion')"

# 6. 沉浸剧情游戏页
shot "v58-06-game.png" "openNovel('pavilion'); startGame()"

# 7. 推进选项
shot "v58-07-game-choice.png" "openNovel('pavilion'); startGame(); const btns=document.querySelectorAll('.game-opt'); if(btns[2])btns[2].click()"

# 8. NPC 模态框
shot "v58-08-npc.png" "openNovel('pavilion'); startGame(); const npcBtn=document.querySelector('.game-opt.npc'); if(npcBtn)npcBtn.click()"

# 9. 双生陪伴
shot "v58-09-companion.png" "goView('companion')"

# 10. 仙侠
shot "v58-10-xianxia.png" "goView('novel-list'); selectGenre('xianxia')"

# 11. 现代
shot "v58-11-living.png" "goView('novel-list'); selectGenre('livingroom')"

# 12. 创作中心
shot "v58-12-studio.png" "goView('studio')"

ls v58-*.png | wc -l
echo "ALL DONE"