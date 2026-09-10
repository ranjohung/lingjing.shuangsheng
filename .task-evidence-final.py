from pathlib import Path
p=Path('docs/IMPLEMENTATION_STATUS.md');s=p.read_text(encoding='utf-8').replace('类型检查和构建通过，待复测。','类型检查、构建与390px浏览器复测通过；Android截图确认弹窗立即显示、开始后进入凤仪亭0/30并写入数据库。')
s+='\n- 补充验证：`check-entry.js`通过入世弹窗视口、伙伴方向键选择/焦点检查；只模拟profile读取，未修改用户个人资料。`check-live-progress.js`通过15秒刷新与筛选保留。Android证据为`output/playwright/android-identity.png`及`android-reader.png`；完整Android通关和真实手机仍待测。\n'
p.write_text(s,encoding='utf-8')
