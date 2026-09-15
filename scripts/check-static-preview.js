async(page)=>{
 const forbidden=[];page.on('request',r=>{if(/localhost|:8010|:3000/.test(r.url()))forbidden.push(r.url())});
 await page.setViewportSize({width:1280,height:900});await page.locator('.preview-notice').getByRole('link',{name:'写新小说',exact:true}).click();
 await page.getByRole('button',{name:'科幻',exact:true}).click();await page.getByRole('button',{name:'赛博朋克',exact:true}).click();
 await page.getByRole('textbox',{name:'故事名',exact:true}).fill('静态产品验收');await page.getByRole('textbox',{name:'创意概要',exact:true}).fill('寻找失落的记忆');await page.getByRole('button',{name:'确认，下一问',exact:true}).click();
 for(const f of ['主角类型','职业身份','核心性格'])await page.getByRole('textbox',{name:f,exact:true}).fill('自定义'+f);await page.getByRole('button',{name:'确认，下一问',exact:true}).click();
 for(const f of ['冲突类型','内在驱动力'])await page.getByRole('textbox',{name:f,exact:true}).fill('自定义'+f);await page.getByRole('button',{name:'确认，下一问',exact:true}).click();
 for(let i=0;i<6;i++)await page.getByRole('button',{name:'下一问 / 跳过此项',exact:true}).click();await page.getByRole('button',{name:'确认，进入大纲编辑',exact:true}).click();
 await page.getByRole('button',{name:'确认并锁定大纲',exact:true}).waitFor();
 for(const f of ['主题','背景','主线','关键转折点','结局方向'])await page.locator('.author-center label').filter({hasText:new RegExp('^'+f)}).locator('textarea').fill(f+' 内容');
 await page.getByRole('button',{name:'确认并锁定大纲',exact:true}).click();await page.getByRole('button',{name:'章节正文',exact:true}).click();await page.getByRole('textbox',{name:'正文',exact:true}).fill('这段正文应在刷新后保留。');await page.getByRole('button',{name:'保存作品',exact:true}).click();await page.reload();await page.getByRole('button',{name:'章节正文',exact:true}).click();if(await page.getByRole('textbox',{name:'正文',exact:true}).inputValue()!=='这段正文应在刷新后保留。')throw Error('保存失败');
 await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('布局溢出');
 if(forbidden.length)throw Error('本地服务依赖'+forbidden.join(','));return {wizard:true,localPersistence:true,reload:true,mobileOverflow:false,localServerRequests:0};
}
