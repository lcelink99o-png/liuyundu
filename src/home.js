/* ============================================================
 * 流云渡主页 · 数据层 + 动效层
 * 复刻 museum-of-motion：逐字母 stagger 入场 + 滚动 reveal
 * ============================================================ */
import novels from '../novels.json'

// 动态读取全局 GSAP（由 home.html 的 vendor 脚本提供），缺失时降级为空操作，避免白屏
function getGSAP() { return window.gsap || null }
function getScrollTrigger() { return window.ScrollTrigger || null }

// 世界观六大板块（去掉人口，图片 → 板块映射）
const WORLD_SECTIONS = [
  {
    id: 'geo',
    name: '地理格局',
    img: 'images/world-geo.jpg',
    brief: '云城坐落在神州最东边，流云江穿城而过，玉石岭镇守南境，镇衡雕像俯瞰全城。',
    full: [
      '云城西北和西南都是高山，玉石岭余脉向东延伸，省会兴泽在中部，流云渡在云城的最东边。',
      '流云江：发源自云城山峦层叠的玉石岭，支流千万，共同造就了流云渡这一方天地。出流云渡后，到地势平坦的浮玉省，便可以正常通航。',
      '流云江上伫立着一座巨型镇衡雕像。',
    ],
  },
  {
    id: 'politics',
    name: '政治体制',
    img: 'images/world-politics.jpg',
    brief: '总督制与常务会议并行，民主化进程缓缓推进，九地方市各安其位。',
    full: [
      '神州各省内部的政治体制差异明显，尤其是云城。',
      '常规制度：除云城外，地方议会的多数党领袖担当省（市）最高领导人，领导人拥有党籍，与政党共进退。',
      '民主化改革：开始于三千年前。改革后，云城政府的人事任命权保留，市一级的总督为常务文官，没有党籍，不和政党共进退。政府并不由议会产生，但地方议会保有立法权、弹劾权、质询权，与政府、司法机关分权制衡。',
      '常务会议：云城制度形成与政党、中央对抗的常务文官离心力。每当政党选举时，各市总督召开会议，研判政党政治走向并商量对策。李津云是个特例，他并不太喜欢干预政党政治，但也会出席。',
      '地方市：云城分为九个地方市，领导人性别比为五个女总督与四个男总督。',
    ],
  },
  {
    id: 'economy',
    name: '经济',
    img: 'images/world-economy.jpg',
    brief: '流云渡在李津云领导修建青龙船闸后发展迅速，夜经济发达，旅游业繁荣。',
    full: [
      '云城在神州的综合实力长期处于中游。',
      '流云渡：在李津云领导修建青龙船闸后发展迅速，夜经济发达，旅游业繁荣，属于「霓虹不夜城」的类型。',
    ],
  },
  {
    id: 'tech',
    name: '科技',
    img: 'images/world-tech.jpg',
    brief: '云城科技发达，但并无「互联网」「手机」等产物；科技与法术并存，相辅相成。',
    full: [
      '云城科技发达，但并无「互联网」「手机」等产物。',
      '科技与法术：科技与法术并存，相辅相成，妖怪与人均可学习法术。妖怪以天赋与寿命促进法术的发展，人类侧重于发展科技与生产力，以文明迭代促进技术发展。',
    ],
  },
  {
    id: 'culture',
    name: '文化',
    img: 'images/world-culture.jpg',
    brief: '吴语轻快的方言、㵲夏节、霓虹不夜城夜经济，纹样意象承载身份与文明。',
    full: [
      '方言：云城地域文化属性强，不同地区发展出「方言」。流云渡的方言可参考吴语，说话节奏快，音调偏高，气质轻快伶俐。',
      '情感：提倡正视需求与欲望，主张合理享受愉悦，因而并无压抑与刻板印象存在。',
      '㵲夏节：云城的特色节日，定在每年七月十三日，节日当天起全省放假一周。节日期间，在规定街区内有游行、共舞、泼水活动，同时举办音乐节。在省会兴泽，镇衡会化出分身参加节日，泼到镇衡的分身者，会获得小额奖金与好运气。',
      '信仰：神州没有客观上存在的神明，但也产生了宗教信仰。',
      '纹样意象：广泛采用自然意象，例如鲤鱼、桃花，是对身份的象征，也是承载文明的意象，被用于各种服饰之上。',
    ],
  },
  {
    id: 'history',
    name: '历史',
    img: 'images/world-history.jpg',
    brief: '八千年前镇衡统一云城、流焱统一浮玉，两省并入神州，民主革命催生特殊体制。',
    full: [
      '八千年前，镇衡还在恩威并施统一云城时，流焱已经统一浮玉。',
      '镇衡统一云城最后一步是拿下和浮玉接壤的流云渡。兵临城下时，流云渡前政权的贵族集团出逃至浮玉，被流焱逮捕。',
      '浮玉对云城的政权更迭一直保持中立，但镇衡为了巩固权力，想将流云渡贵族带回并软禁。彼时，在北部和东部，神州联盟已经兼并三分之二的地区。镇衡和流焱都没有割据的野心，镇衡借着出逃贵族一事，与流焱在两省交界处的一处瀑布下会谈时局，彼此确认并入神州的想法。',
      '而后，老龙王镇衡统一云城，带领云城并入神州，浮玉亦是。',
      '之后神州京城爆发民主革命，民主力量掌控了神州政权，要求各个省完成民主化改革，否则武力革命。同时云城和浮玉民主力量也在崛起，许多人加入了全国性政党。与此同时，云城顺势创建特殊的政治体制。',
    ],
  },
]

// 人物志（图片 → 人物映射）
const CAST = [
  {
    id: 'lijinyun',
    name: '李津云',
    race: '鲤鱼精 · 总督',
    img: 'images/cast-lijinyun.jpg',
    brief: '流云江里的一介游鲤，因洪水提前两百年化形。精明圆滑又实干主义，一心修船闸，被镇衡擢升为流云渡总督。',
    full: [
      '姓名：李津云　身高：182cm　年龄：约 34 岁（人类年纪）',
      '种族：鲤鱼精　MBTI：ISFP　喜好：游泳、薄荷白酒',
      '外貌锚点：鲤鱼耳坠、喜欢戴墨镜　狗塑：边牧',
      '名字由来：本是流云江里的一介游鲤。年少时流云江连年洪水，让他提前两百年修炼成了人形。上学后，学堂伙伴给他起了诨名「李津」（鲤精），他又取流云江里的「云」字，自谓「李津云」。',
      '工作性格：精明圆滑——面对官员协商、演讲应酬游刃有余；实干主义——从小有修船闸的梦想，上任后一心发展水利工程，常与百姓交流；效率＞完美——被镇衡空降擢升，肃清吏治雷厉风行；厌倦官场尔虞我诈——对权力无欲，只想「赶紧干完活」。',
      '生活性格：自信从容，擅长释放魅力；坦率可爱，恋爱里直率表达爱意、常常撒娇；容易冷脸却又容易低头；随性散漫，喜欢悠闲自由的生活。',
    ],
  },
  {
    id: 'feiyun',
    name: '绯云',
    race: '桃花妖 · 研究所所长',
    img: 'images/cast-feiyun.jpg',
    brief: '千岁桃花妖，灼华桃园庄主转型农林科技研究所所长。论迹不论心的精明，高智商高行动力，ENTJ。',
    full: [
      '姓名：绯云　身高：170cm　年龄：一千余岁',
      '种族：桃花妖　MBTI：ENTJ　喜好：酒、Hyperpop、跳舞',
      '外貌锚点：桃色瞳　动物塑：狐狸',
      '工作性格：论迹不论心的精明——桃园转型既为李津云，也为躺着赚钱；高智商、专注投入——所长身兼生物前沿研究，以科研对抗生命空虚；高行动力、目的导向——在条文律例里寻找最优解。',
      '生活性格：叛逆和锋芒——对春阳「你又不是我妈」；沉稳霸道、游刃有余；放任欲望、潇洒——爱喝酒熬夜、听 Hyperpop 欢舞，宿醉后却一阵空虚；辩证看待「定义」——一度拒绝定义爱，却赋予晴晴称呼她「妈妈」的权利。',
    ],
  },
  {
    id: 'qingqing',
    name: '晴晴',
    race: '桃花妖 · 带鲤鱼特征',
    img: 'images/cast-qingqing.jpg',
    brief: '李津云与绯云之女。承载两人爱意而化形的桃妖，头有桃花犄角，最终成为国际邮轮船长。',
    full: [
      '姓名：晴晴　种族：拥有部分鲤鱼特征的桃花妖',
      '外貌锚点：化成人形时头上有两个桃花犄角，手掌上有鱼鳞，不过化人形不稳定。',
      '生活性格：胆子大、爱自由——喜欢过山车等刺激项目，热爱自由和冒险；吐槽役——在轻松温馨的家庭里长大，常常吐槽李津云，与长辈关系亲近活泼。',
      '主线：绯云和李津云处了三十几年后，桃园里有个桃子长了鱼鳍、有成妖化形的征兆。经韶情鉴定，是两人的爱影响了这枚本就要化妖的桃子。两人由此确认「亲子」「师徒」只是称呼，付出真心的爱就好。晴晴在去形式化的、更注重实质的爱中成长。',
      '晴晴人类年纪十五时想去看海，李津云叫来蛟风带她航海。五个月的航程种下了航海梦，她后来当上国际邮轮的船长环游世界。',
    ],
  },
  {
    id: 'shaoqing',
    name: '韶情',
    race: '杏花妖 · 设计师',
    img: 'images/cast-shaoqing.jpg',
    brief: '绯云的知心闺蜜，八百年的杏花妖。开朗前卫，追求时尚，常与蛟风一起逛街挑衣服。',
    full: [
      '姓名：韶情　种族：杏花妖　外貌锚点：杂志风穿搭',
      '毕业学校：京城大学　专业：历史学（文化遗产）、设计学（服装与服饰设计）',
      '工作性格：开朗前卫，专业能力强——在专业领域从容表达自我，以前卫潮流的审美传达价值观。',
      '生活性格：开朗活泼——和绯云高中相识，成为知心朋友，互怼、分享八卦，说话风趣犀利直率。追求时尚——喜欢逛街，也会和蛟风互相挑衣服、聊时尚。',
    ],
  },
  {
    id: 'chunyang',
    name: '春阳',
    race: '桃花妖 · 医生',
    img: 'images/cast-chunyang.jpg',
    brief: '绯云的师父（也是她渴望的母亲）。主业医生、副业庄主，嘴毒心软，最终去往罗马闯荡，将桃园传给绯云。',
    full: [
      '姓名：春阳　种族：桃花妖　现居地：罗马',
      '生活性格：嘴毒，但是也会心软——嘴上疏离，绯云遇难时却立马赶去帮忙；人格独立、追求自由——坚持不让绯云称呼她为母亲，渴望彼此保持独立身份与自由。',
      '主线：很长一段时间里，春阳都在「定义」中挣扎。她坚持「师徒」而非「母女」，想建立有界限的关系模式，却忍不住给予绯云超过师徒的爱与管束，自己也囿于「名实混淆」困惑不已。',
      '春阳主业是医生、副业才是庄主，所以很忙，也不希望绯云学医学生物。她想去闯荡西洋，写信让绯云回来，把灼华桃园交给她。两人才以此为契机释怀、和解、道别。',
    ],
  },
  {
    id: 'jiaofeng',
    name: '蛟风',
    race: '鲨鱼精 · 船长',
    img: 'images/cast-jiaofeng.jpg',
    brief: '李津云的表弟，海军上校退役。黑色长发、虎牙尖牙、朋克穿搭，驾驶游艇浪迹天涯。',
    full: [
      '姓名：蛟风　种族：鲨鱼精　亲属关系：李津云的表弟',
      '外貌特征：黑色长发（及肩），虎牙保留了鲨鱼的尖牙；体型高大，比李津云还要高半个头。朋克穿搭，喜欢穿皮夹克、铆钉、链衣。',
      '毕业学校：海军上校；海事大学　专业：交通运输、航海技术',
      '武器：手枪、大刀　狗塑：对别人是藏獒，对喜欢的人是金毛',
      '游艇：可参考蓝水巡航双体帆船，两台柴油发动机、一台发电机。上层飞桥配太阳能板，主甲板有客厅厨房，底层有主卧客卧与书房。',
      '生活性格：热爱自由——在全世界航海旅行的船长；大大咧咧、平易近人，心有猛虎细嗅蔷薇——晴晴做手帐让他佩服，他也学起做手帐，还帮韶情全世界海淘布料。',
    ],
  },
  {
    id: 'liechuan',
    name: '猎川',
    race: '海豚精',
    img: 'images/cast-liechuan.jpg',
    brief: '蛟风的同行者。冷脸萌的海豚精，情绪波动不大，却心思细腻，能听出蛟风语调间的细微变化。',
    full: [
      '姓名：猎川　种族：海豚精',
      '生活性格：冷脸萌——总体来说是个淡人，情绪波动不大，经常面无表情，但平静中也会有波澜。',
      '心思细腻：可以听到蛟风语调之间细微的变化，内心戏很多。平日里需要戴特制耳塞过滤不必要的声音，但和蛟风讲话时就会脱掉。',
    ],
  },
  {
    id: 'zhenheng',
    name: '镇衡',
    race: '龙 · 云城当权者',
    img: 'images/cast-zhenheng.jpg',
    brief: '八千多岁的龙王，统一云城并入神州。渴望稳定又野心勃勃，像一棵让人依靠也嫌挡光的大树。',
    full: [
      '姓名：镇衡　种族：龙　年龄：八千多岁　取向：无浪漫倾向',
      '工作性格：渴望稳定、创造欲强——像在玩模拟经营游戏，满足建设创造欲；野心勃勃、渴望权力——视野开阔、思虑周全，推动云城改革与发展，老谋深算。',
      '生活性格：有自己的坚守，但也尊重他人——与流焱和而不同，与李津云关系融洽；自知某些方面笨拙，也懂退让——遇到不擅长之事会流露笨拙的反差萌。',
      '主线：少年时从北海溯江而上来到云城，爱上冰川草甸与深潭大江。在兴泽当谋士，依靠法力布阵征伐、假装卜卦。笼络人心后「黄袍加身」逼宫篡权，开启统一大业。统一云城并入神州后，布局流云渡船闸，为云城多争得 12 个议席。',
    ],
  },
  {
    id: 'liuyan',
    name: '流焱',
    race: '人类 · 浮玉当权者',
    img: 'images/cast-liuyan.jpg',
    brief: '白色短发的人类，擅长青焰、可瞬移。领兵统一浮玉，洒脱豪迈，卸甲后云游四海。',
    full: [
      '姓名：流焱　种族：人类　外貌锚点：白色短发',
      '法力：擅长使用青焰，可以利用火焰瞬移　取向：无浪漫倾向',
      '工作性格：英姿飒爽，性格洒脱豪迈，智勇双全。领兵统一浮玉，是浮玉的最高领导人，面对军事冷静智慧，战时武力高强，精通谈判。',
      '生活性格：不喜政治，潇洒自由——简政放权给下属，卸甲云游四海。时常回到兴泽与镇衡相见，也会调侃他。雷点：吃醋梗、任何一方过于讨好。',
    ],
  },
]

// 时间线
const TIMELINE = [
  { title: '镇衡统一', text: '镇衡恩威并施统一云城，流焱已统一浮玉，两省并入神州' },
  { title: '民主化改革', text: '神州京城爆发民主革命，云城顺势创建特殊政治体制' },
  { title: '绯云化形', text: '与春阳成为师徒，旁人皆道她们长得像，二人亦分不清师徒或母女' },
  { title: '绯云求学', text: '远赴京城大学，硬学三个专业，与韶情相识相知' },
  { title: '春阳远行', text: '春阳去往罗马，将灼华桃园传给绯云，绯云回流云渡' },
  { title: '李津云化形', text: '求学并初步构思船闸，硕士进修水利工程' },
  { title: '船闸擢升', text: '设计被镇衡发现，被「要挟」上任流云渡总督' },
  { title: '相遇恋爱', text: '征地途中与绯云相遇，坠入爱河' },
  { title: '船闸竣工', text: '青龙船闸落成，霓虹不夜城就此点亮，李津云升任总督' },
  { title: '桃园转型', text: '绯云将灼华桃园转型为农林科技研究所' },
  { title: '晴晴诞生', text: '阴差阳错间，承载两人爱意的晴晴化形降生' },
  { title: '蛟风航海', text: '蛟风退伍返回流云渡，成为船长，与猎川同行旅行' },
]

// 秘闻十五篇小说（顺序与标题）
const NOVELS = [
  { key: '江水与鲤鱼', title: '江水与鲤鱼', author: '流云渡（一）' },
  { key: '过山车', title: '过山车', author: '文 / 雪山与百合花' },
  { key: '朝朝', title: '朝朝', author: '' },
  { key: '意气', title: '意气', author: '' },
  { key: '镇衡', title: '镇衡', author: '' },
  { key: '撸猫', title: '撸猫', author: '' },
  { key: 'Love language', title: 'Love language', author: '' },
  { key: 'Mago', title: 'Mago', author: '' },
  { key: 'Sticky', title: 'Sticky', author: '' },
  { key: '老婆', title: '老婆', author: '' },
  { key: '纯妹妹(1)', title: '纯妹妹', author: '' },
  { key: '爱你', title: '爱你', author: '' },
  { key: '皑雪', title: '皑雪', author: '' },
  { key: '明天见', title: '明天见', author: '' },
  { key: 'Girl,so confusing', title: 'Girl, so confusing', author: '' },
]

/* ============================================================
 * 渲染层
 * ============================================================ */

// 世界观板块渲染（博物馆列表式）
function renderWorld() {
  const grid = document.getElementById('worldGrid')
  grid.innerHTML = WORLD_SECTIONS.map((s, i) => `
    <article class="entry" data-world="${s.id}">
      <div class="entry-thumb"><img src="${s.img}" alt="${s.name}" loading="lazy" /></div>
      <div class="entry-main">
        <div class="entry-top">
          <span class="entry-idx">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="entry-name">${s.name}</h3>
        </div>
        <p class="entry-brief">${s.brief}</p>
      </div>
    </article>
  `).join('')
}

// 人物卡渲染（博物馆列表式）
function renderCast() {
  const grid = document.getElementById('castGrid')
  grid.innerHTML = CAST.map((c, i) => `
    <article class="entry" data-cast="${c.id}">
      <div class="entry-thumb"><img src="${c.img}" alt="${c.name} · ${c.race}" loading="lazy" /></div>
      <div class="entry-main">
        <div class="entry-top">
          <span class="entry-idx">${String(i + 1).padStart(2, '0')}</span>
          <h3 class="entry-name">${c.name}</h3>
          <span class="entry-meta">${c.race}</span>
        </div>
        <p class="entry-brief">${c.brief}</p>
      </div>
    </article>
  `).join('')
}

// 时间线渲染（横向卡片）
function renderTimeline() {
  const list = document.getElementById('timelineList')
  list.innerHTML = TIMELINE.map((t, i) => `
    <div class="tl-item">
      <span class="tl-dot"></span>
      <span class="tl-idx">${String(i + 1).padStart(2, '0')}</span>
      <div class="tl-body">
        <h4>${t.title}</h4>
        <p>${t.text}</p>
      </div>
    </div>
  `).join('')
}

// 时间线滚轴：滑块与横向滚动双向同步 + 拖动（rAF 节流，避免卡顿）
function initTimelineScrollbar() {
  const list = document.getElementById('timelineList')
  const thumb = document.getElementById('tlThumb')
  const track = thumb && thumb.parentElement
  if (!list || !thumb || !track) return

  let trackW = 0
  let thumbW = 0
  let maxScroll = 0
  let raf = null

  // 缓存布局尺寸，避免每帧重排
  const measure = () => {
    trackW = track.clientWidth
    maxScroll = list.scrollWidth - list.clientWidth
    if (maxScroll <= 0) {
      thumb.style.width = '100%'
      thumb.style.left = '0'
      return
    }
    const ratio = list.clientWidth / list.scrollWidth
    // 滑块宽度减半（视觉上更短，可拖空间更大）
    thumbW = Math.max((ratio * trackW) / 2, 64)
    thumb.style.width = thumbW + 'px'
  }

  const updateThumb = () => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = null
      if (maxScroll <= 0) return
      const thumbMax = trackW - thumbW
      const left = (list.scrollLeft / maxScroll) * thumbMax
      thumb.style.transform = `translateX(${left}px)`
    })
  }

  // 时间线滚动 → 更新滑块（拖动时跳过，避免闭环抖动）
  list.addEventListener('scroll', () => {
    if (dragging) return
    updateThumb()
  }, { passive: true })

  // 拖动滑块 → 更新时间线
  let dragging = false
  const onDown = (e) => {
    dragging = true
    measure()
    list.style.scrollBehavior = 'auto'
    list.style.scrollSnapType = 'none'
    thumb.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }
  const onMove = (e) => {
    if (!dragging || raf) return
    raf = requestAnimationFrame(() => {
      raf = null
      const rect = track.getBoundingClientRect()
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
      const thumbMax = trackW - thumbW
      const ratio = Math.min(Math.max(x / thumbMax, 0), 1)
      list.scrollLeft = ratio * maxScroll
      // 直接同步滑块位置，不等 scroll 事件
      thumb.style.transform = `translateX(${ratio * thumbMax}px)`
    })
  }
  const onUp = () => {
    dragging = false
    thumb.style.cursor = 'grab'
    document.body.style.userSelect = ''
    list.style.scrollBehavior = ''
    list.style.scrollSnapType = ''
  }
  thumb.addEventListener('mousedown', onDown)
  thumb.addEventListener('touchstart', onDown, { passive: false })
  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('touchmove', onMove, { passive: true })
  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchend', onUp)

  // 点击轨道跳转（平滑滚动）
  track.addEventListener('click', (e) => {
    if (e.target === thumb) return
    measure()
    const rect = track.getBoundingClientRect()
    const x = e.clientX - rect.left
    const thumbMax = trackW - thumbW
    const ratio = Math.min(Math.max(x / thumbMax, 0), 1)
    list.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' })
  })

  // 初始化 + resize 重算
  measure()
  updateThumb()
  window.addEventListener('resize', () => { measure(); updateThumb() })
}

/* ============================================================
 * Hero 逐字母拆分（GSAP 驱动）
 * ============================================================ */
function initHero() {
  const gsap = getGSAP()
  const title = document.querySelector('.hero-title')
  const sub = document.querySelector('.hero-sub')
  if (!gsap || !title) return

  // 逐字母拆分标题（仅英文字母/数字拆分，中文整字保留，避免字体问题）
  const text = title.textContent.trim()
  // 只处理包含拉丁字符的标题才拆分，中文标题保持整段静态（字体兼容性优先）
  const hasLatin = /[A-Za-z0-9]/.test(text)
  if (!hasLatin) return

  const chars = text.split('')
  title.innerHTML = chars
    .map((c) => (c === ' ' ? ' ' : `<span class="ch">${c}</span>`))
    .join('')

  // 逐字 stagger 入场（失败不影响显示：初始 opacity 已由 CSS 设为 1）
  gsap.fromTo(
    title.querySelectorAll('.ch'),
    { y: '0.6em', opacity: 0, rotateX: 45 },
    {
      y: 0,
      opacity: 1,
      rotateX: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.045,
      delay: 0.15,
      onComplete: () => {
        // 动画结束后强制清理，确保任何情况下文字可见
        gsap.set(title.querySelectorAll('.ch'), { clearProps: 'all' })
      },
    }
  )

  // 副标题淡入
  if (sub) {
    gsap.fromTo(
      sub,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.5 }
    )
  }
}

/* ============================================================
 * 弹窗层（板块 / 人物详情）
 * ============================================================ */
const modal = document.getElementById('modal')
const modalImg = document.getElementById('modalImg')
const modalTag = document.getElementById('modalTag')
const modalTitle = document.getElementById('modalTitle')
const modalBody = document.getElementById('modalBody')

let currentTarget = null

function openModal(target, tagText) {
  currentTarget = target
  modalImg.src = target.img
  modalImg.alt = target.name
  modalTag.textContent = tagText
  modalTitle.textContent = target.name
  modalBody.innerHTML = target.full.map((p) => `<p>${p}</p>`).join('')
  modal.setAttribute('aria-hidden', 'false')
  modal.classList.add('is-open')
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  modal.classList.remove('is-open')
  modal.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
  currentTarget = null
}

document.addEventListener('click', (e) => {
  const worldCard = e.target.closest('[data-world]')
  if (worldCard) {
    const s = WORLD_SECTIONS.find((x) => x.id === worldCard.dataset.world)
    if (s) openModal(s, '世界观 · 板块')
    return
  }
  const castCard = e.target.closest('[data-cast]')
  if (castCard) {
    const c = CAST.find((x) => x.id === castCard.dataset.cast)
    if (c) openModal(c, '人物志 · 档案')
  }
})

document.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', closeModal)
})

/* ============================================================
 * 秘闻小说阅读器
 * ============================================================ */
const reader = document.getElementById('reader')
const readerTitle = document.getElementById('readerTitle')
const readerBody = document.getElementById('readerBody')
const secretBtn = document.getElementById('secretBtn')
const readerNav = document.createElement('div')
readerNav.className = 'reader-nav'
reader.querySelector('.reader-head').insertAdjacentElement('afterend', readerNav)

let currentNovel = '江水与鲤鱼'

function buildNav() {
  readerNav.innerHTML = NOVELS.map((n) =>
    `<button type="button" data-novel="${n.key}" class="${n.key === currentNovel ? 'is-active' : ''}">${n.title}</button>`
  ).join('')
}

function renderNovel(key) {
  currentNovel = key
  const paras = novels[key] || []
  const title = NOVELS.find((n) => n.key === key)?.title || key
  readerTitle.textContent = title
  // 过滤空段落，标题行特殊处理
  const clean = paras.map((p) => p.trim()).filter(Boolean)
  readerBody.innerHTML = clean.map((p, i) => {
    // 判断是否为标题行（第一段或包含书名号的短行）
    const isHeading = i === 0 || /^《.+》$/.test(p) || p === title
    return `<p class="${isHeading ? 'reader-heading' : ''}">${p}</p>`
  }).join('')
  buildNav()
}

readerNav.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-novel]')
  if (btn) renderNovel(btn.dataset.novel)
})

secretBtn.addEventListener('click', () => {
  renderNovel('江水与鲤鱼')
  reader.setAttribute('aria-hidden', 'false')
  reader.classList.add('is-open')
  document.body.style.overflow = 'hidden'
})

function closeReader() {
  reader.classList.remove('is-open')
  reader.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
}

document.querySelectorAll('[data-reader-close]').forEach((el) => {
  el.addEventListener('click', closeReader)
})

/* ============================================================
 * 文字编辑器（contenteditable 所见即所得）
 * ============================================================ */
const editor = document.getElementById('editor')
const editorTitle = document.getElementById('editorTitle')
const editorBody = document.getElementById('editorBody')
const editBtn = document.getElementById('editBtn')

function openEditor() {
  if (!currentTarget) return
  editorTitle.value = currentTarget.name
  // 用 <p> 包裹每段，实现所见即所得编辑
  editorBody.innerHTML = currentTarget.full.map((p) => `<p>${p}</p>`).join('')
  editor.setAttribute('aria-hidden', 'false')
  editor.classList.add('is-open')
}

function closeEditor() {
  editor.classList.remove('is-open')
  editor.setAttribute('aria-hidden', 'true')
}

editBtn.addEventListener('click', openEditor)
document.querySelectorAll('[data-editor-close]').forEach((el) => {
  el.addEventListener('click', closeEditor)
})
document.getElementById('editorSave').addEventListener('click', () => {
  if (!currentTarget) return
  currentTarget.name = editorTitle.value.trim() || currentTarget.name
  // 从 contenteditable 提取段落文本
  const paras = []
  editorBody.querySelectorAll('p').forEach((p) => {
    const t = p.innerText.trim()
    if (t) paras.push(t)
  })
  // 如果没有任何 <p>，兜底用纯文本
  if (paras.length === 0) {
    const raw = editorBody.innerText.trim()
    if (raw) paras.push(raw)
  }
  currentTarget.full = paras
  renderWorld()
  renderCast()
  modalTitle.textContent = currentTarget.name
  modalBody.innerHTML = currentTarget.full.map((p) => `<p>${p}</p>`).join('')
  closeEditor()
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (editor.classList.contains('is-open')) closeEditor()
    else if (reader.classList.contains('is-open')) closeReader()
    else if (modal.classList.contains('is-open')) closeModal()
  }
})

/* ============================================================
 * GSAP ScrollTrigger 整站动效
 * 统一运动语言：由下而上 + power3/4 缓出，对应「溯江而上」意象
 * ============================================================ */
function initScrollAnimations() {
  const gsap = getGSAP()
  const ScrollTrigger = getScrollTrigger()
  if (!gsap || !ScrollTrigger) return
  gsap.registerPlugin(ScrollTrigger)

  // 通用兜底：确保所有 ScrollTrigger 元素默认可见，动效失败也不影响显示
  const safeTrigger = (cfg) => ({ ...cfg, immediateRender: false })

  // 1) 各板块标题区（coll-label / coll-sub）：下屏标题接力浮入
  gsap.utils.toArray('.coll-head').forEach((head) => {
    const label = head.querySelector('.coll-label')
    const sub = head.querySelector('.coll-sub')
    const items = [label, sub].filter(Boolean)
    if (!items.length) return
    gsap.fromTo(
      items,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: safeTrigger({
          trigger: head,
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        }),
      }
    )
  })

  // 2) 世界观 / 人物志 卡片：逐张 stagger 上浮（一浪接一浪）
  gsap.utils.toArray('.coll-grid .entry').forEach((entry, i) => {
    gsap.fromTo(
      entry,
      { y: 70, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        delay: (i % 3) * 0.08,
        scrollTrigger: safeTrigger({
          trigger: entry,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        }),
      }
    )
  })

  // 3) 时间线：横向渐出渐隐（纯 opacity 过渡，避免 transform 与滚动冲突）
  gsap.utils.toArray('.tl-item').forEach((item, i) => {
    gsap.fromTo(
      item,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.7,
        ease: 'power1.out',
        delay: i * 0.05,
        overwrite: 'auto',
        clearProps: 'opacity',
        scrollTrigger: safeTrigger({
          trigger: '.timeline',
          start: 'top 80%',
          once: true,
        }),
      }
    )
  })

  // 4) 秘闻入口按钮：放大淡入
  gsap.fromTo(
    '.secret-entry',
    { scale: 0.94, y: 60, opacity: 0 },
    {
      scale: 1,
      y: 0,
      opacity: 1,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: safeTrigger({
        trigger: '.secret-entry',
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      }),
    }
  )

  // 5) 关于页诗句：逐行浮现（与 hero 首尾呼应）
  gsap.fromTo(
    '.about-label, .about-title',
    { y: 60, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.15,
      scrollTrigger: safeTrigger({
        trigger: '.about',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      }),
    }
  )
  gsap.fromTo(
    '.about-text',
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: 'power3.out',
      delay: 0.2,
      scrollTrigger: safeTrigger({
        trigger: '.about-text',
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      }),
    }
  )

  // 6) Hero 主体向「世界观」自然过渡：hero 上移淡出，世界观接住
  gsap.to('.hero-title', {
    yPercent: -18,
    opacity: 0.15,
    ease: 'none',
    scrollTrigger: safeTrigger({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }),
  })

  // 7) 各 section 之间的「颜色接力」：滚入下一屏时弱化上一屏
  // （深黑区域保持不变，只在绿色块之间做呼应，故此处以标题过渡为主）
}

// 减少动态偏好时停用
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ============================================================
 * 移动端汉堡菜单
 * ============================================================ */
const burger = document.querySelector('.burger')
const nav = document.querySelector('.nav')
if (burger && nav) {
  burger.addEventListener('click', () => {
    const open = nav.style.display === 'flex'
    nav.style.display = open ? 'none' : 'flex'
    nav.style.flexDirection = 'column'
    nav.style.position = 'absolute'
    nav.style.top = '100%'
    nav.style.left = '0'
    nav.style.right = '0'
    nav.style.background = '#0b0b0b'
    nav.style.padding = '20px 24px'
    nav.style.gap = '18px'
  })
}

// 初始化：先渲染静态内容（不依赖 GSAP，保证不白屏），再启动动效
renderWorld()
renderCast()
renderTimeline()
initTimelineScrollbar()

// 帷幕入场遮罩兜底：无论 CSS 动画是否播放，1.2 秒后强制隐藏幕布，避免白屏
const curtainIn = document.querySelector('.curtain-in')
if (curtainIn) {
  setTimeout(() => {
    curtainIn.style.display = 'none'
  }, 1200)
}

// GSAP 动效：恢复标题逐字拆分 + 滚动入场动效
// 保护机制：所有元素初始 opacity 已在 CSS 中设为可见（非 0），
// 动效只是从可见状态做过渡增强，即使 GSAP 失败也绝不会白屏
function bootAnimations() {
  try {
    initHero()
    initScrollAnimations()
  } catch (e) {
    // 动效异常时静默降级为静态显示，绝不影响内容可见性
    console.warn('[流云渡] 动效初始化失败，已降级为静态显示：', e)
  }
}
if (getGSAP()) {
  bootAnimations()
} else {
  let waited = 0
  const timer = setInterval(() => {
    waited += 100
    if (getGSAP()) {
      clearInterval(timer)
      bootAnimations()
    } else if (waited >= 3000) {
      clearInterval(timer)
    }
  }, 100)
}
