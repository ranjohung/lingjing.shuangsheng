// 灵境 · 双生 — 22 题材小说世界目录（数据层 v1）
// 设计依据：docs/UI_DESIGN_GUIDE.md §UI-06.2 / docs/product/06-world-directory-and-ui.md §UI-02
// 任何字段变更必须同步两处文档；新增主类需要法务过一道风控关键词扫描

export type GenreIcon =
  | "scroll" | "cloud" | "sword" | "dragon" | "city" | "home"
  | "scroll-old" | "helmet" | "rocket" | "biohazard" | "search" | "ghost"
  | "heart" | "fan" | "sparkle" | "backpack" | "gamepad" | "trophy"
  | "repeat" | "book" | "users" | "heart-three" | "balloon" | "more";

export interface GenreSub {
  /** 子类唯一 slug，供 URL 使用 */
  slug: string;
  /** 显示名 */
  name: string;
  /** 子类简述（一句话） */
  blurb: string;
}

export interface Genre {
  /** 主类唯一 slug，URL 第一段 */
  slug: string;
  /** 显示名 */
  name: string;
  /** 主色（HSL / HEX 均可；这里给出 HEX） */
  color: string;
  /** 主色（用于悬浮/边框，亮一档） */
  colorAlt: string;
  /** 字体风格 token，serif=古风/厚重，sans=现代 */
  fontKey: "serif" | "sans" | "display";
  /** lucide / icon-park icon 名 */
  icon: GenreIcon;
  /** 一句话定位 */
  blurb: string;
  /** 标签（如 男频 / 女频 / 中性） */
  audience: "neutral" | "male-leaning" | "female-leaning" | "both";
  /** 经典子类（每类 6 条，按出现频次排序） */
  subs: GenreSub[];
  /** 在 22 类中的相对热度（0-100），用于排序 */
  heat: number;
}

/**
 * 22 主类 × 6 子类，完整枚举。
 * ⚠ 题材只是导航，不强制男女频；女性向 / 男性向通过 "风格标签" 区分。
 */
export const GENRES: Genre[] = [
  {
    slug: "xuanhuan",
    name: "玄幻",
    color: "#8E5BD8",
    colorAlt: "#B79BEA",
    fontKey: "serif",
    icon: "scroll",
    blurb: "灵气、异世、废柴逆袭、王朝与位面交错。",
    audience: "male-leaning",
    subs: [
      { slug: "dongfang", name: "东方玄幻", blurb: "修真炼气、洞天福地与上古秘境。" },
      { slug: "yishi", name: "异世大陆", blurb: "穿越到陌生大陆，立族开派。" },
      { slug: "gaowu", name: "高武", blurb: "肉身横推、战力破界。" },
      { slug: "wangchao", name: "王朝争霸", blurb: "庙堂与江湖共一卷棋盘。" },
      { slug: "honghuang", name: "洪荒", blurb: "封神之前、巫妖之争。" },
      { slug: "yineng", name: "异能", blurb: "都市 + 超能力觉醒。" },
    ],
    heat: 92,
  },
  {
    slug: "xianxia",
    name: "仙侠",
    color: "#5B9CD8",
    colorAlt: "#92C0E4",
    fontKey: "serif",
    icon: "cloud",
    blurb: "剑光与道心，凡人也能成仙。",
    audience: "both",
    subs: [
      { slug: "gudian", name: "古典仙侠", blurb: "还珠、诛仙式仙道叙事。" },
      { slug: "huanxiang", name: "幻想修仙", blurb: "轻量修真，重意境。" },
      { slug: "zongmen", name: "宗门", blurb: "掌门、弟子与对外征伐。" },
      { slug: "fanren", name: "凡人流", blurb: "散修崛起。" },
      { slug: "dandao", name: "丹器阵符", blurb: "四艺证道。" },
      { slug: "yushou", name: "御兽", blurb: "伴生灵兽，协同修行。" },
    ],
    heat: 90,
  },
  {
    slug: "wuxia",
    name: "武侠",
    color: "#5B8E5B",
    colorAlt: "#8FBF8F",
    fontKey: "serif",
    icon: "sword",
    blurb: "江湖一盏灯，儿女一坛酒。",
    audience: "both",
    subs: [
      { slug: "chuantong", name: "传统武侠", blurb: "金古梁温下的山河。" },
      { slug: "xinpai", name: "新派武侠", blurb: "陆小凤、欢乐英雄式叙事。" },
      { slug: "jianghu", name: "江湖恩怨", blurb: "门派、镖路、门派仇杀。" },
      { slug: "chaoting", name: "朝堂武林", blurb: "庙堂与江湖交错。" },
 I'm cut off here. Let me complete this comprehensively.
      { slug: "jianghu-erci", name: "武侠二创", blurb: "金庸宇宙同人。" },
      { slug: "yiwen", name: "逸闻", blurb: "短篇江湖轶事。" },
    ],
    heat: 76,
  },
  {
    slug: "qihuan",
    name: "奇幻",
    color: "#C95B9C",
    colorAlt: "#E291BE",
    fontKey: "display",
    icon: "dragon",
    blurb: "剑与魔法、龙与圣杯的世界。",
    audience: "both",
    subs: [
      { slug: "xifang", name: "西方奇幻", blurb: "托尔金式史诗。" },
      { slug: "jianmo", name: "剑与魔法", blurb: "职业、塔、地下城。" },
      { slug: "shishi", name: "史诗奇幻", blurb: "长篇王国兴衰。" },
      { slug: "xixuegui", name: "吸血鬼", blurb: "黑夜贵族与不死之恋。" },
      { slug: "shenhua", name: "神话", blurb: "东西方神话再写。" },
      { slug: "duizhang", name: "队长与队", blurb: "冒险小队日常。" },
    ],
    heat: 82,
  },
  {
    slug: "dushi",
    name: "都市",
    color: "#D8A45B",
    colorAlt: "#EFC78C",
    fontKey: "sans",
    icon: "city",
    blurb: "城市霓虹与生活烟火。",
    audience: "both",
    subs: [
      { slug: "dushi-life", name: "都市生活", blurb: "平凡人的烟火与梦想。" },
      { slug: "dushi-yineng", name: "都市异能", blurb: "现代下的超自然。" },
      { slug: "shangzhan", name: "商战", blurb: "商场如战场。" },
      { slug: "zhichang", name: "职场", blurb: "晋升、跳槽与人心。" },
      { slug: "yulequan", name: "娱乐圈", blurb: "台前幕后。" },
      { slug: "meishi", name: "美食", blurb: "厨房与故乡。" },
    ],
    heat: 88,
  },
  {
    slug: "xianshi",
    name: "现实",
    color: "#88A668",
    colorAlt: "#B3CB96",
    fontKey: "sans",
    icon: "home",
    blurb: "生活本身就是最复杂的故事。",
    audience: "neutral",
    subs: [
      { slug: "jiating", name: "家庭", blurb: "三代人之间的细碎。" },
      { slug: "shehui", name: "社会", blurb: "小人物的命运。" },
      { slug: "xingye", name: "行业", blurb: "医生、警察、律师。" },
      { slug: "xiangtu", name: "乡土", blurb: "村庄与时代。" },
      { slug: "niandai", name: "年代", blurb: "回到一个具体的十年。" },
      { slug: "shenghuo", name: "生活流", blurb: "日复一日的重量。" },
    ],
    heat: 70,
  },
  {
    slug: "lishi",
    name: "历史",
    color: "#8B5A2B",
    colorAlt: "#B58560",
    fontKey: "serif",
    icon: "scroll-old",
    blurb: "在故纸堆里，我们重逢。",
    audience: "male-leaning",
    subs: [
      { slug: "qinhan", name: "秦汉", blurb: "大一统的源头。" },
      { slug: "sanguo", name: "三国", blurb: "英雄与枭雄。" },
      { slug: "suitang", name: "隋唐", blurb: "盛世与转折。" },
      { slug: "songyuan", name: "宋元", blurb: "市井与铁骑。" },
      { slug: "mingqing", name: "明清", blurb: "最后的王朝。" },
      { slug: "jiakong", name: "架空历史", blurb: "平行中国/世界。" },
    ],
    heat: 78,
  },
  {
    slug: "junshi",
    name: "军事",
    color: "#4A6B8A",
    colorAlt: "#7C97B5",
    fontKey: "sans",
    icon: "helmet",
    blurb: "钢与火的另一种语言。",
    audience: "male-leaning",
    subs: [
      { slug: "gudai", name: "古代战争", blurb: "刀兵与兵法。" },
      { slug: "jinxiandai", name: "近现代", blurb: "一战、二战、抗战、解放。" },
      { slug: "diezhan", name: "谍战", blurb: "伪装、暗号与上海滩。" },
      { slug: "zhanlue", name: "战略", blurb: "运筹帷幄。" },
      { slug: "junshi-kehuan", name: "军事科幻", blurb: "近未来的战争推演。" },
      { slug: "teji", name: "特种", blurb: "单兵与小队。" },
    ],
    heat: 72,
  },
  {
    slug: "kehuan",
    name: "科幻",
    color: "#4FB3D9",
    colorAlt: "#83D0E8",
    fontKey: "sans",
    icon: "rocket",
    blurb: "星辰大海，代码与金属。",
    audience: "both",
    subs: [
      { slug: "xingji", name: "星际文明", blurb: "银河与星门。" },
      { slug: "taikong", name: "太空歌剧", blurb: "阿西莫夫式史诗。" },
      { slug: "jijia", name: "机甲", blurb: "高达、环太平洋式浪漫。" },
      { slug: "ai", name: "AI", blurb: "硅基存在与意识。" },
      { slug: "shijian", name: "时间旅行", blurb: "祖父悖论与蝴蝶。" },
      { slug: "saibo", name: "赛博朋克", blurb: "霓虹、低生活、高科技。" },
    ],
    heat: 86,
  },
  {
    slug: "mori",
    name: "末日",
    color: "#6B8E23",
    colorAlt: "#94B655",
    fontKey: "sans",
    icon: "biohazard",
    blurb: "文明之后，剩下的人心。",
    audience: "both",
    subs: [
      { slug: "zaibian", name: "灾变", blurb: "天灾与重建。" },
      { slug: "jiangshi", name: "丧尸", blurb: "尸潮与人性。" },
      { slug: "feitu", name: "废土", blurb: "辐射后的新部落。" },
      { slug: "yineng", name: "末世异能", blurb: "末日下的觉醒者。" },
      { slug: "biniansuo", name: "避难所", blurb: "地下的秩序。" },
      { slug: "qiusheng", name: "求生", blurb: "荒野与孤独。" },
    ],
    heat: 80,
  },
  {
    slug: "xuanyi",
    name: "悬疑",
    color: "#5A6B8E",
    colorAlt: "#8595B5",
    fontKey: "sans",
    icon: "search",
    blurb: "真相，是另一种冒险。",
    audience: "both",
    subs: [
      { slug: "zhentan", name: "侦探", blurb: "波洛、柯南式推理。" },
      { slug: "xingzhen", name: "刑侦", blurb: "现场与审讯。" },
      { slug: "shehuipai", name: "社会派", blurb: "东野圭吾式人性。" },
      { slug: "beng", name: "本格", blurb: "严密诡计与公平竞赛。" },
      { slug: "xinli", name: "心理", blurb: "脑内的密室。" },
      { slug: "fayi", name: "法医", blurb: "手术刀下的故事。" },
      { slug: "mishi", name: "密室", blurb: "不可能的犯罪。" },
    ],
    heat: 84,
  },
  {
    slug: "jingsong",
    name: "惊悚",
    color: "#8A4F6B",
    colorAlt: "#B07D96",
    fontKey: "display",
    icon: "ghost",
    blurb: "看清阴影之前，先屏住呼吸。",
    audience: "neutral",
    subs: [
      { slug: "mnsu", name: "民俗", blurb: "乡野传说与禁忌。" },
      { slug: "lingyi", name: "灵异", blurb: "现代都市鬼话。" },
      { slug: "guaitan", name: "怪谈", blurb: "短篇夜话。" },
      { slug: "kcsl", name: "克苏鲁", blurb: "宇宙的冷漠与人性的崩裂。" },
      { slug: "maoxian", name: "惊悚冒险", blurb: "心跳与解谜并行。" },
      { slug: "xiecheng", name: "写实惊悚", blurb: "可能发生在隔壁的恐怖。" },
    ],
    heat: 74,
  },
  {
    slug: "xiandai-yanqing",
    name: "现代言情",
    color: "#E89B5A",
    colorAlt: "#F2BC8A",
    fontKey: "display",
    icon: "heart",
    blurb: "电梯里的第二次相遇。",
    audience: "female-leaning",
    subs: [
      { slug: "xiandai-dushi", name: "都市", blurb: "城市的两人三餐。" },
      { slug: "xiandai-zhichang", name: "职场", blurb: "同事、对手或更多。" },
      { slug: "haomen", name: "豪门", blurb: "巨富家庭的纠葛。" },
      { slug: "qiyue", name: "契约", blurb: "从契约开始的相处。" },
      { slug: "xianhun", name: "先婚后爱", blurb: "婚后才了解彼此。" },
      { slug: "zhiyu", name: "治愈", blurb: "像春风。" },
    ],
    heat: 95,
  },
  {
    slug: "gudai-yanqing",
    name: "古代言情",
    color: "#B85988",
    colorAlt: "#D085A8",
    fontKey: "serif",
    icon: "fan",
    blurb: "深闺与江湖，女子一样可立。",
    audience: "female-leaning",
    subs: [
      { slug: "gongting", name: "宫廷", blurb: "宫墙里的真心与算计。" },
      { slug: "zhaimen", name: "宅门", blurb: "大家族的女性群像。" },
      { slug: "jianghuqingyuan", name: "江湖情缘", blurb: "武侠 + 爱情。" },
      { slug: "quanmou", name: "权谋", blurb: "女主不输男儿。" },
      { slug: "jingying", name: "古代经营", blurb: "从市井到一方势力。" },
      { slug: "chuanyue-guyan", name: "穿越古言", blurb: "回到一个朝代。" },
    ],
    heat: 89,
  },
  {
    slug: "huanxiang-yanqing",
    name: "幻想言情",
    color: "#C97BD8",
    colorAlt: "#DFA3E8",
    fontKey: "display",
    icon: "sparkle",
    blurb: "他不是人类，但他也心动。",
    audience: "female-leaning",
    subs: [
      { slug: "xianxiaqingyuan", name: "仙侠情缘", blurb: "修道伴侣。" },
      { slug: "qihuang", name: "奇幻恋爱", blurb: "异世界的相识。" },
      { slug: "feirenlei", name: "非人类", blurb: "妖、鬼、神、AI。" },
      { slug: "xingjiqingyuan", name: "星际情缘", blurb: "跨越光年的相守。" },
      { slug: "yishijie", name: "异世界", blurb: "穿越到他方。" },
      { slug: "shixian", name: "师徒", blurb: "师徒名分下的情感。" },
    ],
    heat: 87,
  },
  {
    slug: "qingchun-xiaoyuan",
    name: "青春校园",
    color: "#88C97B",
    colorAlt: "#ABE09D",
    fontKey: "sans",
    icon: "backpack",
    blurb: "教室外的蝉鸣，比谁都响。",
    audience: "both",
    subs: [
      { slug: "daxue", name: "大学", blurb: "从军训到毕业。" },
      { slug: "qingchun", name: "青春成长", blurb: "少年心事。" },
      { slug: "shetuan", name: "社团", blurb: "兴趣与人际。" },
      { slug: "xiaoyuan-xuanyi", name: "校园悬疑", blurb: "教室里的秘密。" },
      { slug: "xiaoyuan-lian", name: "校园恋爱", blurb: "同桌、邻座、班群。" },
      { slug: "gaozhong", name: "高中", blurb: "高考倒计时下的青春。" },
    ],
    heat: 80,
  },
  {
    slug: "youxi",
    name: "游戏",
    color: "#5B7AD8",
    colorAlt: "#8AA0E5",
    fontKey: "sans",
    icon: "gamepad",
    blurb: "键盘与摇杆，另一种人生。",
    audience: "male-leaning",
    subs: [
      { slug: "moni-wangyou", name: "虚拟网游", blurb: "全息与公会的时代。" },
      { slug: "dianjing", name: "电竞", blurb: "职业选手与青春。" },
      { slug: "youxi-yi", name: "游戏异界", blurb: "穿越成 NPC。" },
      { slug: "zhuoyou", name: "桌游", blurb: "现实中的副本。" },
      { slug: "kaihei", name: "开黑", blurb: "团队日常。" },
      { slug: "diyu", name: "地下城", blurb: "深渊与宝藏。" },
    ],
    heat: 78,
  },
  {
    slug: "tiyu",
    name: "体育",
    color: "#D88A4F",
    colorAlt: "#EBAE7C",
    fontKey: "sans",
    icon: "trophy",
    blurb: "跑道上的，不只是输赢。",
    audience: "neutral",
    subs: [
      { slug: "zuqiu", name: "足球", blurb: "11人与 90 分钟。" },
      { slug: "lanqiu", name: "篮球", blurb: "油漆区的故事。" },
      { slug: "saiche", name: "赛车", blurb: "弯道与心跳。" },
      { slug: "gedou", name: "格斗", blurb: "八角笼与意志。" },
      { slug: "paiqiu", name: "排球", blurb: "空中接力。" },
      { slug: "tianjing", name: "田径", blurb: "一个人的对手。" },
    ],
    heat: 60,
  },
  {
    slug: "wuxian-liu",
    name: "无限流",
    color: "#6B5BD8",
    colorAlt: "#9887E8",
    fontKey: "display",
    icon: "repeat",
    blurb: "通关一个副本，再开一扇门。",
    audience: "both",
    subs: [
      { slug: "wuxian", name: "无限流", blurb: "无限恐怖式分类。" },
      { slug: "zhutian", name: "诸天", blurb: "穿越电影、小说世界。" },
      { slug: "kuaichuan", name: "快穿", blurb: "完成一个任务再穿越。" },
      { slug: "fuben", name: "副本", blurb: "现实副本化。" },
      { slug: "lunhui", name: "轮回", blurb: "记得过去世的人。" },
      { slug: "xuannian", name: "悬疑无限", blurb: "悬疑 + 副本。" },
    ],
    heat: 90,
  },
  {
    slug: "qingxiaoshuo",
    name: "轻小说",
    color: "#D9A0CE",
    colorAlt: "#E8C2DF",
    fontKey: "display",
    icon: "book",
    blurb: "日轻中轻，另一种轻盈。",
    audience: "both",
    subs: [
      { slug: "yuanchuang", name: "原创轻小说", blurb: "日系气质原创。" },
      { slug: "richang", name: "日常", blurb: "无大事，但是有温度。" },
      { slug: "yishijie-ln", name: "异世界轻小说", blurb: "萌系转生。" },
      { slug: "xuanyi-ln", name: "悬疑轻小说", blurb: "轻推理与短篇。" },
      { slug: "xinzhai", name: "新宅", blurb: "宅文化与校园。" },
      { slug: "zhuansheng", name: "转生", blurb: "重新开始的人生。" },
    ],
    heat: 76,
  },
  {
    slug: "nvxing-qunxiang",
    name: "女性群像",
    color: "#E89B5A",
    colorAlt: "#F2BC8A",
    fontKey: "display",
    icon: "users",
    blurb: "她们，不是一个主角。",
    audience: "female-leaning",
    subs: [
      { slug: "chengzhang", name: "女性成长", blurb: "从女孩到她自己。" },
      { slug: "jiating-shiye", name: "家庭事业", blurb: "母亲、妻子、女儿。" },
      { slug: "qunxiang", name: "群像", blurb: "几代女性同框。" },
      { slug: "youqing", name: "友情", blurb: "女孩之间的爱。" },
      { slug: "shiye", name: "事业经营", blurb: "从零开始的工作室。" },
      { slug: "yishu", name: "艺术", blurb: "舞蹈、绘画、表演。" },
    ],
    heat: 78,
  },
  {
    slug: "duoyuan-qinggan",
    name: "多元情感",
    color: "#C95B9C",
    colorAlt: "#E291BE",
    fontKey: "display",
    icon: "heart-three",
    blurb: "爱，不止一种形状。",
    audience: "neutral",
    subs: [
      { slug: "chunai", name: "纯爱", blurb: "一爱一生的选项。" },
      { slug: "baihua", name: "百合", blurb: "女生之间的爱。" },
      { slug: "wucp", name: "无 CP", blurb: "重情节轻关系。" },
      { slug: "qunxiang-guanxi", name: "群像关系", blurb: "多人互文。" },
      { slug: "xinnuan", name: "温馨", blurb: "治愈向。" },
      { slug: "zhengjie", name: "正经恋", blurb: "细水长流。" },
    ],
    heat: 72,
  },
  {
    slug: "ertong",
    name: "儿童文学",
    color: "#88A668",
    colorAlt: "#B3CB96",
    fontKey: "display",
    icon: "balloon",
    blurb: "给童年的一束温柔的光。",
    audience: "neutral",
    subs: [
      { slug: "tonghua", name: "童话", blurb: "经典与现代童话。" },
      { slug: "yuyan", name: "寓言", blurb: "动物寓言与哲思。" },
      { slug: "shenhua-gaibian", name: "神话改编", blurb: "给孩子的神话。" },
      { slug: "kepu", name: "科普童话", blurb: "科学 + 想象。" },
      { slug: "ertong-qihuan", name: "儿童奇幻", blurb: "魔法与日常。" },
      { slug: "youxi-shu", name: "游戏书", blurb: "你来决定的故事。" },
    ],
    heat: 50,
  },
  {
    slug: "qita",
    name: "其他",
    color: "#6E6E68",
    colorAlt: "#9A9A93",
    fontKey: "sans",
    icon: "more",
    blurb: "无法归类的，都先放在这里。",
    audience: "neutral",
    subs: [
      { slug: "zidingyi", name: "自定义", blurb: "用户自建。" },
      { slug: "shiyan", name: "实验文学", blurb: "探索边界。" },
      { slug: "fanzhuan", name: "反转", blurb: "打破套路。" },
      { slug: "xiandaishi", name: "现代诗", blurb: "分行但不分行。" },
      { slug: "duhua", name: "短篇精选", blurb: "几分钟的故事。" },
      { slug: "shengyin", name: "声音剧", blurb: "用耳朵听的小说。" },
    ],
    heat: 40,
  },
];

/** 跨题材共用标签（多选） */
export const CROSS_TAGS = [
  { slug: "chuanyue", name: "穿越", count: 1245 },
  { slug: "chongsheng", name: "重生", count: 987 },
  { slug: "xitong", name: "系统流", count: 854 },
  { slug: "fuchou", name: "复仇", count: 762 },
  { slug: "zhongtian", name: "种田", count: 1342 },
  { slug: "dushaofei", name: "读少飞", count: 1023 },
  { slug: "zongmen", name: "宗门/家族", count: 698 },
  { slug: "nüzhujue", name: "大女主", count: 1102 },
  { slug: "nanzhujue", name: "大男主", count: 1453 },
  { slug: "qingyu", name: "情感细腻", count: 942 },
  { slug: "kaixin", name: "轻松", count: 823 },
  { slug: "shengcun", name: "生存", count: 651 },
];

/** 内容来源筛选 */
export const SOURCE_OPTIONS = [
  { slug: "official", name: "官方", desc: "灵境原创与公版改编" },
  { slug: "creator", name: "创作者", desc: "认证创作者作品" },
  { slug: "ai", name: "AI 生成", desc: "用户参与生成的展开剧情" },
  { slug: "public", name: "公版", desc: "古典名著改编" },
];

/** 关系取向筛选（仅文案展示，不分高低） */
export const RELATION_OPTIONS = [
  { slug: "hetero", name: "异性向" },
  { slug: "yuri", name: "百合" },
  { slug: "bl", name: "BL" },
  { slug: "wucp", name: "无 CP" },
  { slug: "haoyou", name: "友情向" },
];

/** 试读 / 免费 / 付费 / 完结 / 连载 状态 */
export const ACCESS_OPTIONS = [
  { slug: "try", name: "试读" },
  { slug: "free", name: "免费" },
  { slug: "paid", name: "付费" },
  { slug: "complete", name: "完结" },
  { slug: "serial", name: "连载" },
];

/** 排序 */
export const SORT_OPTIONS = [
  { slug: "hot", name: "热度" },
  { slug: "new", name: "最新" },
  { slug: "rating", name: "评分" },
  { slug: "words", name: "字数" },
  { slug: "length", name: "预计时长" },
];

/** 工具：根据 slug 取 Genre */
export const getGenre = (slug: string) => GENRES.find((g) => g.slug === slug);
/** 工具：根据 slug 取 Genre Sub */
export const getSub = (genreSlug: string, subSlug: string) =>
  getGenre(genreSlug)?.subs.find((s) => s.slug === subSlug);

/** 22 题材二级导航彩色大气泡样式生成器 */
export const genreGradient = (g: Genre): string =>
  `linear-gradient(135deg, ${g.color}30 0%, ${g.colorAlt}25 60%, transparent 100%)`;
</content>
</invoke>