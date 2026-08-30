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

let state=null;
let activeTab='overview';
let startConfig={region:'江南',origin:'寒门塾师',precept:'耕读传家'};
let marriageMemberId=null;
let marriageCandidates=[];
let toastTimer=null;

function makeMember(data={}){
  return Object.assign({
    id:uid(),name:'无名',sex:'男',age:0,generation:1,branch:'长房',parentIds:[],spouseId:null,
    bornInFamily:true,resident:true,marriedOut:false,uxorilocal:false,alive:true,birthYear:1,
    health:78,learning:10,martial:10,management:10,business:10,integrity:55,
    talent:50,trait:pick(TRAITS),assignment:'闲居',exam:'白身',examFails:0,
    officeRank:0,officeYears:0,merit:0,lastBirthYear:-10,designated:false,relation:'族人'
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
    version:1,surname,region:startConfig.region,origin:startConfig.origin,precept:startConfig.precept,
    year:1,headId:founderId,heirId:child1.id,lastPolicyYear:1,policy:'守成',climate,lastClimateYear:1,
    resources:{silver:origin.silver,grain:origin.grain,prestige:origin.prestige,reputation:origin.reputation,influence:origin.influence,favor:origin.officeRank?4:0},
    assets:{fields:origin.fields,shops:origin.shops,workshops:origin.workshops,granaries:1,houses:1,books:origin.books},
    projects:{ancestral:1,academy:startConfig.origin==='寒门塾师'?1:0,library:0,charity:0,genealogy:startConfig.origin==='没落士族'?1:0},
    values:{learning:35+precept.learning,integrity:42+precept.integrity,unity:42+precept.unity,enterprise:30+precept.enterprise,martial:25+precept.martial},
    members:[founder,spouse,child1,child2,child3],dead:[],alliances:[],pendingEvent:null,eventHistory:[],ended:false,
    lastYearReport:{income:0,expense:0,harvest:0,consumption:0},logs:[]
  };
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
  if(state.pendingEvent)setTimeout(showPendingEvent,60);
}

function resumeGame(){
  try{
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY));
    state=migrate(data);enterGame();renderAll();toast('旧档已续读');
  }catch(e){toast('存档损坏，无法续读')}
}

function migrate(data){
  if(!data||data.version!==1||!Array.isArray(data.members))throw new Error('invalid');
  data.eventHistory=data.eventHistory||[];data.logs=data.logs||[];data.dead=data.dead||[];data.alliances=data.alliances||[];
  data.members=data.members.map(m=>makeMember(m));data.values=Object.assign({learning:40,integrity:45,unity:45,enterprise:35,martial:30},data.values||{});
  data.projects=Object.assign({ancestral:1,academy:0,library:0,charity:0,genealogy:0},data.projects||{});
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
    state.members.filter(m=>m.officeRank).forEach(m=>{if(chance(.45)){m.officeRank=0;m.officeYears=0;m.assignment='闲居'}});
    addResource('favor',-Math.floor(state.resources.favor*.7));addResource('prestige',-12);state.values.unity=clamp(state.values.unity-4,0,100);
  }else if(oldEra.title!==newEra.title){
    log('important',`新君改元${newEra.title}，朝局与取士风向随之一变。`);
    addResource('favor',-Math.floor(state.resources.favor*.35));
  }
  updateClimate();
  runEconomy();
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
  const r=state.resources,a=state.assets,region=REGIONS[state.region],people=residents();
  const policyYield=state.policy==='置业'?1.18:1,granaryBonus=1+a.granaries*.025;
  let harvest=a.fields*(3.7+state.values.enterprise*.012)*region.yield*policyYield*granaryBonus*(.86+Math.random()*.28);
  if(state.climate==='灾馑')harvest*=.68;
  const farmerBonus=people.filter(m=>m.assignment==='务农').reduce((x,m)=>x+4+m.management*.05,0);harvest+=farmerBonus;
  const shopIncome=a.shops*34*region.trade+(a.workshops*27)+(state.policy==='商贸'?(a.shops+a.workshops)*9:0);
  const tradeIncome=people.filter(m=>m.assignment==='经商').reduce((x,m)=>x+4+m.business*.14,0);
  const salary=people.reduce((x,m)=>x+(m.officeRank?OFFICE_SALARY[m.officeRank]:0),0);
  const teachingIncome=people.filter(m=>m.assignment==='读书'&&m.age>22&&m.learning>=50).reduce((x,m)=>x+3+m.learning*.055,0);
  const householdIncome=a.fields*.38+shopIncome+tradeIncome+salary+teachingIncome;
  const studentCost=people.filter(m=>m.assignment==='读书').length*3.2;
  const officialCost=people.filter(m=>m.officeRank).length*4;
  const baseExpense=(people.length*1.45+studentCost+officialCost)*(state.policy==='守成'?.9:1);
  const stewards=people.filter(m=>m.assignment==='掌家').reduce((x,m)=>x+m.management,0);
  const consumption=people.length*7.5*Math.max(.78,1-stewards*.0008)*(state.policy==='守成'?.92:1);
  r.grain+=harvest-consumption;r.silver+=householdIncome-baseExpense;
  if(r.grain<0){const shortage=Math.abs(r.grain);r.grain=0;people.forEach(m=>m.health=clamp(m.health-4-shortage/100,1,100));state.values.unity=clamp(state.values.unity-3,0,100);log('bad','族中粮仓见底，只得减食度日，老幼健康俱损。')}
  if(r.silver<0){r.silver=0;addResource('reputation',-2);state.values.unity=clamp(state.values.unity-2,0,100);log('bad','家用无以为继，族中开始典当器物周转。')}
  state.lastYearReport={income:householdIncome,expense:baseExpense,harvest,consumption};
}

function ageAndTrain(){
  const region=REGIONS[state.region];
  residents().forEach(m=>{
    m.age++;
    if(m.age<6){m.assignment='闲居';return}
    if(m.age===6&&m.assignment==='闲居')m.assignment=m.bornInFamily?'读书':'掌家';
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
      m.management=clamp(m.management+.55,0,100);m.merit+=1+m.management*.012;
    }
    if(m.trait==='多病')m.health-=.7;
    if(m.age>50)m.health-=.35+(m.age-50)*.018;
    else m.health+=.08;
    m.health=clamp(m.health,1,100);
  });
}

function runBirths(){
  const lines=bloodline().filter(m=>m.resident&&m.spouseId&&!m.marriedOut&&((m.sex==='男')||(m.sex==='女'&&m.uxorilocal)));
  // 大族人口越多，分房、晚婚与资源竞争越明显，避免数百年后人口无限膨胀。
  const density=Math.max(.16,1-residents().length/70);
  lines.forEach(line=>{
    const spouse=getMember(line.spouseId);if(!spouse||!spouse.alive)return;
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
    const corruption=Math.max(0,45-m.integrity)*.0015+(state.climate==='党争'?.015:0);
    if(chance(corruption)){
      const severe=chance(.25+m.officeRank*.02);addResource('reputation',severe?-14:-5);addResource('favor',severe?-9:-3);
      if(severe){log('bad',`${m.name}因任上钱粮不清遭弹劾，官身尽失。`);m.officeRank=0;m.officeYears=0;m.assignment='闲居'}
      else log('bad',`${m.name}受到御史参劾，虽保住官位，家门清名受损。`);
      return;
    }
    if(m.officeYears>=4&&m.officeRank>1){
      let p=.035+m.merit*.002+state.resources.influence*.0007+state.resources.favor*.001+climate.promotion+(state.policy==='入仕'?.045:0);
      if(m.trait==='圆融')p+=.025;if(m.trait==='刚直'&&state.climate==='党争')p-=.02;
      if(chance(clamp(p,.01,.24))){m.officeRank--;m.officeYears=0;m.merit=0;addResource('prestige',10+(10-m.officeRank)*3);addResource('influence',3);addResource('favor',2);log('important',`${m.name}政绩入考，升任${OFFICES[m.officeRank]}，家门为之一振。`)}
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
      {label:'联名上疏',hint:'押注朝争；可能骤升或罢官',effect:ctx=>{const m=getMember(ctx.memberId);if(chance(state.climate==='党争'?.42:.58)){addResource('favor',14);addResource('influence',10);if(m&&m.officeRank>1)m.officeRank--;return'奏疏得到了御前支持，联名者一时炙手可热。'}if(m){m.officeRank=0;m.assignment='闲居'}addResource('favor',-15);addResource('prestige',-18);return'风向一夜逆转，奏疏被斥为朋党之言，族中官员罢归乡里。'}},
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
  if(!exam.open())return`${exam.name}尚未开科`;
  return`可应${exam.name}`;
}

function attemptExam(id){
  const m=getMember(id),exam=m&&nextExam(m);if(!m||!m.alive||!exam)return;
  if(m.sex!=='男')return toast('本朝科举不取女籍');
  if(m.age<exam.minAge||m.learning<exam.minLearning)return toast(examStatus(m));
  if(!exam.open())return toast(`${exam.name}尚未开科`);
  if(!spend({silver:exam.cost}))return toast(`赴考需银${exam.cost}两`);
  let p=exam.base+(m.learning-exam.minLearning)*.009+m.talent*.0012+state.projects.academy*.018+state.projects.library*.022+state.assets.books*.00035+CLIMATES[state.climate].exam;
  if(state.policy==='兴学')p+=.055;if(m.trait==='聪颖')p+=.035;if(m.trait==='散漫')p-=.04;
  p=clamp(p,.08,.88);
  if(chance(p)){
    m.exam=exam.to;m.examFails=0;addResource('prestige',exam.award);addResource('reputation',Math.ceil(exam.award/4));state.values.learning=clamp(state.values.learning+2,0,100);
    let extra='';
    if(exam.to==='进士'){
      const top=chance(.08),first=top&&chance(.12);m.honor=first?'状元':top?'二甲进士':'进士出身';m.officeRank=first?8:9;m.officeYears=0;m.assignment='任官';addResource('favor',first?18:7);extra=`，旋授${OFFICES[m.officeRank]}`;
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
  if(m.officeRank&&value!=='任官')return toast('在任官员须先去官才能改业');
  if(value==='著述'&&m.learning<55)return toast('学问达到55方可著述');
  m.assignment=value;save();renderAll();toast(`${m.name}改为${value}`);
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

function eligibleForMarriage(m){return m.alive&&m.bornInFamily&&m.resident&&!m.spouseId&&m.age>=18&&m.age<=42}
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
    if(state.resources.silver<70)return toast('延师课子需银70两');state.resources.silver-=70;residents().filter(m=>m.age>=6&&m.age<=22).forEach(m=>m.learning=clamp(m.learning+3,0,100));state.values.learning=clamp(state.values.learning+1,0,100);log('normal','族中延师开讲一季，年轻子弟的经义都有进益。');
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
  const renderers={overview:renderOverview,members:renderMembers,genealogy:renderGenealogy,career:renderCareer,marriage:renderMarriageTab,estate:renderEstate,ancestral:renderAncestral,chronicle:renderChronicle};
  (renderers[activeTab]||renderOverview)();renderSide();
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===activeTab));
}

function renderResources(){
  const r=state.resources,items=[
    ['家历',`第${state.year}年`,false],['在籍人口',`${residents().length}人`,residents().length<2],['现银',`${fmt(r.silver)}两`,r.silver<30],
    ['存粮',`${fmt(r.grain)}石`,r.grain<residents().length*18],['田亩',`${fmt(state.assets.fields)}亩`,false],['族望',fmt(familyScore()),false],
    ['清望',fmt(r.reputation),r.reputation<5],['人脉',fmt(r.influence),false],['圣眷',fmt(r.favor),false]
  ];
  $('resourceBar').innerHTML=items.map(x=>`<div class="resource ${x[2]?'danger':''}"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
}

function renderOverview(){
  const rank=currentRank(),next=nextRank(),score=familyScore(),h=head(),report=state.lastYearReport;
  const goals=goalList();
  $('mainView').innerHTML=`
    <div class="section-head"><div><h2>家门总览</h2><p>世家的根基不只是一张官帖。田庄供养读书，婚盟托举仕途，清望又在灾年保住人心。</p></div><div class="section-actions"><button class="btn small" onclick="familyAction('school')">延师课子</button><button class="btn small jade" onclick="familyAction('rite')">合族祭祖</button></div></div>
    <div class="hero-grid">
      <section class="family-rank" data-mark="${esc(state.surname)}"><span class="rank-label">当前门第</span><div class="rank-name">${rank.name}</div><p class="rank-copy">${rank.copy}</p><div class="rank-progress"><span>${score}</span><div class="bar gold"><i style="width:${next?clamp((score-rank.score)/(next.score-rank.score)*100,2,100):100}%"></i></div><span>${next?`${next.name} ${next.score}`:'门第已极'}</span></div></section>
      <section class="patriarch-card"><div><span class="rank-label">本代家主</span><h3>${h?esc(h.name):'宗房无人'}</h3><p>${h?`${h.age}岁 · ${h.exam}${h.officeRank?` · ${OFFICES[h.officeRank]}`:''}<br>${esc(h.trait)} · ${esc(h.assignment)}`:'族中尚未推举新主'}</p></div><div class="patriarch-stats"><div class="tiny-stat"><b>${h?Math.floor(h.learning):'-'}</b><span>学问</span></div><div class="tiny-stat"><b>${h?Math.floor(h.management):'-'}</b><span>治事</span></div><div class="tiny-stat"><b>${h?Math.floor(h.integrity):'-'}</b><span>操守</span></div></div></section>
    </div>
    <div class="panel-grid">
      <section class="panel"><h3>立族长志</h3><ul class="goal-list">${goals.map(g=>`<li class="${g.done?'done':''}">${g.text}</li>`).join('')}</ul></section>
      <section class="panel"><h3>去年账略</h3><ul class="plain-list"><li class="row-between"><span>田庄收成</span><b>${fmt(report.harvest)}石</b></li><li class="row-between"><span>全年口粮</span><b>－${fmt(report.consumption)}石</b></li><li class="row-between"><span>产业与俸禄</span><b>${fmt(report.income)}两</b></li><li class="row-between"><span>家用与束脩</span><b>－${fmt(report.expense)}两</b></li></ul><p class="panel-copy">账面丰厚不等于安全：改朝换代时，官位可能归零，只有田亩、宗族和清望能留下。</p></section>
      <section class="panel"><h3>近年家事</h3>${renderMiniLogs(5)}</section>
      <section class="panel"><h3>朝局与地方</h3><p class="panel-copy"><b class="red">${state.climate}</b>　${CLIMATES[state.climate].desc}<br><br><b>${state.region}</b>　${REGIONS[state.region].desc}<br><br>本轮族策：<b class="jade-text">${state.policy}</b>，尚余约${Math.max(0,10-(state.year-state.lastPolicyYear))}年再议。</p></section>
    </div>`;
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
  if(m.officeRank)return OFFICES[m.officeRank];if(m.exam!=='白身')return m.honor||m.exam;if(!m.bornInFamily)return m.relation;return m.assignment;
}

function memberCard(m){
  const isHead=m.id===state.headId,isHeir=m.id===state.heirId,exam=nextExam(m);
  const canExam=exam&&m.sex==='男'&&m.age>=exam.minAge&&m.learning>=exam.minLearning&&exam.open();
  const assignment=m.officeRank?`<select class="assignment-select" disabled><option>任官</option></select>`:m.age<6?`<select class="assignment-select" disabled><option>年幼</option></select>`:`<select class="assignment-select" onchange="changeAssignment(${m.id},this.value)">${ASSIGNMENTS.map(a=>`<option ${m.assignment===a?'selected':''}>${a}</option>`).join('')}</select>`;
  const actions=[];
  if(exam&&m.sex==='男'&&m.bornInFamily)actions.push(`<button class="btn small gold" ${canExam?'':`disabled title="${esc(examStatus(m))}"`} onclick="attemptExam(${m.id})">应${exam.name} · ${exam.cost}两</button>`);
  if(eligibleForMarriage(m))actions.push(`<button class="btn small" onclick="openMarriage(${m.id})">为其议亲</button>`);
  if(m.bornInFamily&&m.resident&&m.age>=10&&!isHead&&!isHeir)actions.push(`<button class="btn small jade" onclick="setHeir(${m.id})">立为宗子</button>`);
  const parentNames=m.parentIds.map(id=>getMember(id)?.name).filter(Boolean).join('、');
  return`<article class="member-card ${isHead?'head':''} ${m.officeRank?'official':''}"><div class="member-top"><div><div class="member-name">${esc(m.name)}</div><div class="member-meta">${m.sex} · ${m.age}岁 · 第${m.generation}代 · ${esc(m.branch)}${parentNames?`<br>父母：${esc(parentNames)}`:''}</div></div><div class="member-role">${esc(roleLabel(m))}<br><span class="muted">${m.health<35?'抱病':m.health>80?'康健':'平安'}</span></div></div><div class="badges">${isHead?'<span class="badge red">掌门</span>':''}${isHeir?'<span class="badge gold">宗子</span>':''}<span class="badge">${esc(m.exam)}</span><span class="badge jade">${esc(m.trait)}</span>${m.spouseId?`<span class="badge">已婚 · ${esc(getMember(m.spouseId)?.name||'')}</span>`:''}${m.uxorilocal?'<span class="badge gold">招赘承嗣</span>':''}</div><div class="member-stats"><div class="member-stat"><b>${Math.floor(m.learning)}</b><span>学问</span></div><div class="member-stat"><b>${Math.floor(m.management)}</b><span>治事</span></div><div class="member-stat"><b>${Math.floor(m.business)}</b><span>经营</span></div><div class="member-stat"><b>${Math.floor(m.martial)}</b><span>武艺</span></div></div><div class="meter-row"><span>健康</span><div class="bar jade"><i style="width:${clamp(m.health,0,100)}%"></i></div><b>${Math.floor(m.health)}</b></div><div class="member-actions">${assignment}${actions.join('')}</div>${exam&&!canExam&&m.sex==='男'&&m.bornInFamily?`<div class="member-meta" style="margin-top:8px">科场：${esc(examStatus(m))}</div>`:''}</article>`;
}

function renderMembers(){
  const people=residents().sort((a,b)=>(a.id===state.headId?-1:b.id===state.headId?1:0)||a.generation-b.generation||b.age-a.age);
  $('mainView').innerHTML=`<div class="section-head"><div><h2>族人教养</h2><p>读书不是唯一出路。掌家降低全族口粮，经商供养科举，行医能在疫年救命，习武则守得住田庄。</p></div><div class="section-actions"><button class="btn small" onclick="familyAction('school')">延师课子 · 70两</button></div></div><div class="member-grid">${people.map(memberCard).join('')}</div>`;
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
  const scholars=state.members.filter(m=>m.bornInFamily&&m.sex==='男').sort((a,b)=>EXAM_ORDER.indexOf(b.exam)-EXAM_ORDER.indexOf(a.exam)||a.generation-b.generation);
  const rows=scholars.map(m=>{const exam=nextExam(m),can=exam&&m.alive&&m.resident&&m.age>=exam.minAge&&m.learning>=exam.minLearning&&exam.open();return`<tr><td><b>${esc(m.name)}</b><br><span class="muted">${m.age}岁 · 第${m.generation}代</span></td><td>${esc(m.honor||m.exam)}${m.examFails?`<br><span class="red">落第${m.examFails}次</span>`:''}</td><td>${Math.floor(m.learning)}</td><td>${m.officeRank?esc(OFFICES[m.officeRank]):'未仕'}${m.officeRank?`<br><span class="muted">任职${m.officeYears}年</span>`:''}</td><td>${exam?(can?`<button class="btn small gold" onclick="attemptExam(${m.id})">应${exam.name}</button>`:`<span class="muted">${esc(examStatus(m))}</span>`):'<span class="jade-text">金榜题名</span>'}</td></tr>`}).join('');
  const provincial=state.year%3===0?'本年乡试开科':`距乡试${3-state.year%3}年`,metropolitan=state.year%3===1?'本年会试开科':`距会试${(1-state.year%3+3)%3||3}年`;
  $('mainView').innerHTML=`<div class="section-head"><div><h2>科举官途</h2><p>县试、院试随年可考；乡试每三年一次，会试在乡试次年。高官升黜按任职年限、治事、操守、人脉与朝局判定。</p></div><div class="section-actions"><span class="badge gold">${provincial}</span><span class="badge red">${metropolitan}</span></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>族人</th><th>科名</th><th>学问</th><th>官职</th><th>下一步</th></tr></thead><tbody>${rows||'<tr><td colspan="5">暂无应试子弟</td></tr>'}</tbody></table></div><div class="panel" style="margin-top:14px"><h3>官阶迁转</h3><p class="panel-copy">进士初授九品，每任至少四年才可能升迁。正一品并非“进度条终点”：党争中的一次联名、改朝换代时的一次误判，都可能让三代经营归零。清白守正可抵御弹劾，入仕族策能加快升迁，但也会扩大风险。</p></div>`;
}

function renderMarriageTab(){
  const eligible=state.members.filter(eligibleForMarriage);
  const candidates=eligible.length?eligible.map(m=>`<div class="marriage-row"><div><h3>${esc(m.name)} <span class="badge">${m.sex} · ${m.age}岁</span></h3><p>第${m.generation}代 · ${esc(m.trait)} · ${esc(m.exam)} · 当前${esc(m.assignment)}<br>${m.sex==='女'?'可正常出阁结盟，也可选择寒门才子入赘承嗣。':'新妇入门后将参与掌家，并为本房延续血脉。'}</p></div><button class="btn primary" onclick="openMarriage(${m.id})">查看三份名帖</button></div>`).join(''):`<div class="empty"><b>眼下无人适龄议亲</b>族人年满十八且未婚时，可在这里交换婚书。</div>`;
  const alliances=state.alliances.length?state.alliances.slice().reverse().map(a=>`<span class="alliance-chip">第${a.year}年 · ${esc(a.member)} × ${esc(a.spouse)} · ${esc(a.house)}${a.uxorilocal?'（入赘）':''}</span>`).join(''):'<span class="muted">尚未结成外姓姻亲</span>';
  $('mainView').innerHTML=`<div class="section-head"><div><h2>婚姻人脉</h2><p>高攀会消耗妆奁与家底，低娶低嫁却可能错过官场网络。女儿出阁仍入本谱；需要承嗣时，也能择寒门才子入赘。</p></div></div><div class="marriage-list">${candidates}</div><section class="panel" style="margin-top:15px"><h3>已结姻亲 · ${state.alliances.length}门</h3><div>${alliances}</div></section>`;
}

function assetCost(type){const a=state.assets;if(type==='fields')return Math.round((88+a.fields*1.25)*(state.policy==='置业'?.9:1));if(type==='shops')return 230+a.shops*75;if(type==='workshops')return 190+a.workshops*55;if(type==='granaries')return 160+a.granaries*70;return 280+a.houses*110}
function renderEstate(){
  const a=state.assets,assets=[
    ['fields','田地',`${fmt(a.fields)}亩`,'田租与粮食根基。灾年可能受损，却不会因罢官消失。','再置十亩'],
    ['shops','商铺',`${a.shops}间`,'提供稳定现银；商贸族策下收益更高。','添置商铺'],
    ['workshops','作坊',`${a.workshops}处`,'经营纸墨、织造或榨油，收益低于远商但稳妥。','开设作坊'],
    ['granaries','粮仓',`${a.granaries}座`,'提高田亩实际收成，灾年也更能周转。','扩建粮仓'],
    ['houses','宅院',`${a.houses}进`,'门第的外在体面，也容得下更多支房同住。','扩建宅院'],
    ['books','藏书',`${fmt(a.books)}卷`,'提高科举准备与著述积累；火灾时尤其脆弱。','由藏书楼经营']
  ];
  $('mainView').innerHTML=`<div class="section-head"><div><h2>田庄产业</h2><p>每年田亩产粮，商铺、作坊和官俸产银；族人读书、做官与日常生活都要持续花费。</p></div></div><div class="asset-grid">${assets.map(x=>`<article class="asset-card"><h3>${x[1]}</h3><p>${x[3]}</p><div class="asset-value">${x[2]}</div>${x[0]==='books'?`<button class="btn small" onclick="upgradeProject('library')">扩充藏书楼</button>`:`<button class="btn small" onclick="buyAsset('${x[0]}')">${x[4]} · ${assetCost(x[0])}两</button>`}</article>`).join('')}</div><section class="panel" style="margin-top:14px"><h3>本年常例账</h3><p class="panel-copy">上年收成约${fmt(state.lastYearReport.harvest)}石，口粮用去${fmt(state.lastYearReport.consumption)}石；产业、田租与俸禄进银${fmt(state.lastYearReport.income)}两，家用、束脩与官场往来支银${fmt(state.lastYearReport.expense)}两。实际数目会受地方、朝局、族策、掌家者与随机灾患影响。</p></section>`;
}

function renderAncestral(){
  const projects=Object.entries(PROJECTS).map(([key,p])=>{const level=state.projects[key],cost=Math.round(p.base*(1+level*.72));return`<div class="project"><div><h3>${p.name} <span class="project-level">第${level}阶</span></h3><p>${p.desc}</p></div><button class="btn small ${level>=4?'':'gold'}" ${level>=4?'disabled':''} onclick="upgradeProject('${key}')">${level>=4?'已完备':`修建 · ${cost}两`}</button></div>`}).join('');
  $('mainView').innerHTML=`<div class="section-head"><div><h2>宗祠家法</h2><p>家风不是口号。族人的选择会慢慢改变五项倾向，并反过来影响收成、科举、官灾、婚育和分家。</p></div><div class="section-actions"><button class="btn small jade" onclick="familyAction('rite')">合族祭祖</button><button class="btn small" onclick="familyAction('relief')">乡里赈济</button></div></div><div class="panel-grid"><section class="panel"><h3>五项家风</h3>${valueMeters()}</section><section class="panel"><h3>祖训与族策</h3><p class="panel-copy"><b>${state.precept}</b>：${PRECEPTS[state.precept].desc}<br><br><b>${state.policy}</b>：${POLICIES[state.policy].desc}<br>${POLICIES[state.policy].effect}</p><button class="btn small" style="margin-top:14px" onclick="openPolicy()">重议族策</button></section></div><div class="project-list" style="margin-top:14px">${projects}</div>`;
}

function valueMeters(){
  const labels={learning:'家学',integrity:'清正',unity:'和族',enterprise:'营生',martial:'武备'};
  return Object.entries(labels).map(([k,v])=>`<div class="meter-row"><span>${v}</span><div class="bar ${k==='unity'?'jade':k==='enterprise'?'gold':''}"><i style="width:${clamp(state.values[k],0,100)}%"></i></div><b>${Math.floor(clamp(state.values[k],0,100))}</b></div>`).join('');
}

function renderChronicle(){
  const logs=state.logs,rows=logs.length?`<ul class="log-list">${logs.map(l=>`<li class="${l.type}"><time>家历${l.year}年 · ${eraShort(l.year)}</time>${esc(l.text)}</li>`).join('')}</ul>`:`<div class="empty"><b>谱上无事</b>家门大事将在此记录。</div>`;
  const dead=state.dead.length?state.dead.slice().reverse().map(d=>`<span class="alliance-chip">${esc(d.name)} · 享年${d.age}${d.office?` · ${esc(d.office)}`:''}</span>`).join(''):'<span class="muted">尚无祠中先人</span>';
  $('mainView').innerHTML=`<div class="section-head"><div><h2>百年家史</h2><p>科名、升黜、婚盟、生死、产业与家门选择都会写进年谱。导出存档即可保存这一条独有世系。</p></div><div class="section-actions"><button class="btn small" onclick="exportSave()">导出整部家史</button></div></div><section class="panel"><h3>祠中先人 · ${state.dead.length}位</h3>${dead}</section><section class="panel" style="margin-top:14px"><h3>大事年表</h3>${rows}</section>`;
}

function renderSide(){
  const rank=currentRank(),next=nextRank(),unmarried=state.members.filter(eligibleForMarriage).length,students=residents().filter(m=>m.assignment==='读书').length,officials=residents().filter(m=>m.officeRank).length;
  const warnings=[];
  if(state.resources.grain<residents().length*18)warnings.push('存粮不足两年口粮，若再遇灾年会伤及全族健康。');
  if(state.resources.silver<50)warnings.push('现银吃紧，科举、婚礼与灾年选择都会受到限制。');
  if(state.values.unity<28)warnings.push('几房离心严重，争产与分家事件更容易爆发。');
  if(unmarried>=3)warnings.push(`有${unmarried}名适龄族人尚未议亲，血脉与姻亲网络都会停滞。`);
  const nextExamText=state.year%3===0?'乡试正在开科':state.year%3===1?'会试正在开科':'本年无大比';
  $('sideView').innerHTML=`
    <section class="side-panel"><h3>门第进境</h3><div class="big-number">${familyScore()}</div><p class="panel-copy">${rank.name}${next?`，距${next.name}尚差${Math.max(0,next.score-familyScore())}族望。`:'，已至最高门第。'}</p><div class="bar gold" style="margin-top:10px"><i style="width:${next?clamp((familyScore()-rank.score)/(next.score-rank.score)*100,3,100):100}%"></i></div></section>
    <section class="side-panel"><h3>本轮族策</h3><div class="policy-name">${state.policy}</div><p class="panel-copy">${POLICIES[state.policy].effect}<br>第${state.year-state.lastPolicyYear+1}年 / 十年</p></section>
    <section class="side-panel"><h3>族中简册</h3><ul class="plain-list"><li class="row-between"><span>读书子弟</span><b>${students}人</b></li><li class="row-between"><span>在朝官员</span><b>${officials}人</b></li><li class="row-between"><span>外姓姻亲</span><b>${state.alliances.length}门</b></li><li class="row-between"><span>科场时序</span><b>${nextExamText}</b></li></ul>${warnings.map(w=>`<div class="warning">${w}</div>`).join('')||'<div class="tip">眼下家用平稳。趁承平年景培养下一代，不要只依赖一名高官。</div>'}</section>`;
}

document.addEventListener('DOMContentLoaded',()=>{
  renderStartChoices();
  $('startButton').addEventListener('click',startGame);$('resumeButton').addEventListener('click',resumeGame);
  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{activeTab=tab.dataset.tab;renderAll()}));
});
