#!/bin/bash
# v5.9 全流程真机模拟：4 功能区 + 公版名著 + 聊天 + 创作 + 发现
export PATH=/c/Users/Administrator/AppData/Roaming/npm:$PATH
cd 'F:/开发软件项目文件/灵境 · 双生'

step() { echo "=== $1 ==="; }

step "打开页面"
playwright-cli open --browser=chrome http://127.0.0.1:8765/redesign.html > /dev/null 2>&1
sleep 4

# 清空 localStorage 保证干净测试
playwright-cli eval "localStorage.clear(); location.reload(); 'cleared'" > /dev/null 2>&1
sleep 3

step "01 首页"
playwright-cli screenshot --filename=v59-01-home.png > /dev/null 2>&1

step "02 小说世界 · 名著 tab"
playwright-cli eval "goView('novel-list'); selectGenre('mingzhu'); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-02-mingzhu.png > /dev/null 2>&1

step "03 西游记详情页"
playwright-cli eval "openNovel('xyj'); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-03-xyj-detail.png > /dev/null 2>&1

step "04 西游记 · 开玩（章节过场节点1）"
playwright-cli eval "startGame(); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-04-xyj-game.png > /dev/null 2>&1

step "05 选A 一棒打杀 → 节点2"
playwright-cli eval "document.querySelectorAll('#gameOptions .game-opt')[0].click(); 'A'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-05-xyj-choice.png > /dev/null 2>&1

step "06 选A 解释 → 节点3"
playwright-cli eval "document.querySelectorAll('#gameOptions .game-opt')[0].click(); 'A'" > /dev/null 2>&1
sleep 1

step "07 选A 再打 → 被逐结局"
playwright-cli eval "document.querySelectorAll('#gameOptions .game-opt')[0].click(); 'A'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-06-xyj-end.png > /dev/null 2>&1

step "08 重开 · 走真相结局"
playwright-cli eval "startGame();
document.querySelectorAll('#gameOptions .game-opt')[0].click();" > /dev/null 2>&1
sleep 1
playwright-cli eval "document.querySelectorAll('#gameOptions .game-opt')[1].click();" > /dev/null 2>&1
sleep 1
playwright-cli eval "document.querySelectorAll('#gameOptions .game-opt')[1].click();" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-07-xyj-truth.png > /dev/null 2>&1

step "09 双生陪伴 · 签到"
playwright-cli eval "goView('companion'); doCheckin(); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-08-companion.png > /dev/null 2>&1

step "10 和林霜晚聊天"
playwright-cli eval "chatWith('lin'); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli eval "sendChat('你在等谁？'); 'sent'" > /dev/null 2>&1
sleep 2
playwright-cli screenshot --filename=v59-09-chat.png > /dev/null 2>&1

step "11 创作中心 · 新建作品"
playwright-cli eval "goView('studio'); newWork(); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli eval "
editingWork.title = '长安夜雨录';
editingWork.genre = '古风';
editingWork.intro = '长安城的雨下了三日，朱雀大街尽头有人撑伞等你。';
editingWork.nodes[0].speaker = '神秘人';
editingWork.nodes[0].text = '雨打在伞面上。那人终于开口：「你迟到了三年。」';
editingWork.nodes[0].options[0].label = '「三年前发生了什么？」';
editingWork.nodes[0].options[0].trust = 5;
editingWork.nodes[0].options[0].intimacy = 3;
editingWork.nodes[0].options[0].next = -1;
editingWork.ending.name = '雨停了';
editingWork.ending.text = '她收了伞，雨水从伞骨滑落。「三年前，你在雨里说会回来。」她转身走入长安的灯火，「这次，别再迟到了。」——结局「雨停了」· COMMON · 普通';
'filled'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-10-editor.png > /dev/null 2>&1

step "12 发布作品"
playwright-cli eval "saveEditor(true); 'published'" > /dev/null 2>&1
sleep 1

step "13 试玩自己的作品"
playwright-cli eval "
const w = getWorks().find(x => x.title === '长安夜雨录');
STORY[w.id] = userStoryToEngine(w);
currentNovel = userWorkToNovel(w);
startGame(); 'playing'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-11-mywork-game.png > /dev/null 2>&1

step "14 小说世界 · 我的创作 tab"
playwright-cli eval "goView('novel-list'); selectGenre('mine'); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-12-mine.png > /dev/null 2>&1

step "15 发现页 · 排行+成就"
playwright-cli eval "goView('discover'); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-13-discover.png > /dev/null 2>&1

step "16 发现页 · 搜索"
playwright-cli eval "
document.getElementById('searchInput').value = '西游';
renderSearchResults(); 'searched'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-14-search.png > /dev/null 2>&1

step "17 三国 · 三顾茅庐 游玩"
playwright-cli eval "openNovel('sgyy'); startGame();
document.querySelectorAll('#gameOptions .game-opt')[0].click();" > /dev/null 2>&1
sleep 1
playwright-cli eval "document.querySelectorAll('#gameOptions .game-opt')[0].click();" > /dev/null 2>&1
sleep 1
playwright-cli eval "document.querySelectorAll('#gameOptions .game-opt')[0].click();" > /dev/null 2>&1
sleep 1
playwright-cli eval "document.querySelectorAll('#gameOptions .game-opt')[0].click();" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-15-sgyy-end.png > /dev/null 2>&1

step "18 console 检查"
playwright-cli console 2>&1 | tail -6

step "19 成就墙更新后"
playwright-cli eval "goView('discover'); 'ok'" > /dev/null 2>&1
sleep 1
playwright-cli screenshot --filename=v59-16-ach.png > /dev/null 2>&1

playwright-cli close > /dev/null 2>&1
echo "ALL DONE"
