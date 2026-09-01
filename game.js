'use strict';

const STORAGE_KEY='bainian-mendi-save-v1';
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const chance=p=>Math.random()<p;
const uid=()=>Date.now()+Math.floor(Math.random()*900000)+100000;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt=n=>Math.floor(n).toLocaleString('zh-CN');

const REGIONS={
  江南:{desc:'田赋丰足，文风鼎盛；水患频仍',yield:1.16,trade:1.08,study:1.06,health:.98},
  中州:{desc:'仕路通达，地价昂贵；兵灾难避',yield:1,trade:1,study:1.08,health:1},
  北地:{desc:'民风尚武，土地广阔；收成不稳',yield:.92,trade:.92,study:.95,health:1.04},
  巴蜀:{desc:'物产殷实，远离朝争；消息稍迟',yield:1.12,trade:.97,study:1,health:1.03},
  岭南:{desc:'海贸可兴，药材丰饶；瘴疫偏多',yield:1.02,trade:1.18,study:.94,health:.94}
};

const ORIGINS={
  寒门塾师:{desc:'有书无财，开局一名秀才',silver:125,grain:720,fields:24,shops:0,workshops:0,books:48,prestige:8,reputation:14,influence:1,exam:'秀才',learning:64,martial:22,management:44,business:25,officeRank:0},
  没落士族:{desc:'旧谱犹存，尚有郡县人脉',silver:175,grain:860,fields:36,shops:0,workshops:0,books:72,prestige:22,reputation:26,influence:12,exam:'童生',learning:57,martial:30,management:52,business:30,officeRank:0},
  退伍武官:{desc:'军功换田，有一处末流官身',silver:145,grain:980,fields:48,shops:0,workshops:0,books:18,prestige:16,reputation:10,influence:8,exam:'白身',learning:29,martial:72,management:50,business:22,officeRank:9},
  商贾旁支:{desc:'现银丰厚，却要洗去商户门色',silver:460,grain:640,fields:18,shops:1,workshops:0,books:26,prestige:5,reputation:4,influence:6,exam:'白身',learning:36,martial:25,management:57,business:75,officeRank:0},
  胥吏之家:{desc:'熟悉县务，官场门路胜于清名',silver:235,grain:760,fields:28,shops:0,workshops:0,books:34,prestige:9,reputation:7,influence:20,exam:'童生',learning:45,martial:28,management:68,business:43,officeRank:0}
};

const PRECEPTS={
  耕读传家:{desc:'田亩收益与后辈读书并重',learning:10,integrity:4,unity:5,enterprise:2,martial:0},
  清白守正:{desc:'清名难得，也最能抵御官灾',learning:5,integrity:15,unity:4,enterprise:-2,martial:0},
  和宗睦族:{desc:'支房不易离心，婚育更安稳',learning:2,integrity:5,unity:16,enterprise:2,martial:0},
  经世致用:{desc:'经营、治事与官场实绩提高',learning:4,integrity:1,unity:3,enterprise:15,martial:0},
  文武并济:{desc:'子弟文武天赋更均衡',learning:7,integrity:3,unity:3,enterprise:2,martial:12}
};

const POLICIES={
  守成:{desc:'减轻日常耗费，降低族中风险。',effect:'年用度－10%，族人健康略稳'},
  兴学:{desc:'集中资财培养读书种子。',effect:'读书增长＋25%，考试成算提高'},
  置业:{desc:'扩田修仓，先求家底扎实。',effect:'田亩收成＋18%，置田略便宜'},
  通婚:{desc:'用婚盟织出郡县人情网。',effect:'议亲对象更佳，姻亲收益提高'},
  入仕:{desc:'举全族之力供养官场人物。',effect:'升迁更快，官场风险也更高'},
  商贸:{desc:'以商养士，不避清议争论。',effect:'商铺作坊收益＋25%，清望增长较慢'},
  尚武:{desc:'乱世先求能护庄保族。',effect:'习武增长＋30%，兵灾损失降低'}
};

const ASSIGNMENTS=['读书','习武','务农','经商','掌家','行医','著述','闲居'];
const EXAMS=[
  {from:'白身',to:'童生',name:'县试',minAge:14,minLearning:24,cost:8,base:.66,open:()=>true,award:2},
  {from:'童生',to:'秀才',name:'院试',minAge:16,minLearning:40,cost:16,base:.48,open:()=>true,award:8},
  {from:'秀才',to:'举人',name:'乡试',minAge:19,minLearning:62,cost:36,base:.27,open:()=>state.year%3===0,award:28},
  {from:'举人',to:'进士',name:'会试与殿试',minAge:22,minLearning:80,cost:70,base:.16,open:()=>state.year%3===1,award:75}
];
const EXAM_ORDER=['白身','童生','秀才','举人','进士'];
const OFFICES={9:'从九品·县主簿',8:'正八品·县丞',7:'正七品·知县',6:'正六品·州同',5:'正五品·知州',4:'正四品·知府',3:'正三品·布政使',2:'正二品·六部尚书',1:'正一品·内阁大学士'};
const OFFICE_SALARY={9:9,8:13,7:18,6:25,5:34,4:45,3:58,2:74,1:96};
const OFFICE_SEATS={
  江南:{county:['吴江县','钱塘县','嘉禾县'],prefecture:['苏州府','扬州府','杭州府'],province:['江南道']},
  中州:{county:['汝阳县','安阳县','颍川县'],prefecture:['洛阳府','汴州府','陈州府'],province:['中州道']},
  北地:{county:['云中县','朔方县','雁门县'],prefecture:['幽州府','太原府','云州府'],province:['北地道']},
  巴蜀:{county:['成都县','临邛县','江州县'],prefecture:['成都府','夔州府','梓州府'],province:['巴蜀道']},
  岭南:{county:['南海县','番禺县','合浦县'],prefecture:['广州府','桂州府','邕州府'],province:['岭南道']}
};
const OFFICE_TRACKS={
  本籍:{salary:.92,merit:.9,risk:.72,copy:'离家近，便于照应田庄并经营本地人脉'},
  外任:{salary:1.12,merit:1.22,risk:1.08,copy:'俸外收入较高，考成更快，但家用和官场风险也更高'},
  边任:{salary:1.2,merit:1.3,risk:1.18,copy:'边地事务繁重，容易立功，也更损健康'},
  京职:{salary:1.06,merit:1.08,risk:1.35,copy:'接近中枢，圣眷增长更快，党争风险也最大'}
};
const OFFICIAL_DUTIES={
  抚民:{desc:'轻徭息讼，稳步积累清望与考成',merit:.8,risk:.72},
  催科:{desc:'清查田赋，考成较快，但容易得罪地方',merit:1.35,risk:1.18},
  兴学:{desc:'修学宫、延师儒，反哺家学与士林名声',merit:.95,risk:.82},
  治河:{desc:'整修水利与仓储，外任最易建立政绩',merit:1.22,risk:1.02},
  练兵:{desc:'整饬团练，边任时容易获得军功',merit:1.18,risk:1.2},
  交际:{desc:'经营同年座师与上官，升迁更快，党争更险',merit:1.05,risk:1.38}
};
const CARAVAN_ROUTES={
  local:{name:'同郡粮布',target:'home',goods:'粮食、布匹',years:1,silver:70,grain:100,returns:1.3,risk:.08,desc:'路近本钱少，适合初次试商。'},
  canal:{name:'江淮漕路',target:'江南',goods:'米粮、纸墨',years:2,silver:150,grain:160,returns:1.55,risk:.15,desc:'依运河往来州府，灾年粮价尤其敏感。'},
  horse:{name:'北地马市',target:'北地',goods:'茶砖、铁器',years:3,silver:230,grain:80,returns:1.82,risk:.25,desc:'边关利厚，兵患与劫掠也最常见。'},
  shu:{name:'川蜀茶药',target:'巴蜀',goods:'药材、茶叶',years:3,silver:195,grain:0,returns:1.72,risk:.2,desc:'山路艰险，医者与本地官员能降低损耗。'},
  sea:{name:'岭南海舶',target:'岭南',goods:'香药、瓷器',years:4,silver:360,grain:0,returns:2.18,risk:.34,desc:'一次远航可骤富，也可能船货俱失。'}
};
const RANKS=[
  {name:'寒门小户',score:0,copy:'家业初聚，尚未进入地方大姓的视野。'},
  {name:'耕读之家',score:100,copy:'有田可耕，有书可读，乡里开始称道家风。'},
  {name:'乡里望族',score:240,copy:'婚丧宴饮已有乡绅往来，族言在一乡颇有分量。'},
  {name:'郡县大姓',score:500,copy:'族学、田庄与姻亲结成网络，县中事务绕不开此门。'},
  {name:'簪缨世家',score:900,copy:'数代有人出仕，冠盖相望，门生故吏遍及州郡。'},
  {name:'门阀望族',score:1500,copy:'家门可与朝中重臣通婚，一族进退足以牵动地方。'},
  {name:'百年公卿',score:2500,copy:'历经治乱而门楣不坠，已成为王朝记忆的一部分。'}
];
const PROJECTS={
  ancestral:{name:'宗祠',desc:'稳固家门、祭祖议事，减少支房离心。',base:160},
  academy:{name:'族学',desc:'族中子弟不必外出投师，读书效率提高。',base:260},
  library:{name:'藏书楼',desc:'积累经史策论，提高科举上限与著述声望。',base:330},
  charity:{name:'义庄',desc:'赈济贫弱族人，灾年保命，也积累乡望。',base:300},
  genealogy:{name:'谱局',desc:'续修宗谱、厘清昭穆，提高团结与门第认可。',base:220}
};

const FAMILY_SURNAMES=['顾','陆','沈','王','崔','卢','郑','裴','宋','苏','韩','柳','程','秦','萧','杜','许','卫','姜','袁'];
const GIVEN_END=['安','衡','宁','章','仪','清','远','修','文','庭','肃','昭','容','和','瑾','瑜','谦','诚','慎','怀','桐','兰','月','华','英','蕴','若','贞','婉','慧'];
const GENERATION_CHARS=['承','景','允','修','维','绍','克','念','敦','崇','昭','秉','世','长','守','敬','明','正','元','和','清','远','怀','德'];
const TRAITS=['聪颖','持重','勤俭','刚直','圆融','善经营','骁勇','仁厚','多病','散漫','好胜','沉静'];
const CLIMATES={承平:{desc:'四境承平，田价与科名同涨。',exam:.03,promotion:.02,disaster:-.04},党争:{desc:'台谏攻讦频繁，官越高越难独善。',exam:0,promotion:-.02,disaster:0},边患:{desc:'征粮募兵不断，武职与军功有可乘之机。',exam:-.02,promotion:.01,disaster:.05},灾馑:{desc:'水旱相仍，粮价腾贵，最考验家底。',exam:-.03,promotion:-.02,disaster:.12},新政:{desc:'朝廷求才理财，能吏与商户皆有机会。',exam:.02,promotion:.04,disaster:0}};

const VALUE_GUIDES={
  year:{title:'家历',tag:'时间',desc:'所有生产、成长、科举、任期、婚育、商队与朝局都随年份结算。',uses:['过一年适合精细处理应试、婚配与事件；过五年会在遇到事件时自动停下','乡试、会试按三年一科开放；官员任满三年后才能请调','商队、十年族策与朝局更替都以家历为计时单位'],sources:['右上角“过一年 / 过五年”推进'],tab:'overview'},
  population:{title:'在籍人口',tag:'宗族',desc:'当前住在本家、需要口粮并可被安排事务的活人总数。出阁或远行状态另算。',uses:['每人每年消耗口粮与家用，人口过多会推高管理成本','人口决定务农、掌家、行医等岗位的建议数量','婚育、分房、继承和大族批量管理都以人口结构为基础'],sources:['婚配生育增加；死亡、出阁与断支减少'],tab:'members'},
  silver:{title:'现银',tag:'经济',desc:'家门最通用的流动资源，用于教育、应试、产业、交际、婚礼、建设与应急。',uses:['置田、开铺、建作坊、扩宅与修宗族建筑','支付科举盘缠、官场交际、商队本金和地方经营','灾年与随机事件中用银往往能换取更稳妥的结果'],sources:['田租、商铺作坊、官俸、经商、商队、行医与著述'],tab:'estate'},
  grain:{title:'存粮',tag:'经济',desc:'既是全族口粮，也是灾年安全垫、商队货物和宗族行动成本。',uses:['每年自动供养在籍人口，见底会伤害全族健康','可在粮市按浮动价格买卖，灾馑时价格更高','商路、祭祖、赈济、工程和事件会消耗大量粮食'],sources:['田亩收成、粮市购买与部分事件'],tab:'estate'},
  fields:{title:'田亩',tag:'产业',desc:'最稳固的世家根基，持续产生粮食和田租，改朝换代也不会因罢官归零。',uses:['每年产生粮食与折银田租','提高族望并支撑更大人口和长期教育','灾害、争田、清丈等事件会直接考验田产'],sources:['置办田地、开荒、水利和部分事件'],tab:'estate'},
  score:{title:'族望',tag:'门第',desc:'门第的综合评分，不是一种可以花掉的货币。它决定家族从寒门小户到百年公卿的层级。',uses:['田亩、产业、科名、官位、声望、人脉与宗族建筑共同计入','门第层级是长期目标，也代表家族在地方与朝中的分量','高官和进士加分快，但产业、谱系与建筑更不怕政局翻覆'],sources:['经营所有主要子系统都会积累'],tab:'overview'},
  reputation:{title:'清望',tag:'名声',desc:'乡里与士林对本家的道德评价，能在争讼、灾年、科举与婚盟中发挥作用。',uses:['提高部分事件中的说服、胜诉和安全选择','影响议亲对象的家世与外界对家门的评价','清望过低会削弱门第并触发经营警告'],sources:['赈济、抚民、兴学、行医、著述与正面事件'],tab:'ancestral'},
  influence:{title:'人脉',tag:'关系',desc:'可调用的地方与官场关系网，连接调任、升迁、商路照应和区域经营。',uses:['提高官员升迁机会并降低部分清丈、争讼风险','官员驻地和区域关系会给对应商队提供照应','可在天下舆图经营乡望、建立会馆，把抽象人脉落到具体地区'],sources:['婚盟、官场交际、地方经营、捐输与事件'],tab:'map'},
  favor:{title:'圣眷',tag:'朝堂',desc:'本家在皇帝与中枢眼中的受信程度，能推高升迁机会，但在改元和易代时会快速衰减。',uses:['直接参与官员升迁计算','高层京职更容易增长，也最容易卷入党争','它是高风险的政治资本，不能代替田产和清望'],sources:['高官履职、军功、纳粮与朝廷事件'],tab:'career'},
  learning:{title:'学问',tag:'人物属性',desc:'个人经义、策论与著述能力，是科举和部分文职行动的核心属性。',uses:['达到门槛后才能应更高一级考试，并提高中式概率','高学问族人可任塾师、行医或著述','族学、藏书楼、书卷、家学与兴学族策会提高成长'],sources:['读书、延师、著述、族学与藏书楼'],tab:'career'},
  management:{title:'治事',tag:'人物属性',desc:'个人处理田庄、家务与政务的能力。',uses:['务农者提高田庄收成，掌家者降低全族口粮损耗','任官后影响政绩与部分事件判断','商队领队的治事可以辅助经营能力'],sources:['务农、掌家、任官与商队历练'],tab:'members'},
  business:{title:'经营',tag:'人物属性',desc:'个人识货、议价和掌控商路的能力。',uses:['经商者每年带来现银','达到25后才能担任商队领队，数值越高归航成功与厚利机会越高','善经营词条与商队历练会加快成长'],sources:['经商、远行商队与商业事件'],tab:'estate'},
  martial:{title:'武艺',tag:'人物属性',desc:'个人护庄、从军与乱世自保的能力。',uses:['决定山匪、械斗、征役等事件的胜算','高武艺子弟从军更可能立功，为家门带来族望与圣眷','北地、尚武族策与骁勇词条有利于成长'],sources:['习武、从军与武事事件'],tab:'members'},
  health:{title:'健康',tag:'人物属性',desc:'个人生存、婚育、远行与任职承压能力。',uses:['低健康会增加死亡风险并降低婚育稳定性','边任、商路、瘟疫和缺粮会损害健康','掌家减耗、行医、充足粮食与义庄能间接保护全族'],sources:['年龄、地区、职业、事件与粮食状况共同改变'],tab:'members'},
  integrity:{title:'操守',tag:'人物属性',desc:'个人的自持与名节，影响家风、官场风险和家门评价。',uses:['与治事共同塑造可靠的掌家人与官员','清正家风和正面选择有利于官灾与声誉','并非越高越万能：经营、武艺和人脉仍有各自用途'],sources:['读书、祖训、家风与事件选择'],tab:'ancestral'},
  familyLearning:{title:'家学',tag:'家风',desc:'整个家族的教育传统，会影响科举底蕴、藏书与读书成长。',uses:['与族学、藏书楼共同构成长期教育优势','兴学官员和延师课子可逐步提高','家学强不代表人人都该读书，仍需按才分业'],sources:['祖训、教育、建筑、官员兴学与事件'],tab:'ancestral'},
  unity:{title:'和族',tag:'家风',desc:'各房对公中与家主的信任程度，关系到婚育、分家、继承与灾年互助。',uses:['过低时争产、离心和断支风险上升','影响婚育概率与家主继承的稳定性','祭祖、谱局、义庄和公平处置可提高'],sources:['祖训、祭祖、宗祠谱局与家事选择'],tab:'ancestral'},
  enterprise:{title:'营生',tag:'家风',desc:'家族整体经营、治产和接受新财路的能力。',uses:['直接提高田亩产出','支撑商贸、作坊和职业分工的长期效率','置业、务农、经商与商业事件会提高'],sources:['祖训、产业扩张、务农经商与商贸选择'],tab:'estate'},
  familyMartial:{title:'武备',tag:'家风',desc:'家族整体护庄、团练与从军传统。',uses:['与最强族人的武艺共同决定护庄事件胜算','边患时期可转化为军功和族望','能降低部分兵灾损失，但会占用读书和经营人手'],sources:['祖训、尚武族策、习武、练兵与军功'],tab:'members'}
};

let state=null;
let activeTab='overview';
let startConfig={region:'江南',origin:'寒门塾师',precept:'耕读传家'};
let marriageMemberId=null;
let marriageCandidates=[];
let toastTimer=null;
let memberFilters={generation:'all',age:'all',assignment:'all'};
let memberPage=1;
let selectedMapRegion='江南';
let dossierMemberId=null;

function makeRegionalState(home='中州'){
  return Object.fromEntries(Object.keys(REGIONS).map(name=>[name,{
    relations:name===home?28:8,intel:0,hall:false,lastNetworkYear:-99,lastIntelYear:-99
  }]));
}

function makeMember(data={}){
  return Object.assign({
    id:uid(),name:'无名',sex:'男',age:0,generation:1,branch:'长房',parentIds:[],spouseId:null,
    bornInFamily:true,resident:true,marriedOut:false,uxorilocal:false,alive:true,birthYear:1,
    health:78,learning:10,martial:10,management:10,business:10,integrity:55,
    talent:50,trait:pick(TRAITS),assignment:'闲居',manualAssignment:false,onCaravan:false,caravanId:null,exam:'白身',examFails:0,lastExamYear:-99,
    officeRank:0,officeYears:0,officePlace:'',officeRegion:'',officeTrack:'',officeDuty:'抚民',officeHistory:[],officialContacts:[],lastSocialYear:-99,merit:0,lastBirthYear:-10,designated:false,relation:'族人'
  },data);
}

function renderStartChoices(){
  const groups=[['region',REGIONS,'regionChoices'],['origin',ORIGINS,'originChoices'],['precept',PRECEPTS,'preceptChoices']];
  groups.forEach(([type,data,id])=>{
    $(id).innerHTML=Object.entries(data).map(([name,v])=>`<button class="choice ${startConfig[type]===name?'on':''}" onclick="selectStart('${type}','${name}')"><b>${name}</b><small>${v.desc}</small></button>`).join('');
  });
  if(localStorage.getItem(STORAGE_KEY))$('resumeButton').classList.remove('hidden');
}

function selectStart(type,value){startConfig[type]=value;renderStartChoices()}

function startGame(){
  const surname=$('surnameInput').value.trim(),given=$('founderInput').value.trim();
  if(!surname||!given)return toast('请写下姓氏与开族者名讳');
  const origin=ORIGINS[startConfig.origin],precept=PRECEPTS[startConfig.precept],founderId=uid(),spouseId=uid();
  const founder=makeMember({
    id:founderId,name:surname+given,age:39,birthYear:-38,generation:1,branch:'宗房',spouseId,
    health:82,learning:origin.learning,martial:origin.martial,management:origin.management,business:origin.business,
    integrity:55+Math.floor(precept.integrity/2),talent:60,trait:startConfig.origin==='商贾旁支'?'善经营':startConfig.origin==='退伍武官'?'骁勇':'持重',
    assignment:origin.officeRank?'任官':origin.exam==='秀才'?'读书':'掌家',exam:origin.exam,officeRank:origin.officeRank,relation:'开族之祖',designated:true
  });
  const spouse=makeMember({
    id:spouseId,name:pick(FAMILY_SURNAMES)+pick(['静','淑','令','素','芸'])+pick(GIVEN_END),sex:'女',age:36,birthYear:-35,
    generation:1,branch:'宗房',spouseId:founderId,bornInFamily:false,resident:true,health:80,learning:34,
    management:61,business:38,integrity:64,talent:52,trait:'勤俭',assignment:'掌家',relation:'开族主母'
  });
  const child1=makeMember({name:uniqueFamilyName(surname,2),age:14,birthYear:-13,generation:2,branch:'长房',parentIds:[founderId,spouseId],learning:31,martial:27,management:24,business:18,talent:66,trait:'聪颖',assignment:'读书',relation:'长子'});
  const child2=makeMember({name:uniqueFamilyName(surname,2,[child1.name]),sex:'女',age:11,birthYear:-10,generation:2,branch:'长房',parentIds:[founderId,spouseId],learning:28,martial:18,management:35,business:26,talent:59,trait:'沉静',assignment:'读书',relation:'长女'});
  const child3=makeMember({name:uniqueFamilyName(surname,2,[child1.name,child2.name]),age:7,birthYear:-6,generation:2,branch:'二房',parentIds:[founderId,spouseId],learning:16,martial:32,management:18,business:15,talent:55,trait:startConfig.precept==='文武并济'?'骁勇':'好胜',assignment:'读书',relation:'次子'});
  const climate='承平';
  state={
    version:2,surname,region:startConfig.region,origin:startConfig.origin,precept:startConfig.precept,
    year:1,headId:founderId,heirId:child1.id,lastPolicyYear:1,policy:'守成',climate,lastClimateYear:1,
    resources:{silver:origin.silver,grain:origin.grain,prestige:origin.prestige,reputation:origin.reputation,influence:origin.influence,favor:origin.officeRank?4:0},
    assets:{fields:origin.fields,shops:origin.shops,workshops:origin.workshops,granaries:1,houses:1,books:origin.books},
    projects:{ancestral:1,academy:startConfig.origin==='寒门塾师'?1:0,library:0,charity:0,genealogy:startConfig.origin==='没落士族'?1:0},
    values:{learning:35+precept.learning,integrity:42+precept.integrity,unity:42+precept.unity,enterprise:30+precept.enterprise,martial:25+precept.martial},
    members:[founder,spouse,child1,child2,child3],dead:[],alliances:[],caravans:[],pendingEvent:null,eventHistory:[],ended:false,
    market:marketQuote(1,climate,startConfig.region),regional:makeRegionalState(startConfig.region),
    lastYearReport:{income:0,expense:0,harvest:0,consumption:0,fieldRent:0,shopIncome:0,tradeIncome:0,salary:0,serviceIncome:0},logs:[]
  };
  if(origin.officeRank)appointOfficial(founder,origin.officeRank,'home');
  log('important',`大晟承平十二年，${surname}氏自${startConfig.origin}起家，落籍${startConfig.region}。`);
  log('normal',`${founder.name}立下祖训“${startConfig.precept}”，携家眷、田地${origin.fields}亩与藏书${origin.books}卷开门立户。`);
  if(origin.officeRank)log('good',`${founder.name}凭旧日军功领${OFFICES[origin.officeRank]}之职，成为家门第一份官身。`);
  enterGame();save();renderAll();
}

function uniqueFamilyName(surname,generation,extra=[]){
  const used=new Set([...(state?.members||[]).map(m=>m.name),...extra]);
  const gen=GENERATION_CHARS[(generation-2)%GENERATION_CHARS.length];
  let name=surname+gen+pick(GIVEN_END),guard=0;
  while(used.has(name)&&guard++<50)name=surname+gen+pick(GIVEN_END);
  return name;
}

function enterGame(){
  $('startOverlay').classList.add('hidden');$('game').classList.remove('hidden');
  selectedMapRegion=state?.region||'中州';
  if(state.pendingEvent)setTimeout(showPendingEvent,60);
}

function resumeGame(){
  try{
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY));
    state=migrate(data);enterGame();renderAll();toast('旧档已续读');
  }catch(e){toast('存档损坏，无法续读')}
}

function migrate(data){
  if(!data||![1,2].includes(data.version)||!Array.isArray(data.members))throw new Error('invalid');
  data.version=2;
  data.eventHistory=data.eventHistory||[];data.logs=data.logs||[];data.dead=data.dead||[];data.alliances=data.alliances||[];data.caravans=data.caravans||[];
  data.members=data.members.map(m=>makeMember(m));data.values=Object.assign({learning:40,integrity:45,unity:45,enterprise:35,martial:30},data.values||{});
  data.projects=Object.assign({ancestral:1,academy:0,library:0,charity:0,genealogy:0},data.projects||{});
  data.market=Object.assign(marketQuote(data.year,data.climate,data.region),data.market||{});
  const regionalDefaults=makeRegionalState(data.region);
  data.regional=Object.fromEntries(Object.keys(REGIONS).map(name=>[name,Object.assign(regionalDefaults[name],data.regional?.[name]||{})]));
  data.lastYearReport=Object.assign({income:0,expense:0,harvest:0,consumption:0,fieldRent:0,shopIncome:0,tradeIncome:0,salary:0,serviceIncome:0},data.lastYearReport||{});
  data.members.forEach(m=>{
    if(!Array.isArray(m.officeHistory))m.officeHistory=[];
    if(!Array.isArray(m.officialContacts))m.officialContacts=[];
    if(m.officeRank&&!m.officePlace){
      const legacy=officeDestination(m.officeRank,'home',data.region);
      m.officePlace=legacy.place;m.officeRegion=legacy.region;m.officeTrack=legacy.track;
    }
    if(m.officeRank&&!m.officeHistory.length)m.officeHistory.push({year:data.year,rank:m.officeRank,office:OFFICES[m.officeRank],place:m.officePlace,track:m.officeTrack});
  });
  return data;
}

function save(){if(state)localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function log(type,text){state.logs.unshift({year:state.year,type,text});if(state.logs.length>500)state.logs.length=500}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1900)}
function getMember(id){return state.members.find(m=>m.id===Number(id))}
function living(){return state.members.filter(m=>m.alive)}
function residents(){return living().filter(m=>m.resident)}
function bloodline(){return living().filter(m=>m.bornInFamily)}
function head(){return getMember(state.headId)}
function has(cost){return Object.entries(cost).every(([k,v])=>(state.resources[k]??0)>=v)}
function spend(cost){if(!has(cost))return false;Object.entries(cost).forEach(([k,v])=>state.resources[k]-=v);return true}
function addResource(key,value){state.resources[key]=Math.max(0,(state.resources[key]||0)+value)}

function marketQuote(year,climate,region){
  const climateFactor={承平:1,党争:1.08,边患:1.28,灾馑:1.72,新政:.94}[climate]||1;
  const regionFactor={江南:.92,中州:1,北地:1.16,巴蜀:.9,岭南:1.08}[region]||1;
  const swing=1+Math.sin((year||1)*1.71)*.09;
  const sellPer100=Math.max(5,Math.round(8*climateFactor*regionFactor*swing));
  return{year,sellPer100,buyPer100:sellPer100+Math.max(3,Math.round(sellPer100*.28))};
}

function refreshMarket(){state.market=marketQuote(state.year,state.climate,state.region)}

function regionProfile(name){
  if(!state.regional)state.regional=makeRegionalState(state.region);
  if(!state.regional[name])state.regional[name]=makeRegionalState(state.region)[name];
  return state.regional[name];
}

function regionOfficials(name){return residents().filter(m=>m.officeRank&&m.officeRegion===name)}
function regionCaravans(name){return(state.caravans||[]).filter(c=>c.status==='traveling'&&c.target===name)}

function runRegionalNetwork(){
  Object.keys(REGIONS).forEach(name=>{
    const profile=regionProfile(name),officials=regionOfficials(name).length;
    if(profile.relations>8&&!officials&&!profile.hall)profile.relations=Math.max(8,profile.relations-.18);
    if(officials)profile.relations=clamp(profile.relations+Math.min(.5,officials*.14),0,100);
    if(profile.hall&&chance(.2)){addResource('influence',.25);profile.relations=clamp(profile.relations+.08,0,100)}
  });
}

function selectMapRegion(name){
  if(!REGIONS[name])return;
  selectedMapRegion=name;
  renderMap();
}

function regionalAction(type){
  const name=selectedMapRegion,profile=regionProfile(name),officials=regionOfficials(name).length;
  if(type==='network'){
    if(profile.lastNetworkYear===state.year)return toast('本年已在此地经营过乡望');
    const cost=50+Math.floor(profile.relations*.45);
    if(!spend({silver:cost}))return toast(`经营乡望需银${cost}两`);
    const gain=8+officials*2+(name===state.region?3:0);
    profile.relations=clamp(profile.relations+gain,0,100);profile.lastNetworkYear=state.year;
    addResource('influence',3+officials);if(name===state.region)addResource('reputation',2);
    log('good',`${state.surname}氏在${name}设宴访贤、周济乡里，地方关系提高${gain}。`);
  }else if(type==='intel'){
    if(profile.intel>=3)return toast('此地商情已经尽数掌握');
    if(profile.lastIntelYear===state.year)return toast('本年已派人探听过此地商情');
    const cost=30+profile.intel*24;
    if(!spend({silver:cost}))return toast(`探听商情需银${cost}两`);
    profile.intel++;profile.lastIntelYear=state.year;addResource('influence',1);
    log('normal',`账房派人往${name}查访行价与道路，商情升至第${profile.intel}级。`);
  }else if(type==='hall'){
    if(profile.hall)return toast(`${name}会馆已经设立`);
    if(profile.relations<25&&!officials)return toast('地方关系达到25，或有本族官员在任，方可设立会馆');
    const cost=260;
    if(!spend({silver:cost,grain:120}))return toast('设立会馆需银260两、粮120石');
    profile.hall=true;profile.relations=clamp(profile.relations+12,0,100);addResource('prestige',10);addResource('influence',8);
    log('important',`${state.surname}氏在${name}设立会馆，今后官员、商队与姻亲皆有落脚之处。`);
  }
  save();renderAll();toast(type==='network'?`${name}乡望已经营`:type==='intel'?`${name}商情升至${profile.intel}级`:`${name}会馆落成`);
}

function caravanTarget(route){return route.target==='home'?state.region:route.target}

function launchCaravan(routeId){
  const route=CARAVAN_ROUTES[routeId],leaderId=Number($('caravanLeaderSelect')?.value),leader=getMember(leaderId);if(!route)return;
  if(!leader||!leader.alive||!leader.resident||leader.officeRank||leader.onCaravan||leader.assignment!=='经商')return toast('请先选择一名正在经商的成年族人领队');
  if(leader.age<16||leader.business<25)return toast('领队须年满十六且经营达到25');
  if(state.resources.silver<route.silver||state.resources.grain<route.grain)return toast(`启程需银${route.silver}两${route.grain?`、粮${route.grain}石`:''}`);
  state.resources.silver-=route.silver;state.resources.grain-=route.grain;
  const caravan={id:uid(),routeId,leaderId:leader.id,leader:leader.name,target:caravanTarget(route),startYear:state.year,dueYear:state.year+route.years,investment:route.silver,grain:route.grain,status:'traveling',result:''};
  state.caravans.push(caravan);leader.onCaravan=true;leader.caravanId=caravan.id;leader.assignment='行商';leader.manualAssignment=true;
  log('important',`${leader.name}领${route.name}商队启程，携${route.goods}前往${caravan.target}，预计${route.years}年后归来。`);
  save();renderAll();toast(`${route.name}商队已经启程`);
}

function processCaravans(){
  (state.caravans||[]).filter(c=>c.status==='traveling'&&c.dueYear<=state.year).forEach(resolveCaravan);
  if(state.caravans.length>60)state.caravans=state.caravans.filter(c=>c.status==='traveling').concat(state.caravans.filter(c=>c.status!=='traveling').slice(-40));
}

function resolveCaravan(caravan){
  const route=CARAVAN_ROUTES[caravan.routeId],leader=getMember(caravan.leaderId);if(!route)return;
  if(!leader?.alive){
    const salvage=Math.round(caravan.investment*.18);state.resources.silver+=salvage;caravan.status='lost';caravan.result=`领队亡故，仅收回${salvage}两残货`;
    log('bad',`${caravan.leader}领队的${route.name}商队失去主事，只带回${salvage}两残货。`);return;
  }
  const regional=regionProfile(caravan.target);
  const support=state.members.some(m=>m.alive&&m.officeRank&&m.officeRegion===caravan.target)?(.06+state.resources.influence*.0004):0;
  const networkSupport=regional.relations*.00055+regional.intel*.018+(regional.hall ? .065 : 0);
  const healer=(caravan.target==='巴蜀'&&residents().some(m=>m.assignment==='行医'&&m.learning>=45))?0.04:0;
  const climateRisk=state.climate==='边患'&&caravan.target==='北地'?.09:state.climate==='灾馑'?.05:0;
  const success=clamp(.72-route.risk+leader.business*.003+leader.management*.0012+support+networkSupport+healer-climateRisk,.22,.94);
  const roll=Math.random();let payout=0;
  if(roll<success){
    const windfall=chance(.1+leader.business*.001),skillFactor=.9+leader.business/500;
    payout=Math.round(caravan.investment*route.returns*skillFactor*(1+regional.intel*.035+(regional.hall ? .07 : 0))*(windfall?1.35:1));
    caravan.status=windfall?'windfall':'returned';caravan.result=`带回${payout}两`;
    state.resources.silver+=payout;leader.business=clamp(leader.business+route.years*(windfall?2.2:1.2),0,100);leader.management=clamp(leader.management+route.years*.5,0,100);
    addResource('influence',route.years+Math.floor(route.risk*10));addResource('prestige',windfall?6:2);
    log(windfall?'important':'good',`${leader.name}的${route.name}商队${windfall?'遇上大行情，':''}从${caravan.target}归来，带回银${payout}两。`);
  }else{
    const partial=chance(.56),injury=Math.round(7+route.risk*38+Math.random()*8);payout=partial?Math.round(caravan.investment*.42):0;
    state.resources.silver+=payout;leader.health=clamp(leader.health-injury,1,100);caravan.status=partial?'damaged':'lost';caravan.result=partial?`折损大半，收回${payout}两`:'货本尽失';
    log('bad',`${leader.name}的${route.name}商队在途中${partial?'遭劫折损':'几乎全军覆没'}，${payout?`仅收回${payout}两，`:''}领队健康下降${injury}。`);
  }
  leader.onCaravan=false;leader.caravanId=null;leader.assignment='经商';
}

function officeDestination(rank,preference='auto',homeRegion=state?.region||'中州'){
  if(rank<=2)return{region:'京师',place:'京师',track:'京职'};
  const regions=Object.keys(OFFICE_SEATS),forcedHome=preference==='home';
  const useHome=forcedHome||(preference==='auto'&&rank>=7&&chance(.38));
  const region=useHome?homeRegion:pick(regions.filter(r=>r!==homeRegion));
  const band=rank>=7?'county':rank>=4?'prefecture':'province';
  const place=pick(OFFICE_SEATS[region][band]);
  const track=useHome?'本籍':region==='北地'&&state?.climate==='边患'?'边任':'外任';
  return{region,place,track};
}

function appointOfficial(m,rank,preference='auto',record=true){
  const destination=officeDestination(rank,preference);
  const firstAppointment=!m.officeHistory?.length;
  m.officeRank=rank;m.officeYears=0;m.merit=0;m.assignment='任官';
  m.officePlace=destination.place;m.officeRegion=destination.region;m.officeTrack=destination.track;
  if(firstAppointment||!OFFICIAL_DUTIES[m.officeDuty])m.officeDuty=m.officeTrack==='边任'?'练兵':m.officeTrack==='京职'?'交际':'抚民';
  ensureOfficialContacts(m);
  if(record)m.officeHistory.push({year:state.year,rank,office:OFFICES[rank],place:m.officePlace,track:m.officeTrack});
}

function vacateOffice(m){
  m.officeRank=0;m.officeYears=0;m.merit=0;m.assignment='闲居';m.officePlace='';m.officeRegion='';m.officeTrack='';
}

function contactName(){
  const surname=pick(FAMILY_SURNAMES.filter(s=>s!==state?.surname));
  return surname+pick(['伯','仲','季','子','彦','景'])+pick(GIVEN_END);
}

function ensureOfficialContacts(m){
  if(!Array.isArray(m.officialContacts))m.officialContacts=[];
  const needed=['座师','同年',m.officeTrack==='京职'?'部堂前辈':'上官'];
  needed.forEach(role=>{
    if(!m.officialContacts.some(c=>c.role===role))m.officialContacts.push({id:uid(),name:contactName(),role,bond:28+Math.floor(Math.random()*24),camp:pick(['清议','实务','权门'])});
  });
  if(m.officeTrack!=='京职'&&!m.officialContacts.some(c=>c.role==='地方士绅'&&c.region===m.officeRegion))m.officialContacts.push({id:uid(),name:contactName(),role:'地方士绅',region:m.officeRegion,bond:25+Math.floor(Math.random()*20),camp:'乡党'});
  if(m.officialContacts.length>8)m.officialContacts=m.officialContacts.slice(-8);
}

function officialNetworkPower(m){
  if(!m.officialContacts?.length)return 0;
  return m.officialContacts.reduce((sum,c)=>sum+c.bond,0)/m.officialContacts.length;
}

function eraInfo(year=state.year){
  if(year<=8)return{dynasty:'大晟',title:'承平',regnal:11+year,changed:false};
  const shifted=year-9,dynasties=['大晟','大宁','大昭','大熙'],titles=['景和','元祐','弘治','中兴'];
  const dynastyIndex=Math.floor(shifted/72),within=shifted%72,titleIndex=Math.floor(within/18);
  return{dynasty:dynasties[dynastyIndex%dynasties.length],title:titles[titleIndex],regnal:within%18+1,changed:within===0&&shifted>0};
}

function familyScore(){
  const r=state.resources,a=state.assets;
  const official=state.members.filter(m=>m.alive&&m.officeRank).reduce((sum,m)=>sum+(10-m.officeRank)*24,0);
  const degrees=state.members.filter(m=>m.bornInFamily).reduce((sum,m)=>sum+[0,3,12,32,80][EXAM_ORDER.indexOf(m.exam)]||0,0);
  return Math.floor(r.prestige+r.reputation*.65+r.influence*.55+a.fields*.28+a.shops*20+a.workshops*16+official+degrees+Object.values(state.projects).reduce((x,y)=>x+y*16,0));
}
function currentRank(){const score=familyScore();return[...RANKS].reverse().find(r=>score>=r.score)||RANKS[0]}
function nextRank(){const score=familyScore();return RANKS.find(r=>r.score>score)||null}

function advanceYears(count){
  if(state.ended)return toast('家门已经断绝，请另开宗族');
  if(state.pendingEvent)return showPendingEvent();
  let passed=0;
  for(let i=0;i<count;i++){
    annualTurn();passed++;
    if(state.pendingEvent||state.ended)break;
  }
  save();renderAll();
  if(state.pendingEvent)showPendingEvent();
  else toast(`已过${passed}年`);
}

function annualTurn(){
  state.year++;
  const oldEra=eraInfo(state.year-1),newEra=eraInfo(state.year);
  if(oldEra.dynasty!==newEra.dynasty){
    log('important',`天下易姓，${oldEra.dynasty}亡而${newEra.dynasty}立。旧日官身尽数待勘，${state.surname}氏进入真正的改朝换代。`);
    state.members.filter(m=>m.officeRank).forEach(m=>{if(chance(.45))vacateOffice(m)});
    addResource('favor',-Math.floor(state.resources.favor*.7));addResource('prestige',-12);state.values.unity=clamp(state.values.unity-4,0,100);
  }else if(oldEra.title!==newEra.title){
    log('important',`新君改元${newEra.title}，朝局与取士风向随之一变。`);
    addResource('favor',-Math.floor(state.resources.favor*.35));
  }
  updateClimate();
  refreshMarket();
  processCaravans();
  runEconomy();
  runRegionalNetwork();
  ageAndTrain();
  runBirths();
  runOfficials();
  runMortality();
  chooseNewHead();
  checkLineExtinction();
  if(!state.ended&&chance(clamp(.26+CLIMATES[state.climate].disaster,0.18,.48)))triggerRandomEvent();
  if(state.year-state.lastPolicyYear>=10&&!state.pendingEvent){state.pendingEvent={id:'decade',context:{}}}
}

function updateClimate(){
  if(state.year-state.lastClimateYear<7)return;
  const old=state.climate,pool=['承平','党争','边患','灾馑','新政'];state.climate=pick(pool.filter(x=>x!==old));state.lastClimateYear=state.year;
  log('important',`朝局转入“${state.climate}”：${CLIMATES[state.climate].desc}`);
}

function runEconomy(){
  const r=state.resources,a=state.assets,region=REGIONS[state.region],people=residents(),homePeople=people.filter(m=>!m.onCaravan);
  const policyYield=state.policy==='置业'?1.18:1,granaryBonus=1+a.granaries*.025;
  let harvest=a.fields*(3.7+state.values.enterprise*.012)*region.yield*policyYield*granaryBonus*(.86+Math.random()*.28);
  if(state.climate==='灾馑')harvest*=.68;
  const farmerBonus=homePeople.filter(m=>m.assignment==='务农').reduce((x,m)=>x+4+m.management*.05,0);harvest+=farmerBonus;
  const shopIncome=a.shops*34*region.trade+(a.workshops*27)+(state.policy==='商贸'?(a.shops+a.workshops)*9:0);
  const tradeIncome=homePeople.filter(m=>m.assignment==='经商').reduce((x,m)=>x+4+m.business*.14,0);
  const salary=homePeople.reduce((x,m)=>x+(m.officeRank?OFFICE_SALARY[m.officeRank]*(OFFICE_TRACKS[m.officeTrack]?.salary||1):0),0);
  const teachingIncome=homePeople.filter(m=>m.assignment==='读书'&&m.age>22&&m.learning>=50).reduce((x,m)=>x+3+m.learning*.055,0);
  const serviceIncome=homePeople.filter(m=>m.assignment==='行医').reduce((x,m)=>x+2+m.learning*.06,0)+homePeople.filter(m=>m.assignment==='著述'&&m.learning>=55).reduce((x,m)=>x+1+m.learning*.035,0);
  const fieldRent=a.fields*.38;
  const householdIncome=fieldRent+shopIncome+tradeIncome+salary+teachingIncome+serviceIncome;
  const studentCost=homePeople.filter(m=>m.assignment==='读书').length*3.2;
  const officialCost=homePeople.filter(m=>m.officeRank).reduce((x,m)=>x+(m.officeTrack==='外任'||m.officeTrack==='边任'?8:m.officeTrack==='京职'?10:4),0);
  const baseExpense=(homePeople.length*1.45+studentCost+officialCost)*(state.policy==='守成'?.9:1);
  const stewards=homePeople.filter(m=>m.assignment==='掌家').reduce((x,m)=>x+m.management,0);
  const consumption=homePeople.length*7.5*Math.max(.78,1-stewards*.0008)*(state.policy==='守成'?.92:1);
  r.grain+=harvest-consumption;r.silver+=householdIncome-baseExpense;
  if(r.grain<0){const shortage=Math.abs(r.grain);r.grain=0;homePeople.forEach(m=>m.health=clamp(m.health-4-shortage/100,1,100));state.values.unity=clamp(state.values.unity-3,0,100);log('bad','族中粮仓见底，只得减食度日，老幼健康俱损。')}
  if(r.silver<0){r.silver=0;addResource('reputation',-2);state.values.unity=clamp(state.values.unity-2,0,100);log('bad','家用无以为继，族中开始典当器物周转。')}
  state.lastYearReport={income:householdIncome,expense:baseExpense,harvest,consumption,fieldRent,shopIncome,tradeIncome,salary,serviceIncome:serviceIncome+teachingIncome};
}

function ageAndTrain(){
  const region=REGIONS[state.region];
  residents().forEach(m=>{
    m.age++;
    if(m.onCaravan){
      const caravan=state.caravans.find(c=>c.id===m.caravanId),route=caravan&&CARAVAN_ROUTES[caravan.routeId];
      m.business=clamp(m.business+.9+Math.random()*.7,0,100);m.management=clamp(m.management+.3,0,100);
      if(route)m.health=clamp(m.health-route.risk*.55,1,100);
      return;
    }
    if(m.age<6){m.assignment='闲居';return}
    if(m.age===6&&m.assignment==='闲居')m.assignment=m.bornInFamily?'读书':'掌家';
    if(m.age===16&&m.assignment==='读书'&&!m.manualAssignment){
      const next=comingOfAgeAssignment(m);
      if(next!=='读书'){
        m.assignment=next;
        log('normal',`${m.name}年满十六，族中按其所长安排${next}，不再一味埋头举业。`);
      }
    }
    const talent=.65+m.talent/100;
    if(m.assignment==='读书'){
      let gain=(1.5+Math.random()*1.8)*talent*region.study*(1+state.projects.academy*.08)*(state.policy==='兴学'?1.25:1);
      if(m.trait==='聪颖')gain*=1.18;if(m.trait==='散漫')gain*=.72;
      m.learning=clamp(m.learning+gain,0,100);m.integrity=clamp(m.integrity+.2,0,100);
    }else if(m.assignment==='习武'){
      let gain=(1.7+Math.random()*1.9)*talent*(state.policy==='尚武'?1.3:1);if(m.trait==='骁勇')gain*=1.2;m.martial=clamp(m.martial+gain,0,100);
    }else if(m.assignment==='务农'){
      m.management=clamp(m.management+1.1+Math.random()*1.4,0,100);state.values.enterprise=clamp(state.values.enterprise+.03,0,100);
    }else if(m.assignment==='经商'){
      m.business=clamp(m.business+1.2+Math.random()*1.6,0,100);if(m.trait==='善经营')m.business=clamp(m.business+.6,0,100);
    }else if(m.assignment==='掌家'){
      m.management=clamp(m.management+1+Math.random()*1.2,0,100);if(chance(.2))state.values.unity=clamp(state.values.unity+.25,0,100);
    }else if(m.assignment==='行医'){
      m.learning=clamp(m.learning+.7+Math.random(),0,100);m.health=clamp(m.health+.7,0,100);if(chance(.12))addResource('reputation',.5);
    }else if(m.assignment==='著述'&&m.learning>=55){
      m.learning=clamp(m.learning+.6,0,100);if(chance(.1+m.learning*.002)){addResource('reputation',1.5);state.assets.books+=2;log('good',`${m.name}撰成一篇文章，在郡中士林传阅。`)}
    }else if(m.assignment==='任官'){
      m.management=clamp(m.management+.55,0,100);
    }
    if(m.trait==='多病')m.health-=.7;
    if(m.age>50)m.health-=.35+(m.age-50)*.018;
    else m.health+=.08;
    m.health=clamp(m.health,1,100);
  });
}

function workforceTargets(){
  const adults=residents().filter(m=>m.age>=16&&!m.officeRank).length,population=residents().length,a=state.assets;
  return{
    读书:Math.max(2,Math.ceil(adults*.18)),
    务农:Math.max(1,Math.ceil(a.fields/80)),
    经商:Math.max(1,a.shops+a.workshops+1),
    掌家:Math.max(1,Math.ceil(population/20)),
    习武:Math.max(1,Math.ceil(population/28)),
    行医:Math.max(1,Math.ceil(population/36)),
    著述:state.projects.library?Math.max(1,Math.ceil(adults/35)):0
  };
}

function assignmentCounts(excludeId=0){
  return residents().filter(m=>m.age>=16&&!m.officeRank&&m.id!==excludeId).reduce((out,m)=>{out[m.assignment]=(out[m.assignment]||0)+1;return out},{});
}

function vocationalAssignment(m,counts=assignmentCounts(m.id)){
  const targets=workforceTargets(),need=role=>Math.max(-2,(targets[role]||0)-(counts[role]||0));
  const scores={
    务农:m.management*.72+m.martial*.18+need('务农')*16,
    经商:m.business*.9+m.management*.12+need('经商')*16,
    掌家:m.management*.82+m.integrity*.15+need('掌家')*16,
    习武:m.martial*.95+m.health*.08+need('习武')*16,
    行医:m.learning*.68+m.integrity*.18+m.health*.08+need('行医')*16,
    著述:m.learning>=55?m.learning*.96+m.talent*.08+need('著述')*14:-999
  };
  return Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
}

function comingOfAgeAssignment(m){
  const targets=workforceTargets(),counts=assignmentCounts(m.id),scholarScore=m.learning*.72+m.talent*.42;
  if(m.sex==='男'&&m.bornInFamily&&(counts['读书']||0)<targets['读书']&&scholarScore>=58)return'读书';
  return vocationalAssignment(m,counts);
}

function runBirths(){
  const lines=bloodline().filter(m=>m.resident&&!m.onCaravan&&m.spouseId&&!m.marriedOut&&((m.sex==='男')||(m.sex==='女'&&m.uxorilocal)));
  // 大族人口越多，分房、晚婚与资源竞争越明显，避免数百年后人口无限膨胀。
  const density=Math.max(.16,1-residents().length/70);
  lines.forEach(line=>{
    const spouse=getMember(line.spouseId);if(!spouse||!spouse.alive||spouse.onCaravan)return;
    const mother=line.sex==='女'?line:spouse,father=line.sex==='男'?line:spouse;
    if(mother.age<18||mother.age>43||state.year-line.lastBirthYear<2)return;
    let p=.17*density*(mother.health/80)*(state.values.unity/60);
    if(state.precept==='和宗睦族')p+=.025;if(state.projects.ancestral>=2)p+=.01;
    if(!chance(clamp(p,.025,.28)))return;
    const sex=chance(.52)?'男':'女',generation=line.generation+1,child=makeMember({
      name:uniqueFamilyName(state.surname,generation),sex,age:0,birthYear:state.year,generation,branch:line.branch,
      parentIds:[father.id,mother.id],health:clamp(68+Math.random()*24+(mother.health-60)*.15,45,96),
      learning:3+Math.random()*5,martial:3+Math.random()*5,management:3+Math.random()*5,business:3+Math.random()*5,
      integrity:45+Math.random()*20,talent:clamp((father.talent+mother.talent)/2-12+Math.random()*24,28,90),trait:pick(TRAITS),assignment:'闲居',relation:`第${generation}代新生`
    });
    line.lastBirthYear=mother.lastBirthYear=state.year;state.members.push(child);addResource('prestige',.8);
    log('good',`${line.name}房中添了${sex==='男'?'一子':'一女'}，取名${child.name}。`);
  });
}

function runOfficials(){
  const climate=CLIMATES[state.climate];
  residents().filter(m=>m.officeRank).forEach(m=>{
    m.assignment='任官';m.officeYears++;
    const track=OFFICE_TRACKS[m.officeTrack]||OFFICE_TRACKS['外任'];
    const duty=OFFICIAL_DUTIES[m.officeDuty]||OFFICIAL_DUTIES['抚民'];
    const localNetwork=regionProfile(m.officeRegion||state.region);
    m.officialContacts.forEach(c=>c.bond=clamp(c.bond-(m.lastSocialYear===state.year-1?0.05:0.45),0,100));
    m.merit+=(1+m.management*.012)*track.merit*duty.merit+(localNetwork.hall ? .24 : 0);
    localNetwork.relations=clamp(localNetwork.relations+(m.officeDuty==='抚民'||m.officeDuty==='兴学' ? .22 : .08),0,100);
    if(m.officeDuty==='抚民'){addResource('reputation',.45);if(m.officeTrack==='本籍')state.values.unity=clamp(state.values.unity+.04,0,100)}
    if(m.officeDuty==='催科'){addResource('favor',.38);addResource('reputation',-.18);m.merit+=.45}
    if(m.officeDuty==='兴学'){state.values.learning=clamp(state.values.learning+.1,0,100);addResource('reputation',.35);if(chance(.08))state.assets.books+=1}
    if(m.officeDuty==='治河'){m.merit+=state.climate==='灾馑'?.85:.25;if(m.officeRegion===state.region)state.resources.grain+=2}
    if(m.officeDuty==='练兵'){state.values.martial=clamp(state.values.martial+.09,0,100);if(state.climate==='边患')addResource('prestige',.55)}
    if(m.officeDuty==='交际'){m.officialContacts.forEach(c=>c.bond=clamp(c.bond+.22,0,100));addResource('influence',.35)}
    if(m.officeTrack==='本籍'&&chance(.28))addResource('influence',.6);
    if(m.officeTrack==='外任'&&chance(.2))addResource('reputation',.6);
    if(m.officeTrack==='京职')addResource('favor',.35);
    if(m.officeTrack==='边任'){
      m.health=clamp(m.health-.35,1,100);
      if(state.climate==='边患'){m.merit+=1.2;if(chance(.16))addResource('prestige',1)}
    }
    const corruption=(Math.max(0,45-m.integrity)*.0015+(state.climate==='党争' ? .015 : 0))*track.risk*duty.risk*(localNetwork.hall ? .9 : 1);
    if(chance(corruption)){
      const severe=chance(.25+m.officeRank*.02);addResource('reputation',severe?-14:-5);addResource('favor',severe?-9:-3);
      if(severe){log('bad',`${m.name}在${m.officePlace}任上因钱粮不清遭弹劾，官身尽失。`);vacateOffice(m)}
      else log('bad',`${m.name}在${m.officePlace}受到御史参劾，虽保住官位，家门清名受损。`);
      return;
    }
    if(m.officeYears>=4&&m.officeRank>1){
      let p=.035+m.merit*.002+officialNetworkPower(m)*.00065+state.resources.influence*.0007+state.resources.favor*.001+localNetwork.relations*.00035+(localNetwork.hall ? .008 : 0)+climate.promotion+(state.policy==='入仕' ? .045 : 0);
      if(m.trait==='圆融')p+=.025;if(m.trait==='刚直'&&state.climate==='党争')p-=.02;
      if(chance(clamp(p,.01,.24))){
        const oldPlace=m.officePlace,nextRank=m.officeRank-1,preference=m.officeTrack==='本籍'?'home':'auto';
        appointOfficial(m,nextRank,preference);
        addResource('prestige',10+(10-nextRank)*3);addResource('influence',3);addResource('favor',2);
        log('important',`${m.name}在${oldPlace}政绩入考，升任${OFFICES[nextRank]}，迁往${m.officePlace}。`);
      }
    }
  });
}

function runMortality(){
  living().forEach(m=>{
    if(m.age<45&&m.health>25)return;
    let p=m.age<50?.002:m.age<60?.008:m.age<70?.025:m.age<80?.075:.18;
    p+=Math.max(0,55-m.health)*.0025;if(m.trait==='多病')p+=.012;if(m.health<15)p+=.12;
    if(chance(clamp(p,0,.65)))memberDies(m);
  });
}

function memberDies(m){
  m.alive=false;m.resident=false;const spouse=getMember(m.spouseId);if(spouse)spouse.spouseId=null;
  state.dead.push({id:m.id,name:m.name,year:state.year,age:m.age,exam:m.exam,office:m.officeRank?OFFICES[m.officeRank]:''});
  log(m.id===state.headId?'important':'bad',`${m.name}卒于家中，享年${m.age}岁${m.officeRank?`，身后以${OFFICES[m.officeRank]}入谱`:''}。`);
  if(m.officeRank){addResource('prestige',5);m.officeRank=0}
}

function chooseNewHead(){
  const current=head();if(current?.alive)return;
  const heir=getMember(state.heirId);
  let successor=heir?.alive&&heir.resident&&heir.age>=16?heir:null;
  if(!successor)successor=bloodline().filter(m=>m.resident&&m.age>=16).sort((a,b)=>a.generation-b.generation||(a.sex==='男'?-1:1)||b.age-a.age)[0];
  if(successor){state.headId=successor.id;successor.designated=false;log('important',`${successor.name}奉宗祠之议接掌门户，成为新任家主。`);autoChooseHeir()}
}

function autoChooseHeir(){
  const h=head();if(!h)return;
  const candidates=bloodline().filter(m=>m.resident&&m.id!==h.id&&m.age>=10).sort((a,b)=>{
    const achild=a.parentIds.includes(h.id)?0:1,bchild=b.parentIds.includes(h.id)?0:1;
    return achild-bchild||(a.sex==='男'?-1:1)||b.age-a.age;
  });
  state.members.forEach(m=>m.designated=false);state.heirId=candidates[0]?.id||null;if(candidates[0])candidates[0].designated=true;
}

function checkLineExtinction(){
  if(bloodline().length)return;
  state.ended=true;log('important',`${state.surname}氏血脉断绝，田庄与旧谱散入他姓。世家之路止于第${state.year}年。`);toast('家门血脉已经断绝');
}

const EVENTS={
  drought:{
    kicker:'田庄急报',title:'春旱伤苗',can:()=>state.assets.fields>=20,
    copy:()=>`入夏无雨，沟渠见底，佃户说今年收成至多只有往年一半。粮价已经开始上涨，乡里都在看${state.surname}家如何处置。`,
    options:[
      {label:'开仓借粮',hint:'消耗粮食160石；清望、团结提高',effect:()=>{if(state.resources.grain<160)return toast('粮食不足160石'),false;state.resources.grain-=160;addResource('reputation',13);addResource('prestige',5);state.values.unity+=4;return'家主开仓借粮，不收利息，佃户与邻里皆感其德。'}},
      {label:'出银修渠',hint:'消耗银90两；田亩长期受益',effect:()=>{if(!spend({silver:90}))return toast('银两不足90两'),false;state.assets.fields+=4;state.values.enterprise+=3;return'族人合力疏渠引水，虽耗银不少，却保住了近庄田亩。'}},
      {label:'紧闭粮仓',hint:'保全家底；清望－7、团结－4',effect:()=>{addResource('reputation',-7);state.values.unity-=4;return'粮仓大门紧闭，家产得保，庄户却从此记下了这笔账。'}}
    ]
  },
  flood:{
    kicker:'水患',title:'堤决三十里',can:()=>['江南','中州','岭南'].includes(state.region),
    copy:()=>`连雨七日，上游决堤。洪水正朝${state.surname}氏田庄而来，宗祠、粮仓和佃户村落不可能全部守住。`,
    options:[
      {label:'先护人命',hint:'损失部分粮田；清望大增',effect:()=>{const loss=Math.min(12,state.assets.fields);state.assets.fields-=loss;state.resources.grain*=.82;addResource('reputation',16);state.values.unity+=5;return`族人先撤老幼与佃户，水退时损失田地${loss}亩，却无一人死于洪水。`}},
      {label:'死守粮仓',hint:'消耗银60两；保住存粮，健康受损',effect:()=>{if(!spend({silver:60}))return toast('银两不足60两'),false;residents().filter(m=>m.age>15).forEach(m=>m.health-=4);addResource('reputation',-3);return'壮丁彻夜筑堤保住粮仓，却有人染病，乡里也责怪谢家只顾自家。'.replace('谢',state.surname)}},
      {label:'舍财两全',hint:'消耗银150两；保庄救人',effect:()=>{if(!spend({silver:150}))return toast('银两不足150两'),false;addResource('reputation',10);addResource('prestige',7);state.values.unity+=3;return'家主雇船转运、购木筑堤，田庄与人命大体保全。'}}
    ]
  },
  epidemic:{
    kicker:'宅中疾疫',title:'时疫入城',can:()=>residents().length>=5,
    copy:()=>`城门外已有草席裹尸，药铺门前排起长队。族中也有孩子发热，若处置迟疑，几房人都可能染病。`,
    options:[
      {label:'延请名医',hint:'消耗银100两；大幅降低损伤',effect:()=>{if(!spend({silver:100}))return toast('银两不足100两'),false;residents().forEach(m=>m.health=clamp(m.health-1+Math.random()*3,1,100));addResource('reputation',3);return'名医住进宅中分房施治，族人有惊无险。'}},
      {label:'封宅自救',hint:'尽量消耗粮80石；部分族人健康下降',effect:()=>{const used=Math.min(80,state.resources.grain);state.resources.grain-=used;residents().forEach(m=>{if(chance(used>=80?.28:.55))m.health-=used>=80?8:15});return used>=80?'家门闭户一月，时疫终退，只是几名族人元气大伤。':'粮药不足，族人只能封宅硬熬，时疫退后多人久病。'}},
      {label:'设棚施药',hint:'需族中有人行医；清望＋15',effect:()=>{const healer=residents().find(m=>m.assignment==='行医'&&m.learning>=35);if(!healer)return toast('族中没有足以主持药棚的医者'),false;if(!spend({silver:55}))return toast('银两不足55两'),false;addResource('reputation',15);healer.learning+=3;return`${healer.name}在族宅外设棚施药，救活多人，${state.surname}氏由此得了善名。`}}
    ]
  },
  landDispute:{
    kicker:'县衙传票',title:'界碑挪了三尺',can:()=>state.assets.fields>=30,
    copy:()=>`邻庄${pick(FAMILY_SURNAMES)}氏趁夜挪动界碑，硬说河湾十亩地本属他们。田契尚在，但县丞与对方是姻亲。`,
    options:[
      {label:'持契告官',hint:'看清望与治事能力；可能胜诉',effect:()=>{const power=state.resources.reputation*.004+Math.max(...residents().map(m=>m.management))*.004;if(chance(clamp(.28+power,.3,.82))){state.assets.fields+=5;addResource('prestige',5);return'家主逐条核对鱼鳞册与旧契，迫使县衙判还田界，对方另赔五亩。'}state.assets.fields=Math.max(0,state.assets.fields-10);addResource('influence',-3);return'县衙拖了半年，最终仍偏向对方，十亩河湾地就此易主。'}},
      {label:'托人说项',hint:'消耗人脉8、银45两；稳妥保田',effect:()=>{if(!has({influence:8,silver:45}))return toast('需要8点人脉与45两银'),false;spend({influence:8,silver:45});addResource('reputation',-1);return'一封名帖递进县丞内宅，次日界碑便被悄悄挪了回来。'}},
      {label:'械斗夺田',hint:'尚武家族胜算更高；有伤亡风险',effect:()=>{const fighters=residents().filter(m=>m.age>=16&&m.martial>=45);if(!fighters.length)return toast('族中没有足以领头护庄的人'),false;if(chance(.35+state.values.martial*.004)){state.assets.fields+=4;addResource('reputation',-5);return`${fighters[0].name}领庄丁夺回界碑，对方退让，但县里留下了${state.surname}氏好斗的名声。`}fighters[0].health-=22;state.assets.fields-=8;addResource('reputation',-9);return'械斗失利，有族人受伤，县衙反将田地判给对方。'}}
    ]
  },
  donation:{
    kicker:'县尊名帖',title:'修城捐输',can:()=>state.resources.silver>=80,
    copy:()=>`县尊倡议重修城墙，各家捐输数目已经写在红榜上。捐得少会被看轻，捐得太多又伤家底。`,
    options:[
      {label:'捐银四十两',hint:'小幅提高人脉与声望',effect:()=>{if(!spend({silver:40}))return toast('银两不足'),false;addResource('influence',3);addResource('prestige',2);return'红榜上添了四十两，数目不显眼，也不失礼。'}},
      {label:'捐银一百五十两',hint:'人脉＋12、官眷好感提高',effect:()=>{if(!spend({silver:150}))return toast('银两不足150两'),false;addResource('influence',12);addResource('favor',5);addResource('prestige',7);return`${state.surname}氏名列捐输前三，县尊亲自回帖致谢。`}},
      {label:'以粮代银',hint:'消耗粮240石；清望＋6',effect:()=>{if(state.resources.grain<240)return toast('粮食不足240石'),false;state.resources.grain-=240;addResource('reputation',6);addResource('influence',4);return'族中送去二百四十石粮，既供工役，也救了城中粮价。'}}
    ]
  },
  rareBooks:{
    kicker:'旧书肆',title:'一箱前朝抄本',can:()=>state.resources.silver>=50,
    copy:()=>`旧书商送来一箱经史抄本，其中夹有名臣批注。他开价不低，又急着在天黑前离城。`,
    options:[
      {label:'整箱买下',hint:'银90两；藏书＋35、家学提高',effect:()=>{if(!spend({silver:90}))return toast('银两不足90两'),false;state.assets.books+=35;state.values.learning+=4;addResource('reputation',2);return'抄本收入家塾，几名读书子弟轮流校勘，如获至宝。'}},
      {label:'只购策论',hint:'银35两；藏书＋10',effect:()=>{if(!spend({silver:35}))return toast('银两不足35两'),false;state.assets.books+=10;return'族中挑走最实用的策论数册，没有伤及家用。'}},
      {label:'请他另投高门',hint:'无变化',effect:()=>`家主没有被“名臣批注”打动，书商只得另寻买家。`}
    ]
  },
  faction:{
    kicker:'京中密信',title:'要不要署名',can:()=>state.members.some(m=>m.officeRank&&m.officeRank<=6),
    copy:ctx=>`${getMember(ctx.memberId)?.name||'族中官员'}收到同年密信，请他在一封攻讦政敌的奏疏上联名。拒绝会失去一批朋友，署名则等于押上家门。`,
    options:[
      {label:'婉拒署名',hint:'人脉－5；清望与安全提高',effect:ctx=>{const m=getMember(ctx.memberId);addResource('influence',-5);addResource('reputation',6);if(m)m.integrity+=5;return`${m?.name||'族中官员'}称病避开联名，仕途慢了一步，却没把家门绑上战车。`}},
      {label:'联名上疏',hint:'押注朝争；可能骤升或罢官',effect:ctx=>{const m=getMember(ctx.memberId);if(chance(state.climate==='党争'?.42:.58)){addResource('favor',14);addResource('influence',10);if(m&&m.officeRank>1)appointOfficial(m,m.officeRank-1,'auto');return'奏疏得到了御前支持，联名者一时炙手可热。'}if(m)vacateOffice(m);addResource('favor',-15);addResource('prestige',-18);return'风向一夜逆转，奏疏被斥为朋党之言，族中官员罢归乡里。'}},
      {label:'先送信探风',hint:'银80两、人脉4；降低下注风险',effect:ctx=>{if(!has({silver:80,influence:4}))return toast('需要80两银与4点人脉'),false;spend({silver:80,influence:4});const m=getMember(ctx.memberId);if(chance(.72)){addResource('favor',7);addResource('influence',4);return'京中故旧回信点明风向，族中顺势表态，既得好处又未冲在最前。'}if(m)m.officeYears=Math.max(0,m.officeYears-2);return'多方口风彼此矛盾，家中选择按兵不动，只失去一次机会。'}}
    ]
  },
  refugees:{
    kicker:'庄门之外',title:'流民求食',can:()=>state.resources.grain>=100,
    copy:()=>`北路灾民沿官道南下，数十户人家跪在庄门外求一口粮。庄头担心开门后会来更多人，也怕其中混有盗匪。`,
    options:[
      {label:'施粥十日',hint:'粮食180石；清望大增',effect:()=>{if(state.resources.grain<180)return toast('粮食不足180石'),false;state.resources.grain-=180;addResource('reputation',18);addResource('prestige',5);return'粥棚开了十日，活人无数，地方志为此记下了家名。'}},
      {label:'择壮丁为佃户',hint:'粮80石；田亩＋6，略有治安风险',effect:()=>{if(state.resources.grain<80)return toast('粮食不足80石'),false;state.resources.grain-=80;state.assets.fields+=6;state.values.enterprise+=2;if(chance(.18))addResource('silver',-25);return'族中收留几户可靠人家，给牛种开荒，庄上多了六亩熟田。'}},
      {label:'报官驱散',hint:'家底无损；清望－10',effect:()=>{addResource('reputation',-10);return'差役持棍驱散流民，庄门保住了安静，哭声却传了很远。'}}
    ]
  },
  bandits:{
    kicker:'夜半铜锣',title:'山匪围庄',can:()=>state.assets.fields>=25,
    copy:()=>`夜半庄头敲响铜锣，二十余名山匪正在撞外门。他们点名索银一百两，否则就烧粮仓。`,
    options:[
      {label:'交银保庄',hint:'损失银100两',effect:()=>{if(!spend({silver:100}))return toast('银两不足100两'),false;addResource('reputation',-2);return'银箱从墙头吊下，山匪如约退去，庄内无伤。'}},
      {label:'率众拒守',hint:'看族中武力与尚武家风；弱小家门也可冒险',effect:()=>{const fighter=residents().filter(m=>m.age>=16).sort((a,b)=>b.martial-a.martial)[0],power=(fighter?.martial||0)+state.values.martial*.45+state.projects.ancestral*3;if(chance(clamp(power/125,.12,.88))){addResource('prestige',8);addResource('reputation',5);state.values.martial+=3;return`${fighter?.name||'庄丁'}领众守住外门，山匪留下兵刃仓皇退走。`}if(fighter)fighter.health-=25;state.resources.grain=Math.max(0,state.resources.grain-180);state.assets.fields=Math.max(0,state.assets.fields-5);return'外门失守，粮仓被劫，领头守庄者也受了重伤。'}},
      {label:'请县兵驰援',hint:'消耗人脉10；稳妥化解',effect:()=>{if(!spend({influence:10}))return toast('人脉不足10点'),false;addResource('favor',2);return'县中巡检带弓手赶到，山匪未等天明便散了。'}}
    ]
  },
  teacher:{
    kicker:'族学来客',title:'名师愿留三年',can:()=>state.projects.academy>=1&&state.resources.silver>=100,
    copy:()=>`一位辞官归里的老翰林路过族学，看了几篇课业后，愿留下教三年，只要求安顿家眷与书斋。`,
    options:[
      {label:'厚礼延师',hint:'银160两；所有读书子弟受益',effect:()=>{if(!spend({silver:160}))return toast('银两不足160两'),false;residents().filter(m=>m.assignment==='读书').forEach(m=>m.learning=clamp(m.learning+8,0,100));state.values.learning+=4;addResource('reputation',5);return'老翰林受聘主讲族学，逐人改文章、讲经义，子弟学业大进。'}},
      {label:'请讲一月',hint:'银45两；年轻子弟小幅受益',effect:()=>{if(!spend({silver:45}))return toast('银两不足45两'),false;residents().filter(m=>m.age<25&&m.assignment==='读书').forEach(m=>m.learning=clamp(m.learning+3,0,100));return'族中只请老先生讲学一月，也让年轻子弟见识了科场门径。'}},
      {label:'家用不足，婉拒',hint:'不花银',effect:()=>`家主以家用艰难婉拒，老翰林留下一句“读书不可惜财”便离去。`}
    ]
  },
  trade:{
    kicker:'商路消息',title:'合伙走一趟海路',can:()=>state.assets.shops>=1||state.members.some(m=>m.business>=65),
    copy:()=>`姻亲送来消息：一支商船缺最后一股本钱。顺利归港可得数倍，但海寇、风浪和官税都说不准。`,
    options:[
      {label:'投银一百两',hint:'中等风险；可能获利260两',effect:()=>{if(!spend({silver:100}))return toast('银两不足100两'),false;if(chance(.63)){addResource('silver',260);state.values.enterprise+=3;return'商船入秋归港，香料与药材尽数脱手，净利远超田租。'}return'商船遇风漂失，股本无一文归还。'}},
      {label:'投银三百两',hint:'高风险高回报；清望略降',effect:()=>{if(!spend({silver:300}))return toast('银两不足300两'),false;addResource('reputation',-2);if(chance(.58)){addResource('silver',790);addResource('influence',4);return'大船满载而归，族中现银骤增，也与几家大商号结下往来。'}return'海寇截船，三百两本金沉入海上，族内主张弃商者群情激愤。'}},
      {label:'不冒此险',hint:'维持现状',effect:()=>`族中没有出股，数月后只听说那支船队尚未归港。`}
    ]
  },
  audit:{
    kicker:'清丈田亩',title:'册外之田',can:()=>state.assets.fields>=60,
    copy:()=>`新任知县下令清丈。庄头坦白：历年兼并来的田中，有十二亩没有足额入册。补税伤财，遮掩更可能留下把柄。`,
    options:[
      {label:'如数补税',hint:'银85两；清望＋5',effect:()=>{if(!spend({silver:85}))return toast('银两不足85两'),false;addResource('reputation',5);return'族中主动补齐历年税银，知县批下“乡绅守法”四字。'}},
      {label:'打点书吏',hint:'银45两、人脉3；保住田亩但损清名',effect:()=>{if(!has({silver:45,influence:3}))return toast('需要45两银与3点人脉'),false;spend({silver:45,influence:3});addResource('reputation',-4);return'书吏在册页上改了几笔，十二亩田悄无声息地留在族中。'}},
      {label:'拒不认账',hint:'看官场人脉；失败损失田地',effect:()=>{if(chance(.25+state.resources.influence*.006)){addResource('influence',-3);return'几位乡绅一同出面，清丈最终草草收场。'}state.assets.fields=Math.max(0,state.assets.fields-14);addResource('reputation',-7);return'县衙查出旧契漏洞，不仅没收册外田，还罚去两亩。'}}
    ]
  },
  quarrel:{
    kicker:'祠堂争执',title:'两房争产',can:()=>bloodline().filter(m=>m.generation>=2).length>=6,
    copy:()=>`祭田租息如何分配，长房与二房在祠堂吵到拍桌。若不能服众，今后婚丧、读书与纳税都难再合力。`,
    options:[
      {label:'按谱均分',hint:'团结＋6；银粮略损',effect:()=>{state.resources.grain=Math.max(0,state.resources.grain-60);state.values.unity=clamp(state.values.unity+6,0,100);return'家主翻出旧谱，逐项核算，哪一房也没多占，争执暂息。'}},
      {label:'偏向宗房',hint:'保住资源；团结－10',effect:()=>{state.values.unity=clamp(state.values.unity-10,0,100);addResource('prestige',-3);return'家主以宗法压下二房，明面无人再争，私下却开始各存私财。'}},
      {label:'拿私产补公中',hint:'银120两；团结与声望提高',effect:()=>{if(!spend({silver:120}))return toast('银两不足120两'),false;state.values.unity=clamp(state.values.unity+10,0,100);addResource('reputation',4);return'家主拿出私产补足祭田缺口，两房无话可说，祠堂议事重归平静。'}}
    ]
  },
  fire:{
    kicker:'走水',title:'藏书楼失火',can:()=>state.assets.books>=40,
    copy:()=>`更夫发现书房梁上起火，火舌已经卷到书架。人能救书，也能先搬银箱，但时间只够一边。`,
    options:[
      {label:'先抢书谱',hint:'藏书保住；银两损失',effect:()=>{const loss=Math.min(85,state.resources.silver*.25);state.resources.silver-=loss;state.values.learning+=3;return`族人冒火抢出宗谱与经史，银箱却熔坏，损失约${Math.floor(loss)}两。`}},
      {label:'先搬银箱',hint:'损失一半藏书；保住现银',effect:()=>{const loss=Math.floor(state.assets.books*.52);state.assets.books-=loss;state.values.learning-=4;return`银箱无恙，${loss}卷藏书却成了灰烬。`}},
      {label:'悬赏救火',hint:'银100两；两边大体保全',effect:()=>{if(!spend({silver:100}))return toast('银两不足100两'),false;state.assets.books=Math.max(0,state.assets.books-8);addResource('reputation',2);return'重赏之下，邻里与佃户一齐上房救火，只烧毁几册残卷。'}}
    ]
  },
  levy:{
    kicker:'边报',title:'朝廷征粮募丁',can:()=>state.climate==='边患',
    copy:()=>`边关告急，州府按田亩摊派军粮，又令大户各出一名壮丁。出钱可以代役，但数目不轻。`,
    options:[
      {label:'纳粮代役',hint:'粮240石、银50两；族人平安',effect:()=>{if(state.resources.grain<240||state.resources.silver<50)return toast('需要粮240石与银50两'),false;state.resources.grain-=240;state.resources.silver-=50;addResource('favor',3);return'军粮按时送抵州仓，族中没有子弟被强征。'}},
      {label:'让子弟或庄丁从军',hint:'有适龄族人则可能得军功；无人时损失庄产雇人代役',effect:()=>{const warrior=residents().filter(m=>m.bornInFamily&&m.age>=18&&m.age<=38).sort((a,b)=>b.martial-a.martial)[0];if(!warrior){state.assets.fields=Math.max(0,state.assets.fields-8);addResource('reputation',-2);return'族中没有适龄子弟，只得割出八亩庄田，雇佃户之子代应军役。'}if(chance(.25+warrior.martial*.006)){warrior.martial=clamp(warrior.martial+10,0,100);addResource('prestige',18);addResource('favor',10);return`${warrior.name}随军立功而还，得州府旌表，族中武名大振。`}warrior.health-=35;return`${warrior.name}负伤归来，军功未录，需在家休养多年。`}},
      {label:'托关系免役',hint:'人脉12、银80两；清望下降',effect:()=>{if(!has({influence:12,silver:80}))return toast('需要12点人脉与80两银'),false;spend({influence:12,silver:80});addResource('reputation',-6);return'名册上悄悄划去了家名，乡里却都知道这家大户躲了差役。'}}
    ]
  }
};

function triggerRandomEvent(){
  const entries=Object.entries(EVENTS).filter(([id,e])=>e.can()&&state.eventHistory.slice(-4).indexOf(id)<0);
  if(!entries.length)return;
  const [id]=pick(entries);const context={};
  if(id==='faction'){const officials=residents().filter(m=>m.officeRank&&m.officeRank<=6);context.memberId=pick(officials).id}
  state.pendingEvent={id,context};state.eventHistory.push(id);if(state.eventHistory.length>30)state.eventHistory.shift();
}

function showPendingEvent(){
  if(!state.pendingEvent)return;
  if(state.pendingEvent.id==='decade'){openPolicy(true);return}
  const event=EVENTS[state.pendingEvent.id];if(!event){state.pendingEvent=null;save();return}
  const ctx=state.pendingEvent.context||{};$('eventKicker').textContent=event.kicker;$('eventTitle').textContent=event.title;$('eventCopy').textContent=typeof event.copy==='function'?event.copy(ctx):event.copy;
  $('eventOptions').innerHTML=event.options.map((o,i)=>`<button class="event-option" onclick="resolveEvent(${i})"><b>${esc(o.label)}</b><small>${esc(o.hint)}</small></button>`).join('');
  $('eventOverlay').classList.remove('hidden');
}

function resolveEvent(index){
  const pending=state.pendingEvent,event=EVENTS[pending?.id],option=event?.options[index];if(!option)return;
  const result=option.effect(pending.context||{});if(result===false)return;
  log(result.includes('损')||result.includes('失利')||result.includes('罢')?'bad':'normal',result);
  state.pendingEvent=null;$('eventOverlay').classList.add('hidden');save();renderAll();
}

function nextExam(m){return EXAMS.find(e=>e.from===m.exam)||null}
function examStatus(m){
  const exam=nextExam(m);if(!exam)return'科名已极';
  if(m.sex!=='男')return'本朝科举不取女籍';
  if(m.age<exam.minAge)return`${exam.minAge}岁方可应${exam.name}`;
  if(m.learning<exam.minLearning)return`学问须达${exam.minLearning}`;
  if(m.lastExamYear===state.year)return`本年已应${exam.name}，须待下次开科`;
  if(!exam.open())return`${exam.name}尚未开科`;
  return`可应${exam.name}`;
}

function attemptExam(id){
  const m=getMember(id),exam=m&&nextExam(m);if(!m||!m.alive||!exam)return;
  if(m.sex!=='男')return toast('本朝科举不取女籍');
  if(m.age<exam.minAge||m.learning<exam.minLearning)return toast(examStatus(m));
  if(m.lastExamYear===state.year)return toast(`本年已经应过${exam.name}，不能反复入场`);
  if(!exam.open())return toast(`${exam.name}尚未开科`);
  if(!spend({silver:exam.cost}))return toast(`赴考需银${exam.cost}两`);
  m.lastExamYear=state.year;
  let p=exam.base+(m.learning-exam.minLearning)*.009+m.talent*.0012+state.projects.academy*.018+state.projects.library*.022+state.assets.books*.00035+CLIMATES[state.climate].exam;
  if(state.policy==='兴学')p+=.055;if(m.trait==='聪颖')p+=.035;if(m.trait==='散漫')p-=.04;
  p=clamp(p,.08,.88);
  if(chance(p)){
    m.exam=exam.to;m.examFails=0;addResource('prestige',exam.award);addResource('reputation',Math.ceil(exam.award/4));state.values.learning=clamp(state.values.learning+2,0,100);
    let extra='';
    if(exam.to==='进士'){
      const top=chance(.08),first=top&&chance(.12);m.honor=first?'状元':top?'二甲进士':'进士出身';
      appointOfficial(m,first?8:9,'auto');addResource('favor',first?18:7);extra=`，旋授${OFFICES[m.officeRank]}，赴${m.officePlace}任职`;
    }
    log('important',`${m.name}应${exam.name}得中，取得${m.honor||exam.to}功名${extra}。`);toast(`${m.name}${exam.name}得中！`);
  }else{
    m.examFails++;m.learning=clamp(m.learning+2.5,0,100);m.health=clamp(m.health-2,1,100);
    if(m.examFails>=3&&!m.trait.includes('屡试'))m.trait='屡试不第';
    log('bad',`${m.name}赴${exam.name}落第，这是第${m.examFails}次名落孙山。`);toast(`${exam.name}落第，来年再读`);
  }
  save();renderAll();
}

function changeAssignment(id,value){
  const m=getMember(id);if(!m||!m.alive||!m.resident)return;
  if(m.onCaravan)return toast('商队尚未归来，不能另行分派');
  if(m.officeRank&&value!=='任官')return toast('在任官员须先去官才能改业');
  if(value==='著述'&&m.learning<55)return toast('学问达到55方可著述');
  m.assignment=value;m.manualAssignment=true;save();renderAll();toast(`${m.name}改为${value}`);
}

function filteredMembers(){
  return residents().filter(m=>{
    const generationOk=memberFilters.generation==='all'||String(m.generation)===memberFilters.generation;
    const assignmentOk=memberFilters.assignment==='all'||m.assignment===memberFilters.assignment;
    const ageOk=memberFilters.age==='all'||memberFilters.age==='child'&&m.age<16||memberFilters.age==='young'&&m.age>=16&&m.age<=40||memberFilters.age==='elder'&&m.age>40;
    return generationOk&&assignmentOk&&ageOk;
  }).sort((a,b)=>(a.id===state.headId?-1:b.id===state.headId?1:0)||a.generation-b.generation||b.age-a.age);
}

function setMemberFilter(key,value){
  if(!['generation','age','assignment'].includes(key))return;
  memberFilters[key]=value;memberPage=1;renderMembers();
}

function setMemberPage(page){memberPage=Math.max(1,page);renderMembers()}

function bulkAssignFiltered(){
  const target=$('bulkAssignment')?.value;if(!ASSIGNMENTS.includes(target))return;
  let changed=0,skipped=0;
  filteredMembers().forEach(m=>{
    if(m.officeRank||m.onCaravan||m.age<6||(target==='著述'&&m.learning<55)){skipped++;return}
    m.assignment=target;m.manualAssignment=true;changed++;
  });
  save();renderAll();toast(`已安排${changed}人${skipped?`，${skipped}人条件不合`:''}`);
}

function autoAssignFamily(){
  const candidates=residents().filter(m=>m.age>=16&&!m.officeRank&&!m.onCaravan),targets=workforceTargets(),counts={行商:residents().filter(m=>m.onCaravan).length};
  const scholarIds=new Set(candidates.slice().sort((a,b)=>(b.learning*.72+b.talent*.42+(b.sex==='男'&&b.bornInFamily?15:0))-(a.learning*.72+a.talent*.42+(a.sex==='男'&&a.bornInFamily?15:0))).filter(m=>m.learning>=30).slice(0,targets['读书']).map(m=>m.id));
  candidates.forEach(m=>{
    const next=scholarIds.has(m.id)?'读书':vocationalAssignment(m,counts);
    m.assignment=next;m.manualAssignment=true;counts[next]=(counts[next]||0)+1;
  });
  const summary=Object.entries(counts).map(([k,v])=>`${k}${v}人`).join('、');
  log('important',`家主重整族中分工：${summary}。`);save();renderAll();toast(`已按才分业，共安排${candidates.length}人`);
}

function transferOfficial(id,target){
  const m=getMember(id);if(!m?.officeRank)return;
  if(m.officeRank<=2)return toast('二品以上已入中枢，不再办理地方调任');
  if(m.officeYears<3)return toast('一任至少三年方可请调');
  if(target==='home'&&m.officeTrack==='本籍')return toast('此人已经在本籍任职');
  const cost=target==='home'?{silver:30,influence:8}:{silver:20,influence:5};
  if(!spend(cost))return toast(target==='home'?'请调回乡需银30两、人脉8':'谋求外任需银20两、人脉5');
  const oldPlace=m.officePlace;appointOfficial(m,m.officeRank,target);
  if(target==='home')addResource('reputation',2);else m.merit+=2;
  log('important',`${m.name}由${oldPlace}调任${m.officePlace}，转为${m.officeTrack}。`);save();renderAll();toast(`${m.name}已调任${m.officePlace}`);
}

function changeOfficialDuty(id,duty){
  const m=getMember(id);if(!m?.officeRank||!OFFICIAL_DUTIES[duty])return;
  m.officeDuty=duty;log('normal',`${m.name}在${m.officePlace}将任上重心改为“${duty}”。`);save();renderAll();toast(`${m.name}改办${duty}`);
}

function socializeOfficial(id,kind){
  const m=getMember(id);if(!m?.officeRank)return;
  if(m.lastSocialYear===state.year)return toast('此人本年已经进行过官场交际');
  const configs={fellow:{label:'宴请同年',roles:['同年'],cost:18},patron:{label:'拜望师长上官',roles:['座师','上官','部堂前辈'],cost:34},gentry:{label:'会晤地方士绅',roles:['地方士绅'],cost:24}},config=configs[kind];if(!config)return;
  const contacts=m.officialContacts.filter(c=>config.roles.includes(c.role));if(!contacts.length)return toast('当前任地没有对应人脉');
  if(!spend({silver:config.cost}))return toast(`${config.label}需银${config.cost}两`);
  contacts.forEach(c=>c.bond=clamp(c.bond+9+Math.random()*6,0,100));m.lastSocialYear=state.year;addResource('influence',1.5);
  const main=contacts.sort((a,b)=>b.bond-a.bond)[0];
  if(main.camp==='清议')addResource('reputation',2);else if(main.camp==='实务')m.merit+=2;else if(main.camp==='权门')addResource('favor',2.5);else addResource('influence',1);
  if(m.integrity<45&&kind==='patron')addResource('reputation',-1);
  log('normal',`${m.name}${config.label}，与${main.role}${main.name}的交情升至${Math.floor(main.bond)}。`);save();renderAll();toast(`${config.label}完成`);
}

function tradeGrain(type,amount){
  const quote=state.market||marketQuote(state.year,state.climate,state.region);
  if(amount==='surplus')amount=Math.floor(Math.max(0,state.resources.grain-residents().length*18)/100)*100;
  amount=Number(amount);if(!amount||amount<100)return toast('当前没有可成批交易的余粮');
  if(type==='sell'){
    if(state.resources.grain<amount)return toast(`存粮不足${amount}石`);
    const silver=Math.floor(amount/100*quote.sellPer100);state.resources.grain-=amount;state.resources.silver+=silver;
    log('normal',`族中趁本年粮价售出${amount}石，得银${silver}两。`);toast(`售粮得银${silver}两`);
  }else{
    const silver=Math.ceil(amount/100*quote.buyPer100);if(state.resources.silver<silver)return toast(`购粮需银${silver}两`);
    state.resources.silver-=silver;state.resources.grain+=amount;log('normal',`族中从粮市购入${amount}石，支银${silver}两。`);toast(`购入${amount}石粮`);
  }
  save();renderAll();
}

function setHeir(id){
  const m=getMember(id),h=head();if(!m||!m.alive||!m.bornInFamily||!m.resident||m.id===h?.id||m.age<10)return;
  state.members.forEach(x=>x.designated=false);m.designated=true;state.heirId=m.id;state.values.unity=clamp(state.values.unity-1,0,100);
  log('important',`${h?.name||'家主'}在宗祠中立${m.name}为宗子，日后承掌门户。`);save();renderAll();
}

function makeMarriageCandidate(member,index){
  const sex=member.sex==='男'?'女':'男',age=clamp(member.age-3+Math.floor(Math.random()*7),18,42);
  const rank=currentRank(),score=familyScore();
  const houses=[
    {type:'寒素良家',desc:'门第不显，人口清白',weight:0,dowry:24,cost:18,prestige:2,influence:1,stats:[36,32,48,30],trait:'勤俭'},
    {type:'书香门第',desc:'家中有生员与藏书',weight:90,dowry:45,cost:38,prestige:6,influence:4,stats:[62,24,48,30],trait:'聪颖'},
    {type:'县中吏族',desc:'熟悉衙门，姻亲众多',weight:180,dowry:55,cost:52,prestige:7,influence:10,stats:[46,30,63,47],trait:'圆融'},
    {type:'富商之家',desc:'陪嫁丰厚，士林清议不高',weight:130,dowry:145,cost:48,prestige:2,influence:5,stats:[38,26,55,72],trait:'善经营'},
    {type:'武勋门第',desc:'族中有人领兵任职',weight:300,dowry:65,cost:68,prestige:12,influence:9,stats:[35,70,52,32],trait:'骁勇'},
    {type:'郡望旁支',desc:'谱系体面，往来皆是士绅',weight:520,dowry:80,cost:105,prestige:18,influence:14,stats:[67,36,58,40],trait:'持重'},
    {type:'京官世家',desc:'朝中有人，婚书也是投名状',weight:850,dowry:120,cost:170,prestige:28,influence:22,stats:[72,42,65,48],trait:'圆融'}
  ];
  const available=houses.filter(h=>score>=h.weight*.55);let house=pick(available.length?available:houses.slice(0,2));
  if(index===0)house=available[Math.max(0,available.length-1)]||houses[1];
  const surname=pick(FAMILY_SURNAMES.filter(s=>s!==state.surname)),name=surname+pick(GIVEN_END)+pick(GIVEN_END);
  const uxorilocal=member.sex==='女'&&index===2;
  if(uxorilocal)house={type:'寒门赘婿',desc:'愿入赘承嗣，门第助力有限',weight:0,dowry:8,cost:35,prestige:1,influence:0,stats:[55,35,52,34],trait:'持重'};
  return{name,sex,age,house:house.type,desc:house.desc,dowry:house.dowry,cost:house.cost,prestige:house.prestige,influence:house.influence,learning:house.stats[0],martial:house.stats[1],management:house.stats[2],business:house.stats[3],trait:house.trait,uxorilocal,rank:rank.name};
}

function eligibleForMarriage(m){return m.alive&&m.bornInFamily&&m.resident&&!m.onCaravan&&!m.spouseId&&m.age>=18&&m.age<=42}
function openMarriage(id){
  const m=getMember(id);if(!m||!eligibleForMarriage(m))return toast('此人当前不宜议亲');
  marriageMemberId=m.id;marriageCandidates=[0,1,2].map(i=>makeMarriageCandidate(m,i));$('marriageTitle').textContent=`为${m.name}议亲`;
  $('marriageOptions').innerHTML=marriageCandidates.map((c,i)=>`<article class="candidate"><span class="candidate-house">${esc(c.house)}${c.uxorilocal?' · 入赘':''}</span><h3>${esc(c.name)}</h3><p>${c.age}岁 · ${esc(c.trait)}<br>${esc(c.desc)}</p><div class="badges"><span class="badge">学${Math.floor(c.learning)}</span><span class="badge">治${Math.floor(c.management)}</span><span class="badge gold">人脉＋${c.influence}</span></div><p>${m.sex==='男'?`陪嫁约${c.dowry}两，婚礼需${c.cost}两`:`本家备嫁资${c.cost}两${c.uxorilocal?'，子女承本姓':'，女子出阁'}`}</p><button class="btn primary" onclick="chooseMarriage(${i})">交换婚书</button></article>`).join('');
  $('marriageOverlay').classList.remove('hidden');
}
function closeMarriage(){$('marriageOverlay').classList.add('hidden');marriageMemberId=null;marriageCandidates=[]}
function chooseMarriage(index){
  const m=getMember(marriageMemberId),c=marriageCandidates[index];if(!m||!c||!eligibleForMarriage(m))return closeMarriage();
  if(!spend({silver:c.cost}))return toast(`婚礼与妆奁需银${c.cost}两`);
  const spouse=makeMember({name:c.name,sex:c.sex,age:c.age,birthYear:state.year-c.age,generation:m.generation,branch:m.branch,spouseId:m.id,bornInFamily:false,resident:m.sex==='男'||c.uxorilocal,marriedOut:m.sex==='女'&&!c.uxorilocal,uxorilocal:c.uxorilocal,health:75+Math.random()*14,learning:c.learning,martial:c.martial,management:c.management,business:c.business,integrity:52+Math.random()*20,talent:48+Math.random()*20,trait:c.trait,assignment:c.sex==='男'?(c.learning>55?'读书':'经商'):'掌家',relation:`${c.house}姻亲`});
  m.spouseId=spouse.id;m.uxorilocal=c.uxorilocal;
  if(m.sex==='女'&&!c.uxorilocal){m.marriedOut=true;m.resident=false;m.assignment='闲居'}
  state.members.push(spouse);state.alliances.push({year:state.year,memberId:m.id,member:m.name,spouse:c.name,house:c.house,value:c.prestige+c.influence,uxorilocal:c.uxorilocal});
  if(m.sex==='男')addResource('silver',c.dowry);addResource('prestige',c.prestige*(state.policy==='通婚'?1.25:1));addResource('influence',c.influence*(state.policy==='通婚'?1.3:1));state.values.unity=clamp(state.values.unity+2,0,100);
  log('important',`${m.name}与${c.house}${c.name}成婚${c.uxorilocal?'，男方入赘本家承嗣':m.sex==='女'?'，自此出阁':'，新妇入门'}。`);closeMarriage();save();renderAll();
}

function buyAsset(type){
  const a=state.assets;let cost=0,label='',gain=0;
  if(type==='fields'){cost=Math.round((88+a.fields*1.25)*(state.policy==='置业'?.9:1));label='田地';gain=10}
  if(type==='shops'){cost=230+a.shops*75;label='商铺';gain=1}
  if(type==='workshops'){cost=190+a.workshops*55;label='作坊';gain=1}
  if(type==='granaries'){cost=160+a.granaries*70;label='粮仓';gain=1}
  if(type==='houses'){cost=280+a.houses*110;label='宅院';gain=1}
  if(!spend({silver:cost}))return toast(`置办${label}需银${cost}两`);
  a[type]+=gain;addResource('prestige',type==='fields'?2:4);state.values.enterprise=clamp(state.values.enterprise+1,0,100);
  log('normal',`族中支银${cost}两，添置${label}${gain}${type==='fields'?'十亩':'处'}。`);save();renderAll();
}

function upgradeProject(key){
  const p=PROJECTS[key],level=state.projects[key];if(!p||level>=4)return toast('此项家业已经修至最高');
  const cost=Math.round(p.base*(1+level*.72)),grain=key==='ancestral'||key==='charity'?70+level*55:0;
  if(state.resources.silver<cost||state.resources.grain<grain)return toast(`需银${cost}两${grain?`、粮${grain}石`:''}`);
  state.resources.silver-=cost;state.resources.grain-=grain;state.projects[key]++;addResource('prestige',8+level*6);
  if(key==='academy'||key==='library')state.values.learning=clamp(state.values.learning+4,0,100);
  if(key==='ancestral'||key==='genealogy')state.values.unity=clamp(state.values.unity+4,0,100);
  if(key==='charity')addResource('reputation',8);
  log('important',`${p.name}修至第${level+1}阶，成为${state.surname}氏新的百年家业。`);save();renderAll();
}

function familyAction(type){
  if(type==='rite'){
    if(state.resources.silver<25||state.resources.grain<80)return toast('祭祖需银25两、粮80石');state.resources.silver-=25;state.resources.grain-=80;state.values.unity=clamp(state.values.unity+4,0,100);addResource('prestige',3);log('normal','全族依昭穆祭祖，在祠堂共食议事，几房旧怨稍解。');
  }else if(type==='relief'){
    if(state.resources.grain<220)return toast('赈济需粮220石');state.resources.grain-=220;addResource('reputation',12);addResource('prestige',4);log('good',`${state.surname}氏在乡里设粥赈济，清望渐隆。`);
  }else if(type==='school'){
    if(state.resources.silver<70)return toast('延师课子需银70两');state.resources.silver-=70;residents().filter(m=>!m.onCaravan&&m.age>=6&&m.age<=22).forEach(m=>m.learning=clamp(m.learning+3,0,100));state.values.learning=clamp(state.values.learning+1,0,100);log('normal','族中延师开讲一季，年轻子弟的经义都有进益。');
  }
  save();renderAll();
}

function openPolicy(forced=false){
  const early=state.year-state.lastPolicyYear<10&&!forced&&!state.pendingEvent;
  $('policyTitle').textContent=early?'临时改议族策':'下一个十年的宗族定策';
  $('policyOptions').innerHTML=Object.entries(POLICIES).map(([name,p])=>`<button class="policy-option" onclick="choosePolicy('${name}',${early})"><b>${name}${state.policy===name?' · 现行':''}</b><small>${p.desc}<br>${p.effect}${early?'；提前改策另耗银40两':''}</small></button>`).join('');
  $('policyOverlay').classList.remove('hidden');
}
function closePolicy(){if(state.pendingEvent?.id==='decade')return toast('十年族议尚未定策');$('policyOverlay').classList.add('hidden')}
function choosePolicy(name,early=false){
  if(!POLICIES[name])return;if(early&&!spend({silver:40}))return toast('提前改策需银40两');
  state.policy=name;state.lastPolicyYear=state.year;if(state.pendingEvent?.id==='decade')state.pendingEvent=null;
  log('important',`宗祠议定未来十年以“${name}”为族策：${POLICIES[name].desc}`);$('policyOverlay').classList.add('hidden');save();renderAll();
}

function exportSave(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`${state.surname}氏百年门第_第${state.year}年.json`;a.click();URL.revokeObjectURL(url);toast('存档已导出');
}
function importSave(event){
  const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{state=migrate(JSON.parse(reader.result));save();enterGame();renderAll();if(state.pendingEvent)showPendingEvent();toast('存档导入成功')}catch(e){toast('这不是有效的百年门第存档')}finally{event.target.value=''}};reader.readAsText(file,'utf-8');
}
function resetGame(){
  if(!confirm('确定另开宗族？当前浏览器存档将被清除，请先导出需要保留的存档。'))return;
  localStorage.removeItem(STORAGE_KEY);location.reload();
}

function renderAll(){
  if(!state)return;
  const era=eraInfo();$('eraLine').textContent=`${era.dynasty} · ${era.title}${era.regnal}年 · 家历第${state.year}年`;
  $('familyTitle').textContent=`${state.region} · ${state.surname}氏门第`;
  $('familySubtitle').textContent=`${state.origin}起家 · 祖训“${state.precept}” · ${currentRank().name}`;
  renderResources();
  const renderers={overview:renderOverview,map:renderMap,members:renderMembers,genealogy:renderGenealogy,career:renderCareer,marriage:renderMarriageTab,estate:renderEstate,ancestral:renderAncestral,chronicle:renderChronicle};
  (renderers[activeTab]||renderOverview)();renderSide();
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===activeTab));
}

function renderResources(){
  const r=state.resources,items=[
    ['year','家历',`第${state.year}年`,false],['population','在籍人口',`${residents().length}人`,residents().length<2],['silver','现银',`${fmt(r.silver)}两`,r.silver<30],
    ['grain','存粮',`${fmt(r.grain)}石`,r.grain<residents().length*18],['fields','田亩',`${fmt(state.assets.fields)}亩`,false],['score','族望',fmt(familyScore()),false],
    ['reputation','清望',fmt(r.reputation),r.reputation<5],['influence','人脉',fmt(r.influence),false],['favor','圣眷',fmt(r.favor),false]
  ];
  $('resourceBar').innerHTML=items.map(x=>`<button class="resource ${x[3]?'danger':''}" onclick="openValueGuide('${x[0]}')" aria-label="查看${x[1]}用途"><span>${x[1]} <i>?</i></span><b>${x[2]}</b></button>`).join('');
}

function renderOverview(){
  const rank=currentRank(),next=nextRank(),score=familyScore(),h=head(),report=state.lastYearReport;
  const goals=goalList();
  $('mainView').innerHTML=`
    <div class="section-head"><div><h2>家门总览</h2><p>世家的根基不只是一张官帖。田庄供养读书，婚盟托举仕途，清望又在灾年保住人心。</p></div><div class="section-actions"><button class="btn small" onclick="familyAction('school')">延师课子</button><button class="btn small jade" onclick="familyAction('rite')">合族祭祖</button></div></div>
    <div class="hero-grid">
      <section class="family-rank" data-mark="${esc(state.surname)}"><span class="rank-label">当前门第</span><div class="rank-name">${rank.name}</div><p class="rank-copy">${rank.copy}</p><div class="rank-progress"><span>${score}</span><div class="bar gold"><i style="width:${next?clamp((score-rank.score)/(next.score-rank.score)*100,2,100):100}%"></i></div><span>${next?`${next.name} ${next.score}`:'门第已极'}</span></div></section>
      <section class="patriarch-card portrait-patriarch">${h?`<button class="portrait-button patriarch-portrait" onclick="openMemberDossier(${h.id})" aria-label="查看${esc(h.name)}人物卷宗">${portraitSvg(h)}</button>`:''}<div class="patriarch-copy"><span class="rank-label">本代家主</span><h3>${h?`<button class="name-link" onclick="openMemberDossier(${h.id})">${esc(h.name)}</button>`:'宗房无人'}</h3><p>${h?`${h.age}岁 · ${h.exam}${h.officeRank?` · ${OFFICES[h.officeRank]}`:''}<br>${esc(h.trait)} · ${esc(h.assignment)}`:'族中尚未推举新主'}</p><div class="patriarch-stats"><button class="tiny-stat" onclick="openValueGuide('learning',${h?.id||0})"><b>${h?Math.floor(h.learning):'-'}</b><span>学问</span></button><button class="tiny-stat" onclick="openValueGuide('management',${h?.id||0})"><b>${h?Math.floor(h.management):'-'}</b><span>治事</span></button><button class="tiny-stat" onclick="openValueGuide('integrity',${h?.id||0})"><b>${h?Math.floor(h.integrity):'-'}</b><span>操守</span></button></div></div></section>
    </div>
    <section class="system-hooks"><div class="hook-title"><span>门第诸务</span><small>每一项数值都有去处，点击直接进入对应系统</small></div><div>${systemHooks()}</div></section>
    <div class="panel-grid">
      <section class="panel"><h3>立族长志</h3><ul class="goal-list">${goals.map(g=>`<li class="${g.done?'done':''}">${g.text}</li>`).join('')}</ul></section>
      <section class="panel"><h3>去年账略</h3><ul class="plain-list"><li class="row-between"><span>田庄收成</span><b>${fmt(report.harvest)}石</b></li><li class="row-between"><span>全年口粮</span><b>－${fmt(report.consumption)}石</b></li><li class="row-between"><span>产业与俸禄</span><b>${fmt(report.income)}两</b></li><li class="row-between"><span>家用与束脩</span><b>－${fmt(report.expense)}两</b></li></ul><p class="panel-copy">账面丰厚不等于安全：改朝换代时，官位可能归零，只有田亩、宗族和清望能留下。</p></section>
      <section class="panel"><h3>近年家事</h3>${renderMiniLogs(5)}</section>
      <section class="panel"><h3>朝局与地方</h3><p class="panel-copy"><b class="red">${state.climate}</b>　${CLIMATES[state.climate].desc}<br><br><b>${state.region}</b>　${REGIONS[state.region].desc}<br><br>本轮族策：<b class="jade-text">${state.policy}</b>，尚余约${Math.max(0,10-(state.year-state.lastPolicyYear))}年再议。</p></section>
    </div>`;
}

function systemHooks(){
  const examReady=residents().filter(m=>m.sex==='男'&&m.bornInFamily&&nextExam(m)&&examStatus(m)===`可应${nextExam(m).name}`).length;
  const unassigned=residents().filter(m=>m.age>=16&&!m.officeRank&&!m.onCaravan&&m.assignment==='闲居').length;
  const halls=Object.values(state.regional||{}).filter(x=>x.hall).length,active=(state.caravans||[]).filter(c=>c.status==='traveling').length;
  const hooks=[
    ['产业账房',`${fmt(state.resources.silver)}两现银 · ${fmt(state.resources.grain)}石粮`,`粮市、置业与商队`,"estate"],
    ['族人分业',unassigned?`${unassigned}名成年族人闲居`:`${residents().length}人在籍`,`按才安排真实产出`,"members"],
    ['科举官途',examReady?`${examReady}人本年可应试`:`${residents().filter(m=>m.assignment==='读书').length}名读书人`,`科名、任地与官场关系`,"career"],
    ['天下舆图',`${halls}处会馆 · ${active}支商队`,`经营区域人脉与商情`,"map"]
  ];
  return hooks.map(([name,value,copy,tab])=>`<button class="system-hook" onclick="switchTab('${tab}')"><span>${name}</span><b>${value}</b><small>${copy}</small><i>进入</i></button>`).join('');
}

function renderMap(){
  if(!REGIONS[selectedMapRegion])selectedMapRegion=state.region;
  const layout=[
    {name:'北地',path:'M320 50 Q410 18 520 58 L575 150 L493 205 L354 177 L278 113Z',x:423,y:112},
    {name:'中州',path:'M297 157 L354 177 L493 205 L514 300 L393 342 L280 282 L241 217Z',x:381,y:246},
    {name:'巴蜀',path:'M120 216 L241 217 L280 282 L246 392 L117 372 L61 292Z',x:174,y:292},
    {name:'江南',path:'M393 342 L514 300 L657 333 L695 418 L575 478 L436 443Z',x:533,y:386},
    {name:'岭南',path:'M246 392 L393 342 L436 443 L368 505 L229 486 L178 432Z',x:326,y:428}
  ];
  const profile=regionProfile(selectedMapRegion),region=REGIONS[selectedMapRegion],officials=regionOfficials(selectedMapRegion),caravans=regionCaravans(selectedMapRegion),quote=marketQuote(state.year,state.climate,selectedMapRegion);
  const networkCost=50+Math.floor(profile.relations*.45),networkDone=profile.lastNetworkYear===state.year,intelCost=30+profile.intel*24,intelDone=profile.lastIntelYear===state.year;
  const tradeLines=layout.filter(x=>x.name!==state.region).map(x=>{
    const start=layout.find(n=>n.name===state.region),active=regionCaravans(x.name).length||regionProfile(x.name).hall;
    return`<path class="trade-line ${active?'active':''}" d="M${start.x} ${start.y} Q${(start.x+x.x)/2} ${Math.min(start.y,x.y)-45} ${x.x} ${x.y}"/>`;
  }).join('');
  const nodes=layout.map(node=>{
    const p=regionProfile(node.name),oc=regionOfficials(node.name).length,cc=regionCaravans(node.name).length,selected=node.name===selectedMapRegion,home=node.name===state.region;
    return`<g class="map-region ${selected?'selected':''} ${home?'home':''}" role="button" tabindex="0" onclick="selectMapRegion('${node.name}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectMapRegion('${node.name}')}" aria-label="查看${node.name}"><path class="map-land" d="${node.path}"/><circle class="map-node" cx="${node.x}" cy="${node.y}" r="27"/><path class="map-roof" d="M${node.x-18} ${node.y-2} L${node.x} ${node.y-18} L${node.x+18} ${node.y-2} M${node.x-13} ${node.y-2} V${node.y+14} H${node.x+13} V${node.y-2}"/><text class="map-label" x="${node.x}" y="${node.y+48}" text-anchor="middle">${node.name}</text><text class="map-small" x="${node.x}" y="${node.y+64}" text-anchor="middle">关系 ${Math.floor(p.relations)}${p.hall?' · 会馆':''}</text>${home?`<text class="map-home" x="${node.x+33}" y="${node.y-22}">本籍</text>`:''}${oc?`<g class="map-counter official" transform="translate(${node.x+28} ${node.y+10})"><circle r="12"/><text y="4" text-anchor="middle">官${oc}</text></g>`:''}${cc?`<g class="map-counter caravan" transform="translate(${node.x-30} ${node.y+12})"><circle r="12"/><text y="4" text-anchor="middle">商${cc}</text></g>`:''}</g>`;
  }).join('');
  const officialList=officials.length?officials.map(m=>`<button class="map-person" onclick="openMemberDossier(${m.id})"><span>${portraitSvg(m)}</span><b>${esc(m.name)}</b><small>${esc(m.officePlace)} · ${esc(OFFICES[m.officeRank])}</small></button>`).join(''):'<p class="map-empty">此地暂无本族官员，调任或新授官职后会显示在舆图。</p>';
  const caravanList=caravans.length?caravans.map(c=>`<div class="map-caravan"><b>${esc(CARAVAN_ROUTES[c.routeId]?.name||'商队')}</b><span>${esc(c.leader)}领队 · 家历${c.dueYear}年归</span></div>`).join(''):'<p class="map-empty">此地暂无在途商队。商情与会馆仍会保留，等待下次远行。</p>';
  $('mainView').innerHTML=`<div class="section-head map-section-head"><div><h2>天下舆图</h2><p>官员任地、商队路线与地方关系不再是三张孤立表格。点击郡域，直接经营本族在当地的根脚。</p></div><div class="map-legend"><span><i class="legend-home"></i>本籍</span><span><i class="legend-official"></i>在任</span><span><i class="legend-caravan"></i>商队</span></div></div><div class="map-layout"><section class="world-map"><svg viewBox="0 0 760 540" aria-label="大晟五地互动舆图"><rect class="map-paper" width="760" height="540" rx="12"/><path class="map-mountain" d="M55 82 l38 -52 l31 42 l25 -31 l38 56 M610 92 l36 -47 l28 34 l29 -36 l31 51"/><path class="map-river" d="M558 35 C487 123 583 190 504 254 S409 316 401 386 S352 480 281 529"/>${tradeLines}${nodes}<g class="map-compass" transform="translate(685 470)"><circle r="34"/><path d="M0-26 L8-4 L0 26 L-8-4Z"/><text x="0" y="-39" text-anchor="middle">北</text></g></svg><div class="map-caption"><span>天下五地</span><b>${state.climate}</b><small>${CLIMATES[state.climate].desc}</small></div></section><aside class="region-scroll"><div class="region-heading"><span class="guide-tag">${selectedMapRegion===state.region?'本籍':'异地'}</span><h3>${selectedMapRegion}</h3><p>${region.desc}</p></div><div class="region-metrics"><button onclick="openValueGuide('influence')"><span>地方关系</span><b>${Math.floor(profile.relations)}</b></button><div><span>商情</span><b>${profile.intel}/3</b></div><div><span>粮价</span><b>${quote.sellPer100}/${quote.buyPer100}</b></div><div><span>会馆</span><b>${profile.hall?'已设':'未设'}</b></div></div><div class="region-bonuses"><span>田产 ×${region.yield.toFixed(2)}</span><span>商贸 ×${region.trade.toFixed(2)}</span><span>读书 ×${region.study.toFixed(2)}</span><span>康健 ×${region.health.toFixed(2)}</span></div><section class="region-people"><h4>本族在任 · ${officials.length}</h4><div>${officialList}</div></section><section><h4>在途商队 · ${caravans.length}</h4>${caravanList}</section><div class="region-actions"><button class="btn jade" ${networkDone?'disabled':''} onclick="regionalAction('network')">${networkDone?'本年乡望已经营':`经营乡望 · ${networkCost}两`}</button><button class="btn gold" ${intelDone||profile.intel>=3?'disabled':''} onclick="regionalAction('intel')">${profile.intel>=3?'商情已尽知':intelDone?'本年已探商情':`探听商情 · ${intelCost}两`}</button><button class="btn primary" ${profile.hall?'disabled':''} onclick="regionalAction('hall')">${profile.hall?'会馆已立':'设立会馆 · 260两＋120石'}</button><small>每级商情提高商队成功约1.8%、利润3.5%；会馆再提高成功6.5%、利润7%。设馆需地方关系25或本族官员在任。</small></div></aside></div>`;
}

function goalList(){
  const members=state.members.filter(m=>m.bornInFamily),maxRank=Math.min(...members.filter(m=>m.officeRank).map(m=>m.officeRank).concat([99]));
  return[
    {text:'族中培养出第一名秀才',done:members.some(m=>EXAM_ORDER.indexOf(m.exam)>=2)},
    {text:'置办一百亩可传之田',done:state.assets.fields>=100},
    {text:'族学与藏书楼皆有规模',done:state.projects.academy>=1&&state.projects.library>=1},
    {text:'结成三门稳固姻亲',done:state.alliances.length>=3},
    {text:'一代人金榜题名成为进士',done:members.some(m=>m.exam==='进士')},
    {text:'族人官至正五品以上',done:maxRank<=5},
    {text:'宗谱传至第五代',done:Math.max(...members.map(m=>m.generation),1)>=5},
    {text:'跻身簪缨世家',done:familyScore()>=900}
  ];
}

function renderMiniLogs(count){
  const logs=state.logs.slice(0,count);if(!logs.length)return'<div class="empty"><b>尚无记载</b>过一年后，家事会记入年谱。</div>';
  return`<ul class="log-list">${logs.map(l=>`<li class="${l.type}"><time>${eraShort(l.year)}</time>${esc(l.text)}</li>`).join('')}</ul>`;
}
function eraShort(year){const e=eraInfo(year);return`${e.title}${e.regnal}年`}

function roleLabel(m){
  if(!m.alive)return'已故';if(m.id===state.headId)return'家主';if(m.id===state.heirId)return'宗子';
  if(m.officeRank)return OFFICES[m.officeRank];if(m.onCaravan)return'商队领队';if(m.exam!=='白身')return m.honor||m.exam;if(!m.bornInFamily)return m.relation;return m.assignment;
}

function switchTab(tab){
  if(!['overview','map','members','genealogy','career','marriage','estate','ancestral','chronicle'].includes(tab))tab='overview';
  activeTab=tab;renderAll();
  requestAnimationFrame(()=>$('mainView')?.scrollIntoView({behavior:'smooth',block:'start'}));
}

function guideCurrentValue(key,memberId=0){
  const m=memberId?getMember(memberId):null,r=state.resources;
  const values={year:`第${state.year}年`,population:`${residents().length}人`,silver:`${fmt(r.silver)}两`,grain:`${fmt(r.grain)}石`,fields:`${fmt(state.assets.fields)}亩`,score:fmt(familyScore()),reputation:fmt(r.reputation),influence:fmt(r.influence),favor:fmt(r.favor),learning:m?Math.floor(m.learning):Math.floor(state.values.learning),management:m?Math.floor(m.management):'人物属性',business:m?Math.floor(m.business):'人物属性',martial:m?Math.floor(m.martial):Math.floor(state.values.martial),health:m?Math.floor(m.health):'人物属性',integrity:m?Math.floor(m.integrity):Math.floor(state.values.integrity),familyLearning:Math.floor(state.values.learning),unity:Math.floor(state.values.unity),enterprise:Math.floor(state.values.enterprise),familyMartial:Math.floor(state.values.martial)};
  return values[key]??'—';
}

function openValueGuide(key='score',memberId=0){
  const guide=VALUE_GUIDES[key]||VALUE_GUIDES.score,member=memberId?getMember(memberId):null;
  $('valueTitle').textContent=guide.title;
  $('valueGuideBody').innerHTML=`<div class="value-summary"><div><span class="guide-tag">${esc(guide.tag)}</span><b>${esc(guideCurrentValue(key,memberId))}</b>${member?`<small>${esc(member.name)}的当前数值</small>`:''}</div><p>${esc(guide.desc)}</p></div><div class="guide-columns"><section><h3>现在能做什么</h3><ul>${guide.uses.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section><h3>主要怎么获得</h3><ul>${guide.sources.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section></div><div class="value-guide-actions"><button class="btn primary" onclick="closeValueGuide();switchTab('${guide.tab}')">前往相关系统</button></div><div class="value-index"><b>继续查阅</b><div>${Object.entries(VALUE_GUIDES).map(([id,v])=>`<button class="value-index-button ${id===key?'on':''}" onclick="openValueGuide('${id}')">${esc(v.title)}</button>`).join('')}</div></div>`;
  $('valueOverlay').classList.remove('hidden');
}

function closeValueGuide(){$('valueOverlay').classList.add('hidden')}

function portraitSvg(m,large=false){
  if(m.relation==='开族之祖')return`<img class="portrait-art ${large?'large':''}" src="assets/portraits/founder-patriarch.webp" alt="${esc(m.name)}开族者半身立绘" decoding="async">`;
  const seed=String(m.id||m.name).split('').reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,17);
  const robes=['#465f59','#7b3c32','#50617a','#6f573d','#4f6a47','#73586a'],accents=['#b78b45','#9d4d3f','#496d65','#c0a165'];
  const robe=robes[seed%robes.length],accent=accents[(seed>>3)%accents.length],paper=['#e9dfc8','#dce3d4','#e2d7ca'][seed%3];
  const official=m.officeRank,scholar=EXAM_ORDER.indexOf(m.exam)>=2||m.assignment==='读书'||m.assignment==='著述',merchant=m.assignment==='经商'||m.onCaravan,warrior=m.assignment==='习武'||m.martial>=65;
  const gray=m.age>=58?'#8d887e':'#201d1a',female=m.sex==='女';
  const face=m.age<12?'#e8cdb2':'#d9b596';
  const hair=female?`<path d="M77 111 Q82 46 120 39 Q158 45 164 112 L151 94 Q149 154 120 160 Q89 153 87 94Z" fill="${gray}"/><ellipse cx="151" cy="51" rx="18" ry="14" fill="${gray}"/><path d="M148 37 l7 -13 l6 14" fill="none" stroke="${accent}" stroke-width="4"/><circle cx="162" cy="37" r="4" fill="${accent}"/>`:`<path d="M81 105 Q81 50 120 40 Q159 49 159 105 L146 83 Q119 70 92 84Z" fill="${gray}"/>`;
  const hat=official?`<path d="M76 57 Q120 38 164 57 L158 73 L82 73Z" fill="#24201c"/><rect x="103" y="31" width="34" height="27" rx="4" fill="#29241f"/><path d="M76 58 L48 49 M164 58 L192 49" stroke="#29241f" stroke-width="8"/>`:'';
  const accessory=merchant?`<g transform="translate(151 210)"><rect x="0" y="0" width="48" height="34" rx="3" fill="#b99458" stroke="#593e27"/><path d="M7 8h34M7 17h34M7 26h34M15 5v25M28 5v25" stroke="#6c492b" stroke-width="2"/></g>`:warrior?`<path d="M175 266 L205 141" stroke="#62462f" stroke-width="8"/><path d="M198 150 l14 6 l-20 14" fill="${accent}"/>`:scholar?`<g transform="translate(148 219) rotate(-8)"><rect width="55" height="43" fill="#e8dec8" stroke="#77654e"/><path d="M27 3v37M7 12h14M34 12h14M7 21h14M34 21h14" stroke="#8e3d34" stroke-width="2"/></g>`:'';
  const ageLines=m.age>=45?'<path d="M95 121 q8 4 14 0 M132 121 q8 4 14 0 M113 147 q7 3 14 0" stroke="#996f59" stroke-width="1.4" fill="none" opacity=".72"/>':'';
  const ornament=female&&!official?`<path d="M80 73 q40 -29 80 0" fill="none" stroke="${accent}" stroke-width="4"/><circle cx="82" cy="72" r="5" fill="${accent}"/>`:'';
  return`<svg class="portrait-art ${large?'large':''}" viewBox="0 0 240 300" role="img" aria-label="${esc(m.name)}半身立绘"><rect width="240" height="300" fill="${paper}"/><circle cx="183" cy="62" r="32" fill="#c8ad77" opacity=".3"/><path d="M0 116 Q38 79 78 113 T160 108 T240 93 V190 H0Z" fill="#6d7968" opacity=".16"/><path d="M0 146 Q45 112 96 146 T190 133 T240 144" fill="none" stroke="#54645b" stroke-width="3" opacity=".3"/><path d="M24 300 Q34 205 82 186 Q120 172 158 187 Q207 208 218 300Z" fill="${robe}"/><path d="M86 187 L120 232 L154 187 Q140 173 120 172 Q100 174 86 187Z" fill="#f0e4cf"/><path d="M113 158 h14 v28 h-14z" fill="${face}"/><ellipse cx="120" cy="112" rx="39" ry="52" fill="${face}"/>${hair}${hat}${ornament}<path d="M94 108 q9 -6 18 0 M129 108 q9 -6 18 0" stroke="#352b25" stroke-width="3" fill="none"/><circle cx="105" cy="111" r="2.5" fill="#29221f"/><circle cx="137" cy="111" r="2.5" fill="#29221f"/><path d="M116 126 q4 3 8 0 M107 143 q13 8 27 0" stroke="#85594a" stroke-width="2" fill="none"/>${ageLines}<path d="M120 232 L120 300 M91 193 Q106 212 120 232 Q135 210 151 193" stroke="${accent}" stroke-width="5" fill="none"/>${accessory}<rect x="11" y="245" width="24" height="43" fill="none" stroke="#8a2824" stroke-width="2"/><text x="23" y="260" text-anchor="middle" font-size="10" fill="#8a2824" writing-mode="tb">${esc(state.surname)}氏</text></svg>`;
}

function memberContribution(m){
  if(m.officeRank){const duty=OFFICIAL_DUTIES[m.officeDuty],salary=Math.round(OFFICE_SALARY[m.officeRank]*(OFFICE_TRACKS[m.officeTrack]?.salary||1));return`${m.officePlace}任${OFFICES[m.officeRank]}，每年约入俸${salary}两；主办“${m.officeDuty}”，${duty?.desc||'积累任上考成'}。`}
  if(m.onCaravan)return`正领商队前往${esc((state.caravans||[]).find(c=>c.id===m.caravanId)?.target||'外地')}，经营与治事共同影响归航结果。`;
  const map={读书:`每年增长学问；${m.age>22&&m.learning>=50?'同时可授徒补贴家用':'达到考试门槛后可应试'}。`,习武:'每年增长武艺，为护庄、征役与军功事件提供主力。',务农:`每年为田庄额外贡献约${Math.floor(4+m.management*.05)}石收成，并提高治事。`,经商:`每年约入银${Math.floor(4+m.business*.14)}两；经营达到25可领商队。`,掌家:`以治事降低全族口粮损耗，当前个人可提供约${(m.management*.08).toFixed(1)}%的管理权重。`,行医:'每年获得少量诊金、改善自身健康，并有机会增加清望。',著述:'学问达到55后可著书立说，增加藏书与清望。',闲居:'目前没有稳定产出，可根据天资安排读书、务农、经商、掌家、习武、行医或著述。'};
  return map[m.assignment]||'当前事务尚无稳定产出。';
}

function openMemberDossier(id){
  const m=getMember(id);if(!m)return;
  dossierMemberId=m.id;$('memberDossierTitle').textContent=m.name;
  const spouse=getMember(m.spouseId),parents=m.parentIds.map(pid=>getMember(pid)?.name).filter(Boolean).join('、');
  const stats=[['learning','学问',m.learning],['management','治事',m.management],['business','经营',m.business],['martial','武艺',m.martial],['integrity','操守',m.integrity],['health','健康',m.health]];
  $('memberDossierBody').innerHTML=`<div class="dossier-layout"><div class="portrait-stage">${portraitSvg(m,true)}<span>${esc(roleLabel(m))}</span></div><div class="dossier-copy"><div class="dossier-badges"><span class="badge red">第${m.generation}代</span><span class="badge">${esc(m.branch)}</span><span class="badge gold">${esc(m.exam)}</span><span class="badge jade">${esc(m.trait)}</span></div><p class="dossier-lead">${m.sex} · ${m.age}岁 · ${m.alive?'在籍':'已故'}${parents?`<br>父母：${esc(parents)}`:''}${spouse?`<br>婚配：${esc(spouse.name)}`:''}</p><div class="dossier-stats">${stats.map(([key,label,value])=>`<button onclick="openValueGuide('${key}',${m.id})"><span>${label}</span><b>${Math.floor(value)}</b><i style="width:${clamp(value,0,100)}%"></i></button>`).join('')}</div><section class="dossier-effect"><h3>此人现在能做什么</h3><p>${memberContribution(m)}</p></section><div class="dossier-actions"><button class="btn primary" onclick="closeMemberDossier();switchTab('members')">安排事务</button>${m.sex==='男'&&m.bornInFamily?`<button class="btn" onclick="closeMemberDossier();switchTab('career')">查看科举官途</button>`:''}${eligibleForMarriage(m)?`<button class="btn gold" onclick="closeMemberDossier();openMarriage(${m.id})">为其议亲</button>`:''}</div></div></div>`;
  $('memberOverlay').classList.remove('hidden');
}

function closeMemberDossier(){$('memberOverlay').classList.add('hidden');dossierMemberId=null}

function memberCard(m){
  const isHead=m.id===state.headId,isHeir=m.id===state.heirId,exam=nextExam(m);
  const canExam=exam&&examStatus(m)===`可应${exam.name}`;
  const assignment=m.officeRank?`<select class="assignment-select" disabled><option>任官</option></select>`:m.onCaravan?`<select class="assignment-select" disabled><option>行商途中</option></select>`:m.age<6?`<select class="assignment-select" disabled><option>年幼</option></select>`:`<select class="assignment-select" onchange="changeAssignment(${m.id},this.value)">${ASSIGNMENTS.map(a=>`<option ${m.assignment===a?'selected':''}>${a}</option>`).join('')}</select>`;
  const actions=[];
  if(exam&&m.sex==='男'&&m.bornInFamily)actions.push(`<button class="btn small gold" ${canExam?'':`disabled title="${esc(examStatus(m))}"`} onclick="attemptExam(${m.id})">应${exam.name} · ${exam.cost}两</button>`);
  if(eligibleForMarriage(m))actions.push(`<button class="btn small" onclick="openMarriage(${m.id})">为其议亲</button>`);
  if(m.bornInFamily&&m.resident&&m.age>=10&&!isHead&&!isHeir)actions.push(`<button class="btn small jade" onclick="setHeir(${m.id})">立为宗子</button>`);
  const parentNames=m.parentIds.map(id=>getMember(id)?.name).filter(Boolean).join('、');
  return`<article class="member-card ${isHead?'head':''} ${m.officeRank?'official':''}"><button class="portrait-button member-portrait" onclick="openMemberDossier(${m.id})" aria-label="查看${esc(m.name)}人物卷宗">${portraitSvg(m)}</button><div class="member-card-body"><div class="member-top"><div><button class="member-name name-link" onclick="openMemberDossier(${m.id})">${esc(m.name)}</button><div class="member-meta">${m.sex} · ${m.age}岁 · 第${m.generation}代 · ${esc(m.branch)}${parentNames?`<br>父母：${esc(parentNames)}`:''}</div></div><div class="member-role">${esc(roleLabel(m))}<br><span class="muted">${m.officeRank?`${esc(m.officePlace)} · ${esc(m.officeTrack)}`:m.health<35?'抱病':m.health>80?'康健':'平安'}</span></div></div><div class="badges">${isHead?'<span class="badge red">掌门</span>':''}${isHeir?'<span class="badge gold">宗子</span>':''}<span class="badge">${esc(m.exam)}</span><span class="badge jade">${esc(m.trait)}</span>${m.spouseId?`<span class="badge">已婚 · ${esc(getMember(m.spouseId)?.name||'')}</span>`:''}${m.uxorilocal?'<span class="badge gold">招赘承嗣</span>':''}</div><div class="member-stats"><button class="member-stat" onclick="openValueGuide('learning',${m.id})"><b>${Math.floor(m.learning)}</b><span>学问</span></button><button class="member-stat" onclick="openValueGuide('management',${m.id})"><b>${Math.floor(m.management)}</b><span>治事</span></button><button class="member-stat" onclick="openValueGuide('business',${m.id})"><b>${Math.floor(m.business)}</b><span>经营</span></button><button class="member-stat" onclick="openValueGuide('martial',${m.id})"><b>${Math.floor(m.martial)}</b><span>武艺</span></button></div><button class="health-row" onclick="openValueGuide('health',${m.id})"><span>健康</span><span class="bar jade"><i style="width:${clamp(m.health,0,100)}%"></i></span><b>${Math.floor(m.health)}</b></button><p class="member-contribution">${memberContribution(m)}</p><div class="member-actions">${assignment}${actions.join('')}</div>${exam&&!canExam&&m.sex==='男'&&m.bornInFamily?`<div class="member-meta" style="margin-top:8px">科场：${esc(examStatus(m))}</div>`:''}</div></article>`;
}

function renderMembers(){
  const people=filteredMembers(),pageSize=20,totalPages=Math.max(1,Math.ceil(people.length/pageSize));memberPage=clamp(memberPage,1,totalPages);
  const visible=people.slice((memberPage-1)*pageSize,memberPage*pageSize),generations=[...new Set(residents().map(m=>m.generation))].sort((a,b)=>a-b);
  const counts=residents().reduce((out,m)=>{out[m.assignment]=(out[m.assignment]||0)+1;return out},{}),assignmentLabels=[...ASSIGNMENTS,'行商'];
  $('mainView').innerHTML=`<div class="section-head"><div><h2>族人教养</h2><p>子弟十六岁时会按天资自动分业；也可筛选世代与年龄，一次安排整批族人。</p></div><div class="section-actions"><button class="btn small jade" onclick="autoAssignFamily()">全族按才分业</button><button class="btn small" onclick="familyAction('school')">延师课子 · 70两</button></div></div>
    <section class="management-panel"><div class="assignment-summary">${assignmentLabels.map(a=>`<span class="badge ${a==='读书'?'gold':a==='行商'?'jade':''}">${a} ${counts[a]||0}</span>`).join('')}</div><div class="management-controls"><label>世代<select onchange="setMemberFilter('generation',this.value)"><option value="all">全部世代</option>${generations.map(g=>`<option value="${g}" ${memberFilters.generation===String(g)?'selected':''}>第${g}代</option>`).join('')}</select></label><label>年龄<select onchange="setMemberFilter('age',this.value)"><option value="all" ${memberFilters.age==='all'?'selected':''}>全部年龄</option><option value="child" ${memberFilters.age==='child'?'selected':''}>未满16岁</option><option value="young" ${memberFilters.age==='young'?'selected':''}>16—40岁</option><option value="elder" ${memberFilters.age==='elder'?'selected':''}>40岁以上</option></select></label><label>当前事务<select onchange="setMemberFilter('assignment',this.value)"><option value="all">全部事务</option>${[...ASSIGNMENTS,'行商','任官'].map(a=>`<option value="${a}" ${memberFilters.assignment===a?'selected':''}>${a}</option>`).join('')}</select></label><div class="bulk-control"><select id="bulkAssignment" aria-label="批量安排事务">${ASSIGNMENTS.map(a=>`<option>${a}</option>`).join('')}</select><button class="btn small gold" onclick="bulkAssignFiltered()">批量安排筛选结果</button></div></div><p class="management-note">当前筛出${people.length}人；任官、行商、年幼或不具著述条件者会自动跳过。</p></section>
    <div class="member-grid">${visible.map(memberCard).join('')||'<div class="empty"><b>没有符合条件的族人</b>调整上方筛选条件后再试。</div>'}</div>${totalPages>1?`<div class="pagination"><button class="btn small" ${memberPage<=1?'disabled':''} onclick="setMemberPage(${memberPage-1})">上一页</button><span>第${memberPage} / ${totalPages}页 · 每页${pageSize}人</span><button class="btn small" ${memberPage>=totalPages?'disabled':''} onclick="setMemberPage(${memberPage+1})">下一页</button></div>`:''}`;
}

function renderGenealogy(){
  const maxGen=Math.max(...state.members.filter(m=>m.bornInFamily).map(m=>m.generation),1),groups=[];
  for(let g=1;g<=maxGen;g++){
    const members=state.members.filter(m=>m.bornInFamily&&m.generation===g).sort((a,b)=>a.birthYear-b.birthYear);
    if(!members.length)continue;
    groups.push(`<section class="generation"><div class="generation-title"><b>第${g}代 · ${g===1?'开族':'字辈“'+GENERATION_CHARS[(g-2)%GENERATION_CHARS.length]+'”'}</b><span>${members.filter(m=>m.alive).length}人在世</span></div><div class="lineage-row">${members.map(m=>{const spouse=getMember(m.spouseId),parents=m.parentIds.map(id=>getMember(id)?.name).filter(Boolean).join('、');return`<div class="lineage-person"><b>${esc(m.name)}</b>${m.id===state.headId?' <span class="red">[家主]</span>':''}${m.id===state.heirId?' <span class="gold-text">[宗子]</span>':''}<small>${m.alive?`${m.age}岁 · ${esc(roleLabel(m))}`:`卒年${state.dead.find(d=>d.id===m.id)?.year||'?'} · 享年${m.age}`}<br>${parents?`父母：${esc(parents)}<br>`:''}${spouse?`婚配：${esc(spouse.name)}${m.marriedOut?'（出阁）':''}`:'未婚'}</small></div>`}).join('')}</div></section>`);
  }
  $('mainView').innerHTML=`<div class="section-head"><div><h2>宗族世系</h2><p>宗谱记录本姓血脉，入门配偶附于婚配项下；出阁女子仍留其名，但不计入本家在籍人口。</p></div><div class="section-actions"><button class="btn small" onclick="upgradeProject('genealogy')">续修宗谱</button></div></div>${groups.join('')}`;
}

function renderCareer(){
  const scholars=state.members.filter(m=>m.bornInFamily&&m.sex==='男'&&m.alive&&m.resident).sort((a,b)=>EXAM_ORDER.indexOf(b.exam)-EXAM_ORDER.indexOf(a.exam)||a.generation-b.generation);
  const rows=scholars.map(m=>{
    if(m.officeRank)ensureOfficialContacts(m);
    const exam=nextExam(m),can=exam&&examStatus(m)===`可应${exam.name}`;
    const examAction=exam?(can?`<button class="btn small gold" onclick="attemptExam(${m.id})">应${exam.name}</button>`:`<span class="muted">${esc(examStatus(m))}</span>`):'<span class="jade-text">金榜题名</span>';
    const transfer=m.officeRank&&m.officeRank>2?`<div class="office-actions"><button class="btn small" ${m.officeYears<3?'disabled title="任满三年方可请调"':''} onclick="transferOfficial(${m.id},'home')">请调本籍</button><button class="btn small" ${m.officeYears<3?'disabled title="任满三年方可请调"':''} onclick="transferOfficial(${m.id},'external')">谋求外任</button></div>`:'';
    const history=m.officeHistory?.length?`<details class="office-history"><summary>仕宦履历 ${m.officeHistory.length}任</summary>${m.officeHistory.slice().reverse().slice(0,5).map(h=>`<span>家历${h.year}年　${esc(h.office)} · ${esc(h.place)}（${esc(h.track)}）</span>`).join('')}</details>`:'';
    const contacts=m.officeRank?`<details class="contact-network"><summary>官场关系 ${Math.floor(officialNetworkPower(m))}</summary><div class="contact-list">${m.officialContacts.map(c=>`<span><b>${esc(c.role)} · ${esc(c.name)}</b><i>${esc(c.camp)} · 交情${Math.floor(c.bond)}</i></span>`).join('')}</div><div class="social-actions"><button class="btn small" ${m.lastSocialYear===state.year?'disabled':''} onclick="socializeOfficial(${m.id},'fellow')">宴请同年 · 18两</button><button class="btn small" ${m.lastSocialYear===state.year?'disabled':''} onclick="socializeOfficial(${m.id},'patron')">拜望师长 · 34两</button><button class="btn small" ${m.lastSocialYear===state.year?'disabled':''} onclick="socializeOfficial(${m.id},'gentry')">会晤士绅 · 24两</button></div><small>${m.lastSocialYear===state.year?'本年已经交际过':'每年只可选择一项交际'}</small></details>`:'';
    const duty=m.officeRank?`<label class="duty-select">任上事务<select onchange="changeOfficialDuty(${m.id},this.value)">${Object.entries(OFFICIAL_DUTIES).map(([name,d])=>`<option value="${name}" ${m.officeDuty===name?'selected':''}>${name}｜${d.desc}</option>`).join('')}</select></label>`:'';
    const office=m.officeRank?`<b>${esc(OFFICES[m.officeRank])}</b><br><span class="office-place">${esc(m.officePlace)} · ${esc(m.officeTrack)}</span><br><span class="muted">本任${m.officeYears}年 · ${esc(OFFICE_TRACKS[m.officeTrack]?.copy||'')}</span>${duty}${contacts}${history}`:'未仕';
    return`<tr><td><b>${esc(m.name)}</b><br><span class="muted">${m.age}岁 · 第${m.generation}代</span></td><td>${esc(m.honor||m.exam)}${m.examFails?`<br><span class="red">落第${m.examFails}次</span>`:''}</td><td>${Math.floor(m.learning)}</td><td>${office}</td><td>${examAction}${transfer}</td></tr>`;
  }).join('');
  const provincial=state.year%3===0?'本年乡试开科':`距乡试${3-state.year%3}年`,metropolitan=state.year%3===1?'本年会试开科':`距会试${(1-state.year%3+3)%3||3}年`;
  $('mainView').innerHTML=`<div class="section-head"><div><h2>科举官途</h2><p>每名族人同一年只能应试一次；地方、任期与调任路线会改变俸禄、考成和官灾。</p></div><div class="section-actions"><span class="badge gold">${provincial}</span><span class="badge red">${metropolitan}</span></div></div><div class="table-wrap"><table class="data-table career-table"><thead><tr><th>族人</th><th>科名</th><th>学问</th><th>官职与任地</th><th>下一步</th></tr></thead><tbody>${rows||'<tr><td colspan="5">暂无应试子弟</td></tr>'}</tbody></table></div><div class="panel-grid office-guide" style="margin-top:14px">${Object.entries(OFFICE_TRACKS).map(([name,v])=>`<section class="panel"><h3>${name}</h3><p class="panel-copy">${v.copy}。俸禄倍率 ${v.salary.toFixed(2)}，考成倍率 ${v.merit.toFixed(2)}。</p></section>`).join('')}</div>`;
}

function renderMarriageTab(){
  const eligible=state.members.filter(eligibleForMarriage);
  const candidates=eligible.length?eligible.map(m=>`<div class="marriage-row"><div><h3>${esc(m.name)} <span class="badge">${m.sex} · ${m.age}岁</span></h3><p>第${m.generation}代 · ${esc(m.trait)} · ${esc(m.exam)} · 当前${esc(m.assignment)}<br>${m.sex==='女'?'可正常出阁结盟，也可选择寒门才子入赘承嗣。':'新妇入门后将参与掌家，并为本房延续血脉。'}</p></div><button class="btn primary" onclick="openMarriage(${m.id})">查看三份名帖</button></div>`).join(''):`<div class="empty"><b>眼下无人适龄议亲</b>族人年满十八且未婚时，可在这里交换婚书。</div>`;
  const alliances=state.alliances.length?state.alliances.slice().reverse().map(a=>`<span class="alliance-chip">第${a.year}年 · ${esc(a.member)} × ${esc(a.spouse)} · ${esc(a.house)}${a.uxorilocal?'（入赘）':''}</span>`).join(''):'<span class="muted">尚未结成外姓姻亲</span>';
  $('mainView').innerHTML=`<div class="section-head"><div><h2>婚姻人脉</h2><p>高攀会消耗妆奁与家底，低娶低嫁却可能错过官场网络。女儿出阁仍入本谱；需要承嗣时，也能择寒门才子入赘。</p></div></div><div class="marriage-list">${candidates}</div><section class="panel" style="margin-top:15px"><h3>已结姻亲 · ${state.alliances.length}门</h3><div>${alliances}</div></section>`;
}

function assetCost(type){const a=state.assets;if(type==='fields')return Math.round((88+a.fields*1.25)*(state.policy==='置业'?.9:1));if(type==='shops')return 230+a.shops*75;if(type==='workshops')return 190+a.workshops*55;if(type==='granaries')return 160+a.granaries*70;return 280+a.houses*110}
function renderEstate(){
  const a=state.assets,report=state.lastYearReport,quote=state.market||marketQuote(state.year,state.climate,state.region),reserve=residents().length*18,surplus=Math.max(0,state.resources.grain-reserve),assets=[
    ['fields','田地',`${fmt(a.fields)}亩`,'田租与粮食根基。灾年可能受损，却不会因罢官消失。','再置十亩'],
    ['shops','商铺',`${a.shops}间`,'提供稳定现银；商贸族策下收益更高。','添置商铺'],
    ['workshops','作坊',`${a.workshops}处`,'经营纸墨、织造或榨油，收益低于远商但稳妥。','开设作坊'],
    ['granaries','粮仓',`${a.granaries}座`,'提高田亩实际收成，灾年也更能周转。','扩建粮仓'],
    ['houses','宅院',`${a.houses}进`,'门第的外在体面，也容得下更多支房同住。','扩建宅院'],
    ['books','藏书',`${fmt(a.books)}卷`,'提高科举准备与著述积累；火灾时尤其脆弱。','由藏书楼经营']
  ];
  const leaders=residents().filter(m=>m.age>=16&&!m.officeRank&&!m.onCaravan&&m.assignment==='经商'&&m.business>=25).sort((a,b)=>b.business-a.business);
  const activeCaravans=(state.caravans||[]).filter(c=>c.status==='traveling'),recentCaravans=(state.caravans||[]).filter(c=>c.status!=='traveling').slice(-5).reverse();
  const caravanStatus=activeCaravans.length?activeCaravans.map(c=>`<div class="caravan-active"><b>${esc(CARAVAN_ROUTES[c.routeId]?.name||'商队')} · ${esc(c.leader)}</b><span>前往${esc(c.target)} · 家历${c.dueYear}年归 · 尚余${Math.max(0,c.dueYear-state.year)}年</span></div>`).join(''):'<div class="empty compact"><b>暂无在途商队</b>先在族人页安排经商，再选择领队与商路。</div>';
  const caravanHistory=recentCaravans.length?recentCaravans.map(c=>`<span class="alliance-chip">${esc(CARAVAN_ROUTES[c.routeId]?.name||'商队')} · ${esc(c.leader)} · ${esc(c.result)}</span>`).join(''):'<span class="muted">尚无商队归航记录</span>';
  $('mainView').innerHTML=`<div class="section-head"><div><h2>田庄产业</h2><p>粮食可以进入粮市变现；地租、店铺、经商、俸禄、行医和著述共同构成家门银钱来源。</p></div></div><div class="asset-grid">${assets.map(x=>`<article class="asset-card"><h3>${x[1]}</h3><p>${x[3]}</p><div class="asset-value">${x[2]}</div>${x[0]==='books'?`<button class="btn small" onclick="upgradeProject('library')">扩充藏书楼</button>`:`<button class="btn small" onclick="buyAsset('${x[0]}')">${x[4]} · ${assetCost(x[0])}两</button>`}</article>`).join('')}</div>
    <section class="panel caravan-panel"><div class="caravan-head"><div><h3>商队与商路</h3><p class="panel-copy">任地有本族官员可略减商路风险；领队经营越高，带回厚利的机会越大。</p></div><label>选择领队<select id="caravanLeaderSelect" ${leaders.length?'':'disabled'}>${leaders.length?leaders.map(m=>`<option value="${m.id}">${esc(m.name)} · 经营${Math.floor(m.business)} · 治事${Math.floor(m.management)}</option>`).join(''):'<option>暂无经商族人</option>'}</select></label></div><div class="caravan-routes">${Object.entries(CARAVAN_ROUTES).map(([id,r])=>{const target=caravanTarget(r),supported=state.members.some(m=>m.alive&&m.officeRank&&m.officeRegion===target);return`<article class="route-card"><div><b>${r.name}</b>${supported?'<span class="badge jade">官员照应</span>':''}</div><p>${r.desc}</p><small>${r.goods} · ${r.years}年 · 风险${Math.round(r.risk*100)}%<br>本钱${r.silver}两${r.grain?`＋粮${r.grain}石`:''} · 常利约${Math.round((r.returns-1)*100)}%</small><button class="btn small gold" ${leaders.length?'':'disabled'} onclick="launchCaravan('${id}')">发商队往${target}</button></article>`}).join('')}</div><div class="caravan-log"><div><h3>在途商队 · ${activeCaravans.length}</h3>${caravanStatus}</div><div><h3>近次归航</h3>${caravanHistory}</div></div></section>
    <div class="panel-grid estate-ledger" style="margin-top:14px"><section class="panel grain-market"><div class="row-between"><div><h3>本年粮市</h3><p class="panel-copy">${state.climate}年景 · 每100石</p></div><span class="market-price">售 ${quote.sellPer100}两 / 购 ${quote.buyPer100}两</span></div><div class="market-reserve"><span>建议留粮</span><b>${fmt(reserve)}石</b><span>可售余粮</span><b>${fmt(surplus)}石</b></div><div class="market-actions"><button class="btn small gold" onclick="tradeGrain('sell',100)">售100石</button><button class="btn small gold" onclick="tradeGrain('sell',500)">售500石</button><button class="btn small" onclick="tradeGrain('sell','surplus')">售出整批余粮</button><button class="btn small jade" onclick="tradeGrain('buy',100)">购100石</button><button class="btn small jade" onclick="tradeGrain('buy',500)">购500石</button></div></section><section class="panel"><h3>上年银钱来源</h3><ul class="plain-list"><li class="row-between"><span>田租折银</span><b>${fmt(report.fieldRent)}两</b></li><li class="row-between"><span>商铺作坊</span><b>${fmt(report.shopIncome)}两</b></li><li class="row-between"><span>族人经商</span><b>${fmt(report.tradeIncome)}两</b></li><li class="row-between"><span>官员俸禄</span><b>${fmt(report.salary)}两</b></li><li class="row-between"><span>塾师、行医与著述</span><b>${fmt(report.serviceIncome)}两</b></li><li class="row-between ledger-total"><span>合计进银 / 支出</span><b>${fmt(report.income)} / ${fmt(report.expense)}两</b></li></ul></section></div><section class="panel" style="margin-top:14px"><h3>本年常例账</h3><p class="panel-copy">上年收成约${fmt(report.harvest)}石，口粮用去${fmt(report.consumption)}石。粮市价格会随承平、边患与灾馑浮动；灾年卖粮更贵，但回购也更贵。</p></section>`;
}

function renderAncestral(){
  const projects=Object.entries(PROJECTS).map(([key,p])=>{const level=state.projects[key],cost=Math.round(p.base*(1+level*.72));return`<div class="project"><div><h3>${p.name} <span class="project-level">第${level}阶</span></h3><p>${p.desc}</p></div><button class="btn small ${level>=4?'':'gold'}" ${level>=4?'disabled':''} onclick="upgradeProject('${key}')">${level>=4?'已完备':`修建 · ${cost}两`}</button></div>`}).join('');
  $('mainView').innerHTML=`<div class="section-head"><div><h2>宗祠家法</h2><p>家风不是口号。族人的选择会慢慢改变五项倾向，并反过来影响收成、科举、官灾、婚育和分家。</p></div><div class="section-actions"><button class="btn small jade" onclick="familyAction('rite')">合族祭祖</button><button class="btn small" onclick="familyAction('relief')">乡里赈济</button></div></div><div class="panel-grid"><section class="panel"><h3>五项家风</h3>${valueMeters()}</section><section class="panel"><h3>祖训与族策</h3><p class="panel-copy"><b>${state.precept}</b>：${PRECEPTS[state.precept].desc}<br><br><b>${state.policy}</b>：${POLICIES[state.policy].desc}<br>${POLICIES[state.policy].effect}</p><button class="btn small" style="margin-top:14px" onclick="openPolicy()">重议族策</button></section></div><div class="project-list" style="margin-top:14px">${projects}</div>`;
}

function valueMeters(){
  const labels={learning:['家学','familyLearning'],integrity:['清正','integrity'],unity:['和族','unity'],enterprise:['营生','enterprise'],martial:['武备','familyMartial']};
  return Object.entries(labels).map(([k,[label,guide]])=>`<button class="meter-row value-meter" onclick="openValueGuide('${guide}')"><span>${label}</span><span class="bar ${k==='unity'?'jade':k==='enterprise'?'gold':''}"><i style="width:${clamp(state.values[k],0,100)}%"></i></span><b>${Math.floor(clamp(state.values[k],0,100))}</b></button>`).join('');
}

function renderChronicle(){
  const logs=state.logs,rows=logs.length?`<ul class="log-list">${logs.map(l=>`<li class="${l.type}"><time>家历${l.year}年 · ${eraShort(l.year)}</time>${esc(l.text)}</li>`).join('')}</ul>`:`<div class="empty"><b>谱上无事</b>家门大事将在此记录。</div>`;
  const dead=state.dead.length?state.dead.slice().reverse().map(d=>`<span class="alliance-chip">${esc(d.name)} · 享年${d.age}${d.office?` · ${esc(d.office)}`:''}</span>`).join(''):'<span class="muted">尚无祠中先人</span>';
  $('mainView').innerHTML=`<div class="section-head"><div><h2>百年家史</h2><p>科名、升黜、婚盟、生死、产业与家门选择都会写进年谱。导出存档即可保存这一条独有世系。</p></div><div class="section-actions"><button class="btn small" onclick="exportSave()">导出整部家史</button></div></div><section class="panel"><h3>祠中先人 · ${state.dead.length}位</h3>${dead}</section><section class="panel" style="margin-top:14px"><h3>大事年表</h3>${rows}</section>`;
}

function renderSide(){
  const rank=currentRank(),next=nextRank(),unmarried=state.members.filter(eligibleForMarriage).length,students=residents().filter(m=>m.assignment==='读书').length,officials=residents().filter(m=>m.officeRank).length,caravans=(state.caravans||[]).filter(c=>c.status==='traveling').length;
  const adultStudents=residents().filter(m=>m.assignment==='读书'&&m.age>=16&&!m.officeRank).length,studentTarget=workforceTargets()['读书'];
  const warnings=[];
  if(state.resources.grain<residents().length*18)warnings.push('存粮不足两年口粮，若再遇灾年会伤及全族健康。');
  if(state.resources.silver<50)warnings.push('现银吃紧，科举、婚礼与灾年选择都会受到限制。');
  if(state.values.unity<28)warnings.push('几房离心严重，争产与分家事件更容易爆发。');
  if(unmarried>=3)warnings.push(`有${unmarried}名适龄族人尚未议亲，血脉与姻亲网络都会停滞。`);
  if(adultStudents>studentTarget+2)warnings.push(`成年读书人已有${adultStudents}名，超过当前家业建议的${studentTarget}名，可到“族人教养”按才分业。`);
  const nextExamText=state.year%3===0?'乡试正在开科':state.year%3===1?'会试正在开科':'本年无大比';
  $('sideView').innerHTML=`
    <section class="side-panel"><h3>门第进境</h3><div class="big-number">${familyScore()}</div><p class="panel-copy">${rank.name}${next?`，距${next.name}尚差${Math.max(0,next.score-familyScore())}族望。`:'，已至最高门第。'}</p><div class="bar gold" style="margin-top:10px"><i style="width:${next?clamp((familyScore()-rank.score)/(next.score-rank.score)*100,3,100):100}%"></i></div></section>
    <section class="side-panel"><h3>本轮族策</h3><div class="policy-name">${state.policy}</div><p class="panel-copy">${POLICIES[state.policy].effect}<br>第${state.year-state.lastPolicyYear+1}年 / 十年</p></section>
    <section class="side-panel"><h3>族中简册</h3><ul class="plain-list"><li class="row-between"><span>读书子弟</span><b>${students}人</b></li><li class="row-between"><span>在任官员</span><b>${officials}人</b></li><li class="row-between"><span>在途商队</span><b>${caravans}支</b></li><li class="row-between"><span>外姓姻亲</span><b>${state.alliances.length}门</b></li><li class="row-between"><span>科场时序</span><b>${nextExamText}</b></li></ul>${warnings.map(w=>`<div class="warning">${w}</div>`).join('')||'<div class="tip">眼下家用平稳。趁承平年景培养下一代，不要只依赖一名高官。</div>'}</section>`;
}

document.addEventListener('DOMContentLoaded',()=>{
  renderStartChoices();
  $('startButton').addEventListener('click',startGame);$('resumeButton').addEventListener('click',resumeGame);
  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>switchTab(tab.dataset.tab)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeValueGuide();closeMemberDossier();closeMarriage()}});
});
