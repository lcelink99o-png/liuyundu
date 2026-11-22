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
    brief: '流云渡坐落在云城最东边，流云江水于此突坠。',
    full: [
      '云城西北和西南都是高山，玉石岭余脉向东延伸，省会兴泽在中部，流云渡在云城的最东边。',
      '流云江：发源自云城山峦层叠的玉石岭，支流千万，共同造就了流云渡这一方天地。出流云渡后，到地势平坦的浮玉省，便可以正常通航。此外，流云江上还伫立着一座巨型镇衡雕像。',
    ],
  },
  {
    id: 'politics',
    name: '政治体制',
    img: 'images/world-politics.jpg',
    brief: '总督制与常务会议并行，民主化进程渐进推进，九地方市各安其位。',
    full: [
      '神州各省内部的政治体制差异明显，尤其是云城。',
      '常规制度：除云城外，地方议会的多数党领袖担当省（市）最高领导人，领导人拥有党籍，与政党共进退。',
      '民主化改革：开始于三千年前，改革后，云城政府的人事任命权保留，市一级的总督为常务文官，没有党籍，不和政党共进退。政府并不由议会产生，但地方议会保有立法权，弹劾权，质询权和政府，司法机关分权制衡。',
      '常务会议：云城制度形成与政党、中央对抗的常务文官离心力，每当政党选举时，各市总督召开会议，研判政党政治走向并商量对策。李津云是个特例，他并不太喜欢干预政党政治，但也会出席。',
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
      '流云渡：在李津云领导修建青龙船闸后发展迅速，夜经济发达，旅游业繁荣，属于“霓虹不夜城”的类型。',
    ],
  },
  {
    id: 'tech',
    name: '科技',
    img: 'images/world-tech.jpg',
    brief: '云城科技发达，但并无「互联网」「手机」等产物；科技与法术并存，相辅相成。',
    full: [
      '云城科技发达，但并无“互联网”“手机”等产物。',
      '科技与法术：科技与法术并存，相辅相成，同时妖怪与人均可学习法术。妖怪以天赋与寿命促进法术的发展，人类侧重于发展科技与生产力，以文明迭代促进技术发展。',
    ],
  },
  {
    id: 'culture',
    name: '文化',
    img: 'images/world-culture.jpg',
    brief: '吴语轻快的方言、㵲夏节、霓虹不夜城夜经济，纹样意象承载身份与文明。',
    full: [
      '方言：云城地域文化属性强，不同地区发展出“方言”。流云渡的方言可参考吴语，说话节奏快，音调偏高，气质轻快伶俐。',
      '情感：提倡正视需求与欲望，主张合理享受愉悦，因而并无压抑与刻板印象存在。',
      '㵲夏节：云城的特色节日。定在每年七月十三日，节日当天起全省放假一周。节日期间，在规定街区内有游行、共舞、泼水活动，同时举办音乐节。在省会兴泽，镇衡会化出分身参加节日，泼到镇衡的分身者，会获得小额奖金与好运气。',
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
      '镇衡统一云城最后一步是拿下和浮玉接壤的流云渡，兵临城下时，流云渡前政权的贵族集团出逃至浮玉，被流焱逮捕。',
      '浮玉对云城的政权更迭一直保持中立，但镇衡为了巩固权力，想将流云渡贵族带回并软禁。彼时，在北部和东部，神州联盟已经兼并三分之二的地区，镇衡和流焱都没有割据的野心，镇衡借着出逃贵族一事，与流焱在两省交界处的一处瀑布下会谈时局，彼此确认并入神州的想法。',
      '而后，老龙王镇衡统一云城，带领云城并入神州，浮玉亦是。',
      '之后神州京城爆发民主革命，民主力量掌控了神州政权，要求各个省完成民主化改革，否则武力革命，同时云城和浮玉民主力量也在崛起，许多人加入了全国性政党。与此同时，云城顺势创建特殊的政治体制。',
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
      '姓名：李津云　身高：182cm　年龄：换算成人类年纪大约34岁',
      '种族：鲤鱼精　MBTI：ISFP　喜好：游泳、薄荷白酒',
      '外貌锚点：鲤鱼耳坠、喜欢戴墨镜　狗塑：边牧',
      '##名字由来',
      '李津云本是流云江里的一介游鲤。年少时流云江连年洪水，让他提前两百年修炼成了人形。上学后，学堂的伙伴便给他起了个诨名“李津”（鲤精），他又取流云江里的“云”字，自谓“李津云”。',
      '##工作性格',
      '精明圆滑。身为总督，常需要与各类官员沟通协商，这时他便会展露出圆滑的一面，甚至也有撒娇求情的时刻。同时也需要出席各类演讲，诸如就任时、青龙船闸动工与竣工时，圆滑之性格便得了优势。而在面对需要推进的项目，他也常能另辟蹊径，以最高效率达成目标，谓之精明。',
      '实干主义。从小有修船闸的梦想，上任后一心干实事，发展流云渡水利工程。同时也常和百姓交流，为民请命，与百姓关系和谐轻松。',
      '效率＞完美。李津云算是被镇衡空降擢升到总督位置，肃清流云渡吏治树立威信是必然的。在一次修工程之类的事动了流云渡前高官的风水宝地，前高官想通过势力残余给李津云施压。李津云背靠镇衡也不怕这类“元老”，直接调动资源挖“元老”贪污之事，接监察的手把他送入监狱。有人劝他这样做太狠，李津云却不以为意。',
      '厌倦官场尔虞我诈。因为对权力本身没有欲望，只有“赶紧干完活”的念头，所以整治起官场弊病来毫无心理负担，手段很直接追求效率。在政治会议上偶尔偷懒神游，对干预政党政治并不甚关心，但因镇衡的提拔，也只能照做地麻利地收拾各种摊子，背地里会和绯云“抱怨”镇衡。',
      '##生活性格',
      '自信从容。擅长释放魅力，恋爱初期有各种“小心思”，故意展露自己的优势，比如故意解扣子，把墨镜挂在领口让墨镜重力再往下扯领口露出一点胸肌中线。',
      '坦率可爱。在和绯云的恋爱里会直率地表达爱意，生活有沉稳的一面，但也会展露出可爱的一面，常常撒娇，各方面都十分需要对方。尤其是酒后容易吐露真心，会有原形毕露的反差萌。',
      '容易冷脸却又容易低头。绯云实事求是批评他，李津云会冷脸不屑地和她吵，但是绯云完全不理李津云的“冷暴力”甩头就走，反而是李津云冷静之后先低头道歉。',
      '随性散漫。喜欢悠闲的生活，无拘无束。对待生活里的很多事情，往往是“随便都可以”的态度，也因此和绯云吵架。学生时代因为懒散的性格经常上课睡觉，也是不遵守规矩的类型。',
      '没有对前任付出过太多真心，后面因情感的淡漠分手。',
      '##主线大事件',
      '家庭美满，并不会干涉他的生活。',
      '本是流云江中一条鲤鱼，化形后进入学校。由于长相帅气且可爱，很受欢迎，期间也与人交往，但都是散漫地没有付出真心。',
      '他从小就有修船闸的白日梦，但也很清楚光凭自己的能力只会有草图而难以付诸实践，因此进入大学后，选择地理科学专业（人文地理与城乡规划方向），硕士阶段又进修水利工程专业（水利水电工程方向）。',
      '研究生毕业后，考入流云渡水利局。双亲在这一时期搬去兴泽养老，与李津云分别。',
      '镇衡机缘巧合下看到李津云的船闸草图设计，颇为赏识，于是开启青龙船闸计划，并任命李津云指挥。',
      '与绯云相遇、相识，之后由于施水络图，每月两天有正当理由与绯云见面。最后与绯云相恋。',
      '船闸大功告成后，镇衡举荐李津云去中央工部任职。但因为李津云爱上绯云，也因为去中央工部任职会卷入更多权力斗争和工作，拒绝了提拔。',
      '##冷知识',
      '不仅会设计图纸，还会开挖掘机。',
      '绯云和李津云分享相册，翻到李津云高中运动会拿下男子自由泳第一名的照片。照片里是李津云比完赛刚缓过神意识到自己是冠军，后面欢呼喧哗声嘈杂，他望向记分屏眯着眼，半张嘴，三分“轻蔑”七分自信地笑。绯云很惊喜：“你还有这种表情啊。”',
      '李津云上任第一次参加全市听证会暨政府评议，要面对长枪短炮和各种问题，表现好坏直接影响民调。他非常紧张，前一晚还特地去找绯云求安慰。第二天李津云坐在公车上故作镇定，同事还指点他面对镜头的技巧，算是随性之人的自我突破了。',
    ],
  },
  {
    id: 'feiyun',
    name: '绯云',
    race: '桃花妖 · 研究所所长',
    img: 'images/cast-feiyun.jpg?v=1122',
    brief: '千岁桃花妖，灼华桃园庄主转型农林科技研究所所长。论迹不论心的精明，高智商高行动力，ENTJ。',
    full: [
      '姓名：绯云　身高：170cm　年龄：一千余岁',
      '种族：桃花妖　MBTI：ENTJ　喜好：酒、Hyperpop、跳舞',
      '外貌锚点：桃色瞳　动物塑：狐狸',
      '##工作性格',
      '论迹不论心的精明。绯云桃园转型的动机部分因为李津云，还有一部分是意识到借助总督和政府支持可以实现卖专利和商标躺着轻松赚钱，再也不用和进货商讨价还价了。至于对土地的大爱更多是锦上添花，扶助小农户也能在舆论上占据优势，本就不是一个很善良、社会责任感很重的人。',
      '高智商，专注投入。身为研究所所长，长期专著生物前沿研究，在智商与韧性上都是超凡的存在。长久的寿命消解了很多生命的意义，于是科研造福一方，也是对抗生命空虚的方式。',
      '高行动力，目的导向。她没太多“舍己为人”的想法，只是在条文律例里寻找最优解。在科研时需要抢高端设备，也会寻找李津云背书，以图更快更省事地达成目的。',
      '##生活性格',
      '叛逆和锋芒。她会因为春阳没有见证她小学校运会短跑拿第一名而记恨她，会因为高中填联系表在母亲一栏上必须填春阳的名字而烦恼，也会因为学业种种大吵小吵。在选择专业与工作时，也坚持自己的主见。',
      '沉稳霸道，游刃有余。成熟稳重，和李津云相识初期展露出自信的一面，令李津云佩服。在相爱后也在关系里十分自洽，游刃有余地表露欲望和爱意。',
      '放任欲望，潇洒。绯云在京城上班时对职位和加薪充满渴望，也会落入一些消费主义陷阱。爱喝酒、熬夜、和花妖姐妹听着Hyperpop欢舞，宿醉醒后却总是一阵空虚。并不克制性欲，对性的态度开放坦率。',
      '辩证地看待事物，承认接纳合理灵活的“定义”。由于原生家庭与春阳的关系，一度拒绝“定义”爱，但她也承认身份带来的积极意义，赋予晴晴定义权（让晴晴称呼她为“妈妈”），和李津云领证。',
      '##主线大事件',
      '和春阳成为师徒，旁人邻居都说绯云和春阳长得很像，但两人都知道她们有很大不同，两个人自己也从来搞不清楚她们是师徒还是母女。绯云争吵的理由总是那一句话“你又不是我妈！”但总希望春阳是她的妈妈，春阳也希望她是绯云的妈妈。',
      '绯云考入京城大学。她执着想学生物学，春阳不同意想让她学法律金融双学位，两人大吵一架后，绯云自己硬着头皮学三个专业（法学民商法学方向、金融学金融工程方向、生物科学生物化学与分子生物学方向），也包揽了三个学院的奖学金，也会找牛郎和剧本杀恋陪，每晚喝得烂醉，甚至喝进医院，叫春阳上京城交医药费。',
      '绯云大学毕业后当上生物科技公司高管，和春阳几乎断绝联系。',
      '由于三专业学位在生物科技公司身兼数职又搞技术又搞法务，虽然工资较高但是绯云还是认为可以更高。在一次知识产权官司中绯云的生物专业提供了关键证据，结果绯云调查发现配合她的律所的报酬比她的奖金多两倍。',
      '联合同事暗中收集公司违法加班和克扣绯云奖金的人事和财务总监职务侵占公司资金的证据。最后在得知可以接手灼华桃园后掏出证据让公司服软赔偿加班费，最后出尔反尔把职务犯罪证据交给一个曾经帮过她当时谋求升职的同事，成功把克扣她奖金的两个总监以职务侵占罪送进牢房。',
      '春阳决定去往西洋，写信将桃园传给绯云。绯云便回到了流云渡，两人谈心后释怀、道别。',
      '李津云前来征地，和她相识。对李津云“威逼利诱”，最终成功将桃园转型为农林科技研究所。在相处过程中也逐渐爱上李津云，最终确定关系。',
      '确认关系后，绯云依然会在夜晚熬夜喝酒，偶然被李津云撞见。没想到李津云很佩服她，还说下次带他一起。不过他精力没绯云那么强，每次绯云想带他去，他都会以自己太累推辞。',
      '晴晴诞生后，被晴晴称呼为“妈妈”。没有放弃自己熬夜喝酒的爱好，但也偶尔困扰于不愿让晴晴有这样的妈妈，但也因此对自己的“母女”关系有了更新的思考。',
      '##冷知识',
      '在和李津云确认关系之前，两个人策划一起去兴泽的镇衡雕像景点看烟火大会，但是肯定不能一起行动。于是李津云去兴泽出差给镇衡汇报完工作，傍晚出来在雕像面前和绯云“偶遇”。两人一起烟花，那年正好有鲤鱼烟花和桃花烟花，镇衡雕像很威严但烟花很美，两人还一起吐槽镇衡。两人去各种摊贩买小吃、饰品，还被商家误认成情侣。',
      '绯云小时候偷偷爬上桃树，很开心地在上面看花，然后被春阳发现。春阳也有担心，但更多也是喜悦，先给桃树上的绯云拍了张照。之后绯云爬得上去但发现很难下来，于是春阳用轻功把她抱下来。',
    ],
  },
  {
    id: 'qingqing',
    name: '晴晴',
    race: '桃花妖 · 兼具鲤鱼特征',
    img: 'images/cast-qingqing.jpg',
    brief: '李津云与绯云之女。承载两人爱意而化形的桃妖，头有桃花犄角，最终成为国际邮轮船长。',
    full: [
      '姓名：晴晴　种族：兼具鲤鱼特征的桃花妖',
      '外貌锚点：化成人形时头上有两个桃花犄角，手掌上有鱼鳞，不过化人形不稳定。',
      '##生活性格',
      '胆子大，爱自由。喜欢过山车等刺激的娱乐项目，也喜欢跟着蛟风四处游离，热爱自由和冒险，喜欢新事物。',
      '吐槽役。在轻松温馨的家庭里长大，往往是吐槽李津云的角色，和长辈的关系都很亲近，也没有畏惧年长者的心态，能够很活泼轻松地交流。',
      '##主线大事件',
      '绯云和李津云两人处了三十几年后，绯云发现桃园里有个桃子长了鱼鳍，并有成妖化形的征兆。她找来李津云和处了八百年的闺蜜杏花妖韶情来鉴定，断定可能是绯，李两人日久生情影响了这枚本就要化妖的桃子。两人都很震惊，他们之前一直以为有生殖隔离不会有事的，结果影响到了即将化形的小桃妖。',
      '她本就要降生，却意外地承载了李津云和绯云两人的爱。',
      '两人经过一番讨论，就互相确认了“亲子”“师徒”只是个称呼，付出真心的爱就好了，当作父母还是师徒由这个妖自己决定。在两人辛勤的浇水、施肥之下，晴晴化形了。',
      '她被绯云赋予自我定义关系的权利，在去形式化的、更注重实质内容的，充分充足的爱中成长。她的存在本身，就是“爱”先于并重于“名分定义”的证明。',
      '晴晴人类年纪十五时，一直想去看海。李津云索性叫来蛟风带她去航海。来接蛟风时李津云又乔装打扮带墨镜，但还是被蛟风一眼认出。第二天，晴晴就踏上了航海之旅。她跟蛟风学习航海技能和枪法。先去南太平洋看珊瑚礁，在海上看日出日落，又去地中海夏日度假，去罗马找春阳，听蛟风聊父母在巴黎度蜜月时的劲爆八卦。最后去北冰洋，和北极熊精成为朋友。期间两人完全以朋友身份相处，五个月的航程给她种下了航海梦，回到流云渡和蛟风道别。',
      '晴晴没有继承父母学业上的禀赋，但一家人都不在意，后来当上了国际邮轮的船长环游世界。',
    ],
  },
  {
    id: 'shaoqing',
    name: '韶情',
    race: '杏花妖 · 设计师',
    img: 'images/cast-shaoqing.jpg?v=1122',
    brief: '绯云的知心闺蜜，八百年的杏花妖。开朗前卫，追求时尚，常与蛟风一起逛街挑衣服。',
    full: [
      '姓名：韶情　种族：杏花妖　外貌锚点：杂志风穿搭',
      '毕业学校：京城大学',
      '专业：历史学（文化遗产）；设计学（服装与服饰设计）',
      '##工作性格',
      '开朗前卫，专业能力强。在专业领域从容表达自我，以过硬的专业水平传达自我价值观，也有前卫潮流的审美。',
      '##生活性格',
      '开朗活泼。和绯云高中时期相识，成为亲密的知心朋友，也会一起互怼、分享八卦。韶情说话常常是风趣、犀利的，比较直率，有什么说什么。',
      '追求时尚。对设计的喜好不仅影响了工作选择，也影响她的生活。在平时韶情也会和蛟风一起逛街，互相挑衣服，共同谈论时尚话题。',
    ],
  },
  {
    id: 'chunyang',
    name: '春阳',
    race: '桃花妖 · 医生',
    img: 'images/cast-chunyang.jpg?v=1122',
    brief: '绯云的师母（也是她渴望的母亲）。主业医生、副业庄主，嘴毒心软，最终去往罗马闯荡，将桃园传给绯云。',
    full: [
      '姓名：春阳　种族：桃花妖　现居地：罗马',
      '##生活性格',
      '嘴毒，但是也会心软。面对绯云，她常常是嘴上拒绝和疏离，但实际上在她遇到难处时，又会立马赶去帮忙。同时觉得绯云继承了她许多性格，而她也在身份里迷茫，给了她一部分的母爱。后来和解后绯云给春阳写信请她来参加婚礼，春阳在西洋忙产业不能参加，还在回信里吐槽“还真的有人敢和你结婚”。',
      '人格独立，追求自由。坚持不让绯云称呼她为母亲，渴望与绯云都保持独立的身份和自由。最终决定去西洋闯荡，告别了过往的人事，勇敢地建立起新的生活。',
      '##主线大事件',
      '很长一段时间里，春阳都在“定义”中挣扎。她坚持“师徒”而非“母女”，是想建立一个清晰的、有界限的关系模式，旨在给予双方自由。但她用称呼筑起高墙，却又忍不住在墙上开窗，给予了绯云超过“师徒”的爱和管束，自己也囿于“名实混淆”困惑不已。',
      '春阳的主业是医生，副业才是庄主。所以很忙照顾不过来绯云，也不希望绯云酗酒，也是因为是医生所以不想绯云学生物学。',
      '春阳想去闯荡西洋，写了封急信让绯云回来。绯云回来，得知春阳要把灼华桃园交给她，而且也许永远也不会回来。两人才以此为契机，将过往释怀，也最终和解，相互道别。',
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
      '外貌特征：黑色长发（及肩），虎牙保留了鲨鱼的尖牙；体型高大，比李津云还要高半个头，朋克穿搭，喜欢穿皮夹克、铆钉、链衣',
      '毕业学校：海军上校；海事大学　专业：交通运输；航海技术',
      '武器：手枪;大刀　狗塑：对别人是藏獒，对喜欢的人是金毛',
      '##游艇',
      '可以参考现实的蓝水巡航双体帆船，两台柴油发动机，一台发电机。',
      '游艇外表：上层架飞桥，配太阳能电池板，底下是户外主驾驶台。甲板，船头都可以平稳站人、活动。',
      '主甲板室内：一个客厅与厨房。空调冰箱洗衣机一应俱全，两个人开船开累了可以在里面腻歪。猎川还在客厅里改造了一个室内副驾驶室，加装雷达。',
      '底层甲板：一个主卧，双人床；一个客卧和猎川的书房；两个干湿分离淋浴间和厕所。',
      '##生活性格',
      '热爱自由。在全世界航海旅行的船长，小时候和李津云玩得很好，长大后就浪迹天涯了。',
      '大大咧咧，平易近人，心有猛虎细嗅蔷薇。晴晴在船上航海时每天都做手帐，让蛟风很佩服，于是蛟风也学起做手帐。晴晴告诉他是小杏姐姐教她做手帐的，蛟风则帮韶情全世界海淘布料，相互分享兴趣爱好。',
    ],
  },
  {
    id: 'liechuan',
    name: '猎川',
    race: '海豚精 · 二副',
    img: 'images/cast-liechuan.jpg',
    brief: '蛟风的同行者。冷脸萌的海豚精，情绪波动不大，却心思细腻，能听出蛟风语调间的细微变化。',
    full: [
      '姓名：猎川　种族：海豚精',
      '##生活性格',
      '冷脸萌。猎川总体来说是个淡人，情绪波动不会特别大，经常面无表情，但是平静中也会有波澜。',
      '心思细腻。猎川可以听到蛟风语调之间细微的变化，内心戏很多。平日里需要戴特制的耳塞过滤一些不必要声音，但和蛟风讲话时就会脱掉。',
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
      '##工作性格',
      '渴望稳定，创造欲强。喜欢定居感受的镇衡像在玩模拟经营游戏，大部分满足自己的建设创造欲，少部分满足自己对权势的渴望。绯云说他就像一棵大树，让人依靠也让人嫌挡光，想按自己的想法侍弄园子时，会觉得头顶枝叶太密，规矩太多，光照不足，憋屈。但遇上狂风暴雨，地动山摇的年景，有这么一棵大树顶着，云城的天不会塌下来。',
      '野心勃勃，渴望权力。身为云城当权者，对政事视野开阔，有长远规划，思虑周全。云城并入神州后依然不觉得应该退位，反而将权力继续握在手中，推动云城一系列改革和发展，有野心也有实力，老谋深算。',
      '##生活性格',
      '有自己的坚守，但也尊重他人。与流焱成为朋友，和而不同，尊重和理解她的理想与生活追求，同时也不会放弃自己的坚持。和李津云的关系融洽，能够看到他的优点，也尊重他的选择。',
      '自知某些方面笨拙，也懂退让。镇衡清楚自己不是十全十美的人，也有自己并不擅长的事情，因此懂得进退有度，也会坦率地承认自己的不足。在遇到不擅长之事时，会流露出笨拙的一面，反差萌。',
      '##主线大事件',
      '镇衡少年时从北海溯江而上来到云城游历，爱上云城的冰川草甸，深潭大江。和他的妹妹、哥哥在深海和天上四处逍遥不同，他更喜欢定居一方的感觉，在兴泽给兴泽地方政权当权者当谋士，依靠龙的法力布阵征伐、假装卜卦。',
      '笼络人心后“黄袍加身”，逼宫篡权，开启统一大业。曾用各种“威胁”的手段招兵买马，但是亲民的性格却也是年少时就有。',
      '统一云城，带领云城并入神州。不久后与流焱分别，开启云城民主化改革。',
      '布局流云渡船闸。镇衡得知李津云有修船闸的方案和梦想后，没有着急用他，而是先自导自演让几个水利学术权威发论文论证流云渡修船闸的可行性不高。然后利用交通运输发达省份的议员及官吏的野心，帮“增加神州议会比例议席评定下一百年增加交通运输贡献比重”法案造势，推波助澜。',
      '法案通过后镇衡就启动船闸计划，摆了其他省的议员和官员一道。青龙大船闸完工，比例议席名单直播公布那天，全云城人也是紧盯电视屏幕，最终也如偿所愿云城增加了12个议席，总数增加到35席。',
    ],
  },
  {
    id: 'liuyan',
    name: '流焱',
    race: '人类 · 初代浮玉将军',
    img: 'images/cast-liuyan.jpg?v=1122b',
    brief: '白色短发的人类，擅长青焰、可瞬移。领兵统一浮玉，洒脱豪迈，卸甲后云游四海。',
    full: [
      '姓名：流焱　种族：人类　外貌锚点：白色短发',
      '法力：擅长使用青焰，可以利用火焰瞬移　取向：无浪漫倾向',
      '##工作性格',
      '英姿飒爽，性格洒脱豪迈，智勇双全。领兵统一浮玉，是浮玉的最高领导人。在面对军事时冷静智慧，战时武力高强，且精通谈判。',
      '##生活性格',
      '不喜政治，潇洒自由。简政放权给下属，而后卸甲云游四海。对权力并不那么感兴趣，但也不会因此否定镇衡的选择。时常回到兴泽与镇衡相见，也会调侃他。',
    ],
  },
]

// 时间线（主线大事件 · 设定原文）
const TIMELINE = [
  { text: '镇衡统一民主化改革' },
  { text: '绯云化形，与春阳成为师徒' },
  { text: '绯云与韶情求学相识' },
  { text: '绯云与韶情一同留京工作' },
  { text: '春阳前去罗马，将桃园传给绯云，绯云回流云渡' },
  { text: '李津云化形求学，初步构思船闸' },
  { text: '蛟风入伍' },
  { text: '李津云毕业，返回流云渡任职科员' },
  { text: '李津云的船闸设计被镇衡发现，擢升流云渡副管和船闸设计指挥后，被“要挟”上任总督' },
  { text: '李津云开始征地，与绯云相遇、恋爱' },
  { text: '船闸竣工，李津云升任总督' },
  { text: '绯云既为了对土地和生命的热爱，也为了高效率赚钱，将灼华桃园转型为农林科技研究所' },
  { text: '阴差阳错间，晴晴诞生' },
  { text: '蛟风退伍返回流云渡，工作自由，由船员成为船长，与猎川同行四处旅行' },
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
  { key: 'Violeta', title: 'Violeta', author: '' },
  { key: 'Late night Drive', title: 'Late Night Drive', author: '' },
  { key: 'Fly High', title: 'Fly High', author: '' },
  { key: 'Aint-In-LA', title: "Ain't In LA", author: '' },
  { key: 'BUTTER', title: 'BUTTER', author: '' },
  { key: 'Steady', title: 'Steady', author: '' },
  { key: '野马尘埃', title: '野马尘埃', author: '' },
  { key: '七夕', title: '七夕', author: '' },
  { key: '老公', title: '老公', author: '' },
  { key: '开学', title: '开学', author: '' },
  { key: 'APPLE', title: 'APPLE', author: '' },
  { key: 'FlashingLights', title: 'Flashing Lights', author: '' },
  { key: 'LOVEMONEYFAME', title: 'LOVE MONEY FAME', author: '' },
  { key: 'Summerforever', title: 'Summer forever', author: '' },
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
        ${t.title ? `<h4>${t.title}</h4>` : ''}
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
  // full 数组里的 '##xxx' 视为分组小标题，其余为正文段落（内容完全来自设定原文）
  modalBody.innerHTML = target.full
    .map((p) => (p.startsWith('##')
      ? `<h4 class="detail-sub">${p.slice(2)}</h4>`
      : `<p>${p}</p>`))
    .join('')
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

  // 1) 清洗段落：去空、删除正文里的作者标注行（- 文/… - 、（文/…）、(文/…)、● 文/… - 等）
  const clean = paras
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => {
      // 删除任何形式的作者标注行：去掉装饰字符后若仅剩「文/雪山与百合花」即视为标注
      const t = p.replace(/[\s\-—·●()（）《》]/g, '')
      if (/^文\/雪山与百合花$/.test(t)) return false
      return true
    })

  // 2) 跳过正文里与标题重复的标题段（书名号形式或直接等于 title 的段落），
  //    避免与顶部固定标题重复显示
  const bodyParas = clean.filter((p) => {
    const isTitleDup =
      p === title ||
      p.replace(/[《》]/g, '') === title.replace(/[《》]/g, '') ||
      p === `《${title}》`
    return !isTitleDup
  })

  // 3) 固定排版：标题（居中大字）→ 作者行（居中灰字）→ 正文（统一字号）
  const EXCLUDE_AUTHOR = new Set(['江水与鲤鱼', '爱你', '意气'])
  const showAuthor = !EXCLUDE_AUTHOR.has(key)

  const parts = []
  // 标题始终用 title 字段居中显示
  parts.push(`<p class="reader-heading">${title}</p>`)
  // 作者行
  if (showAuthor) {
    parts.push(`<p class="reader-author">作者：雪山与百合花</p>`)
  }
  // 正文（统一字号，首行缩进）
  parts.push(...bodyParas.map((p) => `<p>${p}</p>`))

  readerBody.innerHTML = parts.join('')
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

if (editBtn) editBtn.addEventListener('click', openEditor)
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
// 若来自开屏动画跳转（?from=intro），立即隐藏帷幕，避免「拉两次」的重复过渡
const curtainIn = document.querySelector('.curtain-in')
if (curtainIn) {
  const fromIntro = new URLSearchParams(location.search).get('from') === 'intro'
  if (fromIntro) {
    // 从开屏动画跳转而来：开屏已播放过帷幕，直接移除 home 的入场帷幕，不重复播放
    curtainIn.style.display = 'none'
  } else {
    // 直接访问 home.html：正常播放入场帷幕，1.2 秒后兜底隐藏
    setTimeout(() => {
      curtainIn.style.display = 'none'
    }, 1200)
  }
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
