import {toRefs, reactive, computed, onMounted, getCurrentInstance} from 'vue';
import {SubtitlesStr2Arr, fixTime, copyString, downloadSrt, fileToStrings} from '../../../common/js/pure-fn.js';
import {figureOut} from './figure-out-region.js';
import {getTubePath} from '../../../common/js/common-fn.js';


export function mainPart(){
	const oDom = reactive({
		oIframe: null,
		oMyWave: null, // 波
		oTextArea: null, // 输入框
		oSententList: null, // 字幕列表
		oSententWrap: null, // 字幕外套
		oTxtInput: null, // 文本字幕的Input
		oLeftTxt: null, // 文本字幕的DOM容器
		oLeftTxtWrap: null, // 文本字幕的DOM容器
	});
	const oOperation = { // 编辑功能
		oIdStore: {}, // 查出来立即存在这
		aLineArr: [],
		oAllLine: {}, // 查出来就保存上，备份
		iCurLineIdx: 0,
		aHistory: [{ sLineArr: '[]', iCurLineIdx: 0 }],
		iCurStep: 0,
		deletedSet: new Set(), // 已删除的行id.
		iWriting: -1,
		iMatchStart: 0,
		iMatchEnd: 0,
		oRightToLeft: {}, // 对照表
	};
	const oInputMethod = { // 输入法
		sTyped: '',
		aCandidate: [], // 计算所得的候选词
		aFullWords: [], // 所有词（候选词的缺省）
		aWordsList: [[], []], // 关键词，专有名词
		oKeyWord: {}, // 关键词
		oProperNoun: {}, // 专有名词
	};
	const visiableControl = { // 控制窗口显隐
		isShowDictionary: false,
		isShowNewWords: false,
		isShowMediaInfo: false,
	};
	const oData = reactive({
		...oOperation,
		...oInputMethod,
		...visiableControl,
		sMediaSrc: getTubePath(ls('sFilePath')),
		sHash: '',
		oMediaInfo: {}, // 库中媒体信息
		oMediaBuffer: {}, // 媒体的波形信息
		iSubtitle: 0, // 字幕状态：0=默认，-1=查不到字幕，1=有字幕
		sSearching: '', // 查字典
		iShowStart: 0,
		aSiblings: [], // 当前媒体的邻居文件
		iHisMax: 30, // 最多历史记录数量
		iLineHeight: 35, // 行高xxPx
		isShowLeft: !!false,
		leftType: '',
		sArticle: '',
		aArticle: [],
	});
	const oInstance = getCurrentInstance();
	// ▼当前行
	const oCurLine = computed(()=>{
		return oData.aLineArr[ oData.iCurLineIdx ];
	});
	// ▼ 抓捕字幕的正则表达式
	const reFullWords = computed(()=>{
		if (!oData.aFullWords.length) return;
		const arr = oData.aFullWords.concat().sort((aa,bb)=>{
			return bb.length - aa.length;
		});
		return new RegExp(`\\b(${arr.join('|')})\\b`, 'gi');
	});
	// ▼ 字幕文件位置（todo 用tube管道取
	const sSubtitleSrc = (()=>{
		const arr = oData.sMediaSrc.split('.');
		arr[arr.length-1] = 'srt';
		return arr.join('.');
	})();
	// ▲数据 ====================================================================================
	// ▼方法 ====================================================================================
	async function init(){
		oDom?.oMyWave?.cleanCanvas(true);
		oData.iCurLineIdx = 0;
		oData.aLineArr = [];
		await vm.$nextTick();
		const hash = await fnInvoke("getHash", ls('sFilePath'));
		if (!hash) throw '没有hash';
		const aRes = await fnInvoke('db', 'getMediaInfo', {hash});
		console.log('库中媒体信息\n', aRes[0]?.$dc());
		if (!aRes?.[0]) return;
		oData.sHash = hash;
		oData.oMediaInfo = aRes[0];
		getLinesFromDB();
		await getNeighbors();
		getNewWords();
	}
	// ▼查询库中的字幕
	async function getLinesFromDB(){
		const aRes = await fnInvoke('db', 'getLineByMedia', oData.oMediaInfo.id);
		if (!aRes?.length) {
			if (oData.oMediaBuffer) setFirstLine();
			oData.iSubtitle = -1; // -1 表示文件不存在 
			return;
		}
		oData.oIdStore = aRes.reduce((oResult, cur)=>{ // 保存所有id
			oResult[cur.id] = true;
			return oResult;
		}, {});
		const aLineArr = fixTime(aRes);
		const sLineArr = JSON.stringify(aLineArr);
		oData.aHistory[0].sLineArr = sLineArr;
		oData.iSubtitle = 1;
		oData.aLineArr = aLineArr; // 正式使用的数据
		oData.oAllLine = JSON.parse(sLineArr).reduce((oResult, cur)=>{
			oResult[cur.id] = cur;
			return oResult;
		}, {});
	}
	// ▼保存1个媒体信息
	async function saveMedia(){
		const arr = ls('sFilePath').split('/');
		const obj = {
			hash: oData.sHash,
			name: arr.slice(-1)[0],
			dir: arr.slice(0, -1).join('/'),
		};
		const oInfo = await fnInvoke('db', 'saveMediaInfo', obj);
		if (!oInfo) throw '保存未成功';
		init();
		console.log('已经保存', oInfo);
	}
	// ▼取得【字幕文件】的数据
	async function getSrtFile(){
		const res01 = await fetch(sSubtitleSrc).catch((err)=>{
			oData.iSubtitle = -1; // -1 表示文件不存在
		});
		if (!res01) return; // 查字幕文件不成功
		const sSubtitles = await res01.text();
		const arr = SubtitlesStr2Arr(sSubtitles);
		if (!arr) return console.log('文本转为数据未成功\n');
		oData.iSubtitle = 1;
		oData.aLineArr = arr;
	}
	// ▼无字幕的情况下，插入一个空行
	function setFirstLine(){
		const oFirst = figureOut(oData.oMediaBuffer, 0, 20);
		oFirst.text = '默认行';
		oData.aLineArr = [oFirst];
		oData.aHistory[0].sLineArr = JSON.stringify([oFirst]);
	}
	// ▼接收子组件波形数据
	function bufferReceiver(oMediaBuffer){
		// console.log('收到波形');
		oData.oMediaBuffer = oMediaBuffer;
		if (oData.iSubtitle != -1) return; // 有字幕则返回
		// ▼需要考虑，因为可能尚没查到字幕，不是没有
		setFirstLine(); 
	}
	// ▼打开字典窗口
	function toCheckDict(){
		oData.isShowDictionary = true;
	}
	// ▼切换单词类型
	async function changeWordType(oWord){
		console.log('单词', oWord.$dc());
		const res = await fnInvoke('db', 'switchWordType', {
			...oWord,
			mediaId: oData.oMediaInfo.id,
		});
		if (!res) return;
		console.log('修改反馈', res);
		getNewWords();
	}
	// ▼删除1个单词
	async function delOneWord(oWord){
		const res = await fnInvoke('db', 'delOneNewWord', {
			...oWord,
			mediaId: oData.oMediaInfo.id,
		});
		if (!res) this.$message.error('删除单词未成功');
		this.$message.success('已删除');
		getNewWords();
	}
	// ▼查询新词
	async function getNewWords(){
		const aRes = await fnInvoke('db', 'getWordsByMedia', {
			mediaId: [oData.oMediaInfo.id].concat(
				oData.aSiblings.map(cur=>cur.id),
			),
			// more: ****
		});
		if (!aRes) return;
		oData.aFullWords = aRes.map(cur => cur.word);
		oData.oProperNoun = {}; // 清空
		oData.oKeyWord = {}; // 清空
		oData.aWordsList = aRes.reduce((aResult, cur)=>{
			let iAimTo = 0;
			if (cur.type == 2) iAimTo = 1;
			aResult[iAimTo].push(cur);
			[oData.oKeyWord, oData.oProperNoun][iAimTo][
				cur.word.toLowerCase()
			] = true;
			return aResult;
		}, [[],[]]);
	}
	// ▼显示一批媒体信息
	async function showMediaDialog(){
		oData.isShowMediaInfo = true;
	}
	// ▼ 查询邻居文件列表
	async function getNeighbors(){
		const aRes = await fnInvoke('db', 'getMediaInfo', {
			dir: oData.oMediaInfo.dir
		});
		if (!aRes) return;
		oData.aSiblings = aRes;
	}
	// ▼跳转到邻居
	function visitSibling(oMedia){
		console.log('oMedia', oMedia.$dc());
		const sFilePath = `${oMedia.dir}/${oMedia.name}`;
		ls('sFilePath', sFilePath);
		oData.sMediaSrc = getTubePath(ls('sFilePath'));
		init();
	}
	// ▼切割句子
	function splitSentence(text, idx){
		if (!reFullWords.v) return [text];
		const aResult = [];
		let iLastEnd = 0;
		text.replace(reFullWords.v, (abc, sCurMach, iCurIdx) => {
			iCurIdx && aResult.push(text.slice(iLastEnd, iCurIdx));
			const sClassName = (
				oData.oKeyWord[sCurMach.toLowerCase()] ? 'red' : 'blue'
			);
			aResult.push({ sClassName, word: sCurMach });
			iLastEnd = iCurIdx + sCurMach.length;
		});
		if (!iLastEnd) return [text];
		if (iLastEnd < text.length){
			aResult.push(text.slice(iLastEnd));
		}
		return aResult;
	}
	// ▼字幕滚动
	function lineScroll(ev){
		oData.iShowStart = Math.floor(
			ev.target.scrollTop / oData.iLineHeight
		);
	}
	// ▼显示左侧
	function showLeftColumn(){
		oData.isShowLeft = !oData.isShowLeft;
	}
	// ▼打开PDF
	function openPDF(){
		console.log('oMediaInfo\n', oData.oMediaInfo.$dc());
		oData.isShowLeft = true;
		oData.leftType = 'pdf';
		const dir = oData.oMediaInfo.dir.replaceAll('/', '\\');
		const bCopy = copyString(dir);
		if (bCopy) vm.$message.success('已复制路径');
		const btn = oDom?.oIframe?.contentDocument?.querySelector('#openFile');
		if (!btn) return;
		btn.click();
	}
	// ▼打开txt
	async function getFile(ev){
		oData.leftType = 'txt';
		oData.sArticle = '';
		oData.isShowLeft = true;
		const fileTxt = await fileToStrings(ev.target.files[0]);
		if (!fileTxt) return;
		ev.target.value = '';
		const aArticle = Object.freeze(fileTxt.split('\n'));
		vm.$message.success(`取得文本 ${aArticle.length} 行`);
		oData.sArticle = fileTxt;
		oData.aArticle = aArticle;
	}
	async function getFileTest(ev){
		oData.leftType = 'txt';
		oData.sArticle = '';
		oData.isShowLeft = true;
		const srt = getTextForTest();
		const aArticle = Object.freeze(srt.split('\n'));
		oData.sArticle = srt;
		oData.aArticle = aArticle;
	}
	// ▼查询是否修改过
	function checkIfChanged(oOneLine){
		if (!oOneLine.id) return true;
		const oOldOne = oData.oAllLine[oOneLine.id];
		return ['start', 'end', 'text'].some(key => {
			return oOneLine[key] != oOldOne[key];
		});
	}
	// ▼保存字幕文件
	function saveSrt(){
		console.log('保存');
		const {dir, name} = oData.oMediaInfo;
		const aName = name.split('.');
		aName[aName.length-1] = 'srt';
		const sName = aName.join('.');
		const bCopy = copyString(dir);
		if (bCopy) vm.$message.success('已复制路径');
		downloadSrt(oData.aLineArr, sName);
	}
	// ============================================================================
	init();
	getFileTest();
	onMounted(()=>{
		// console.log('oDom', oDom.oMyWave);
	});
	const oFn = {
		init,
		bufferReceiver,
		saveMedia,
		toCheckDict,
		changeWordType,
		delOneWord,
		getNewWords,
		getLinesFromDB,
		showMediaDialog,
		splitSentence,
		lineScroll,
		visitSibling,
		openPDF,
		showLeftColumn,
		checkIfChanged,
		getFile,
		saveSrt,
	};
    return reactive({
        ...toRefs(oDom),
        ...toRefs(oData),
		...oFn,
		oCurLine,
    });
};

function getTextForTest(){
	return `
CHAPTER ONE

The Spouter Inn

Call me Ishmael. Some years ago I set out to sea, having little money and nothing particularly interesting to do on shore. I thought I would sail around the world. Whenever I feel like a cold, wet November morning, and I start following funerals, then I know it's time to go back to the wide open sea. It always makes me feel better because the sea is magic - it has always been magic. It is an endless source of life and mystery. 

When I go to sea I always go as a simple sailor and never as a passenger. Why should I pay when I can get paid for my work? I certainly don't mind taking orders from an old sea captain. And if I have to clean the decks, or mend a sail, so what? It's good, honest work and I don't mind it.

The men you meet at sea are both good and bad, and I always try to get along with them. It's wise to be friendly with the people you have to live with on a ship.

But the main reason I want to go to sea is the great whale.

I want to be with those who hunt this mysterious monster.

I put a shirt or two into my bag and left for New Bedford, Massachusetts - that's where you go to find a whaling ship. I didn't know much about the town and it was late and cold when I arrived.

I walked up and down the dark streets, looking for a place to stay.

Finally I saw a small light near the docks and an old sign swinging back and forth in the cold wind of the night.

The Spouter Inn-Peter Coffin. Coffin? What a name for an innkeeper! But it was a cold night and I had nowhere else to go.

The inn was a strange, old place and one part of it leaned to one side. I stood there looking at it for a while. Oh, stop worrying, I thought, you're going whaling soon and that's a hard life! So I entered the Spouter Inn.

It was a small, dark place and the wind howled through the old building. The first thing I saw was an old painting of a ship in a storm, and a giant whale jumping out of the water. It was trying to destroy the ship.

The other sailors in the inn sat at a long table, drinking and talking. I found the landlord, Peter Coffin, and asked him for a room.

"Sorry," he said, "but there's nothing left. Every bed is taken - but if you don't mind sharing a bed with a harpooner, then you have a bed."

"Who is he?" I asked nervously.

"He's not here now," said the landlord, "but if you're going whaling, you had better get used to this sort of thing."

"Well, alright," I replied, "I'll share a bed with any decent man."

"Good," said the landlord. "You want some dinner? Just sit down and it'll be ready soon."

I sat down in the cold inn and waited for dinner. There was no fire and no heat - just a few candles. The landlord said he couldn't afford wood.

After dinner I wanted to go to bed, but I was worried about the harpooner I didn't know.

"What kind of man is this harpooner?" I asked the landlord.

"Why isn't he here?"

"Oh, he's out trying to sell his head."

"What!" I said, thinking it was a joke.

The landlord and the other sailors started laughing.

"He's sold the other four already and now he's trying to sell the fifth. Maybe he's a cannibal - I don't know, but he pays on time and that's all I care about."

I was very tired and not interested in nonsense. I just wanted to go to bed, so I went up to the harpooner's room, which was cold and dark. The man's things were all over the room - a huge harpoon, an old sailor's bag and fish hooks.

Who was this man?

I got into bed and tried to sleep but the mattress was terribly uncomfortable. I soon heard the door open and saw a huge man with a candle in one hand and a human head in the other - so this was the harpooner.

The light of the candle lit up his face and I was very surprised - I suddenly felt cold. I had never seen anyone like him before.

His skin was a purplish yellow, and his face and body were covered with strange tattoos. There was no hair on his head except for a single lock of black hair. I'm not a coward but I immediately thought of running out the door or jumping out the window. I was so scared that I thought the devil himself had entered the room that night.

The harpooner got undressed, lit a small fire and said some kind of prayer to an evil-looking black doll he had pulled out of his pocket. Then he got into bed.

"Who you?" cried the harpooner in a deep voice, lifting his tomahawk. "What you do in my bed? I kill you!"

"Peter Coffin! Help me!" I shouted. "Save me!"

After a moment Peter Coffin came into the room and said, "Don't worry, Queequeg won't hurt you." Then he turned to Queequeg and said, "This man is sharing the bed with you tonight, understand?"

Queequeg was suddenly calm and put down his tomahawk saying, "Me tired. Don't speak now."

He seemed quiet and fell asleep immediately. I felt that I had nothing to be afraid of. After all, he was a clean, peaceful cannibal, and it was better to sleep with a sober cannibal than with a drunk Christian. I turned over and fell asleep. I never slept better in my life.



CHAPTER TWO

The Pequod

Bright sunlight entered the room the next morning and I could hear the sound of carriages and people outside. Queequeg was shaving with the head of his harpoon. I thought this was very strange, but later I learned that harpoons were very sharp.

Queequeg did not say much but he was gentle and polite, and we soon felt like old friends. We went down to breakfast together and saw many other whalers having breakfast. I had some bread and butter with a cup of hot coffee, but Queequeg only ate beef steaks, and plenty of them.

After breakfast I wanted to go to church. I didn't think Queequeg was interested in going to church. But, to my surprise, when I got to the chapel Queequeg was there.

Almost every sailor visits the Whaleman's Chapel before sailing. As we waited for the reverend I read some of the memorials to sailors lost at sea. They all began with "Sacred to the memory of… I read one memorial that made me tremble:

[center]SACRED TO THE MEMORY OF THE LATE

CAPTAIN EZEKIEL HARDY,

WHO WAS KILLED BY A SPERM WHALE

OFF THE COAST OF JAPAN,

AUGUST 3RD, 1833.[/center]

I wanted to hunt and kill whales, but I didn't want whales to hunt and kill me. Would I have the same fate as Captain Hardy?

I was pleased to see the reverend go to the pulpit. It was a strange pulpit because it was built like the bow of a ship, and the reverend climbed up to it on a rope ladder. Father Mapple was the reverend's name and he was loved by all the whalers. He had been a whaler himself many years ago when he was younger.

Today his sermon was about Jonah, who was swallowed by a whale - very appropriate, I thought - and frightening.

We returned to the Spouter Inn and sat in front of a warm fire.

I sat there watching Queequeg thoughtfully. In spite of his strange color and tattooed face and body, he was a dignified, pleasant person. You can't hide a man's soul, and under all those tattoos I could see a simple, honest heart and a kind soul. Here was a man far away from home in a world so different from his own, who was serene and peaceful. He looked wild and yet I began to feel mysteriously attracted towards him. I'll try a pagan friend, I thought, since Christian friends were often quite disappointing.

I asked Queequeg about himself and he told me that he was a native of Kokovoko, an island in the South Pacific. He was related to the royal family there. But he did not want to be a king one day - he wanted a life of adventure. He decided to join a whaling ship that was visiting the island, and one night he left home and went on board the ship.

He learned many things about life at sea and became an excellent harpooner after sailing around the world three times.

After living with Christians he also learned that they could be as bad as the people they were trying to convert.

We felt true affection for each other and became good friends - Ishmael, Queequeg and Yojo, his little black idol.

The next morning we took a boat to the port of Nantucket because that was where we could sign up with a whaling ship.

Choosing a whaling ship was an important decision because we would be at sea for the next three years. Queequeg was not worried about choosing the right ship. He said his little black idol told him that it was my responsibility.

At the port there were three ships to choose from. There was the Devil-Dam - not a good name. Then there was the Tit-Bit, but I chose the Pequod, named after an old Indian tribe of Massachusetts.

"Look at that old ship," I said to Queequeg. "It's a noble ship! It's our ship!"

Queequeg simply nodded and we went aboard to sign up. We met a tough-looking young man.

"Ahoy!" I said. "Are you the captain of the ship?"

"No!" answered the young man. "I'm the first mate of this ship. My name's Starbuck. What do you want?"

"My friend and I want to sign up."

"Have you ever been whaling?" he asked.

"No, but I've been to sea many times, and I want to see what whaling is like."

"You want to see what whaling is like, eh?" he asked, looking at me carefully. "Alright, you'll do."

"But shouldn't I talk to the captain?" I asked.

"Captain Ahab...," he said with a half-smile, "there's plenty of time to get to know him. You'll know him as soon as you see him because he has only one leg. The other one was torn off and eaten by the most monstrous whale of the sea."

"What did that whale do?" I asked nervously.

"You heard me," he said, "and it killed many men."

"What's Captain Ahab like?" I asked.

"He's a strange man, but a good one," said the first mate. "He doesn't speak much but when he does you'd better listen."

"Yes, sir," I replied. "And what about my friend?"

The first mate looked at him with doubtful eyes. "He's a strange fellow - looks like a pagan."

"Things aren't always what they seem," I said. "I know him, he's a good, strong man."

Then Queequeg took his harpoon and pointed to a small piece of wood floating in the sea. His strong arm threw the harpoon and hit it.

The first mate was amazed and said, "Quick! Sign him up!

Quick!" He knew how valuable a good harpooner was on a whaling ship.

Queequeg and I were now happy. We were about to start an exciting adventure at sea hunting giant whales.

While we were walking around the docks, we met a crazy old man. As we walked by him he took my arm and said, "You were on the Pequod. Have you met Captain Ahab yet?"

"No," I said, surprised.

"Have you signed up?"

"Yes, we have, but what do you know about Ahab?"

The crazy old man shook his head and said, "Well, what's done is done. There's no turning back now - but that ship is doomed, doomed! Haven't you seen the demons he keeps in the hold of the ship?"

"Doomed? The demons?" I said laughing. "What are you saying? You're crazy, old man."

He looked at us with his wild eyes and said softly, "Mercy on you."

What nonsense, I told myself, as Queequeg and I hurried away. I turned around and asked, "But who are you?"

"I'm Elijah!" he said.

The name of a prophet, I thought nervously. But I pushed the man and his prophecy out of my mind. This was going to be an exciting voyage, a chance to see the world and hunt whales. That old fool wasn't going to ruin things for me.



CHAPTER THREE

Captain Ahab

The Pequod was scheduled to sail on Christmas Day, and there was a lot of work to do before. We were getting ready for a three-year voyage. There were supplies to load - beef, bread, and water - sails to mend and decks to clean. 

Ships like the Pequod were not owned by one rich man or by the captain. They were owned by whole towns - by old sailors, widows, reverends, shopkeepers, schoolteachers - each person owned a small part of the ship. So when a ship like the Pequod went off to sea the voyage had to be a success because the livelihood of many people depended on it.

During these days Queequeg and I often visited the ship, and I always asked about Captain Ahab. But I never saw him.

Starbuck, the first mate, said he was ill, but he was slowly getting better.

We sailed from Nantucket on a cold Christmas morning, and I had still not seen the mysterious Captain Ahab. The longer he stayed in his cabin and remained invisible, the greater our surprise and curiosity. We heard him, though. At night as we were swinging in our hammocks trying to sleep, we could hear Captain Ahab walking up and down on the deck above us. He made a strange sound when he walked because he had a peg leg.

One night I heard Starbuck say, "Why don't you rest, Captain? My men can't sleep with the noise of your peg leg."

Ahab's answer was loud and clear, "Why should they sleep? Do I sleep? The sound of my leg will make them dream about whales."

I didn't know what to think, but the words of the crazy old man Elijah kept coming back to me.

Starbuck was a Quaker from Nantucket, and a good, honest man. He was tall and quite thin, but very strong. If you looked into his eyes, you could see all the dangers he had faced in his life at sea. He was a quiet individual who faced dangers calmly, and he was patient and understanding with his men.

"I won't have a man on my ship who isn't afraid of a whale," he often said.

He knew what enormous damage a whale could do. He didn't want heroes on the Pequod - he only wanted good men who were aware of their opponent's strength. He knew from experience that a fearless man was more dangerous than a coward.

Stubb, the second mate, was a cheerful man from Cape Cod, who laughed at everything. Even while chasing a whale, he remained calm and relaxed. His pipe was never far from his lips and he kept a dozen of them near his hammock.

Flask, a short, robust young man from Martha's Vineyard, was the third mate. For him whale hunting was a big joke, and the whale was just like an enormous water rat. Flask had fun chasing whales around the world.

Starbuck, Stubb and Flask were much more than just mates on the Pequod. If Ahab had been a mediaeval king, they would have been his knights, and the harpooners would have been his squires.

Each mate commanded his own whale boat with sailors when he went out to chase the great whales. And each mate could choose his own harpooner. Starbuck chose Queequeg as his personal harpooner.

Tashtego, a strong, muscular American Indian from Martha's Vineyard, was Stubb's chosen harpooner. He had long, black, shiny hair and came from a tribe of great hunters. He had replaced his bow and arrow with a harpoon.

The third harpooner was called Daggoo, a gigantic black man, who wore a huge gold earring in each ear. His physical power was impressive.

The other members of the crew came from all over the world - from the Azores, Greenland, the Shetland Islands and Wales.

And so we set off on Christmas morning, thinking about what would happen during this long, three-year voyage. I was proud to be on the Pequod with these brave whalers and happy to be learning this honorable profession.

Several days passed as we sailed through the icy, dark waters of the North Atlantic. But we had not seen Captain Ahab yet; he remained in his cabin.

Then one morning I looked up at the deck and there he was.

Captain Ahab, at last! His tall, strong body looked like it was made of bronze. He was all dressed in black except for his white peg leg - a grim figure. His face, wrinkled after years of sun, wind and sea water, was long and without expression. It was ruined too by a long scar that ran from his forehead, down his cheek and neck, and disappeared under his collar. Did the scar go all the way to his feet? There were rumors that the scar had been made during a battle at sea. I learned that the ship's carpenter had made the peg leg from the bone of a sperm whale.

Ahab placed his peg leg in a special hole on the quarterdeck.

This kept him balanced when the ship was in rough waters. In spite of his peg leg, Captain Ahab stood straight and looked ahead. His face showed immense pain.

He spoke to no one and no one spoke to him. After standing for a while on the deck he went back to his cabin. As the weather got better, and the ice and icebergs were behind us, we saw more and more of our captain. When we started sailing in tropical waters, the hard, icy expression on his face seemed to melt.



CHAPTER FOUR

The Gold Coin

The days and nights passed and we went about our business. One of my duties was to stay at the masthead and look out for whales. Our masthead was not closed like a nest; it was open, and in bad weather it was difficult to stay there. One night while I was on the masthead I could see Ahab walking back and forth on the deck. He never seemed to sleep - he just walked, and that night his peg leg made an awful noise. He seemed to be nervous and angry, and I wondered why. 

The next morning I found out why. I heard Starbuck call, "All hands on deck!" and the crew rushed onto the deck wondering what had happened.

The moment I saw the captain I knew something was wrong.

The pain and anger in Ahab's heart were slowly coming out.

He put his peg leg into the hole in the deck and when he was perfectly balanced he cried out, "Tell me, men! What do you do when you see a whale?"

"Shout out, sir!" cried the crew, looking up at the captain.

"Good!" he cried. "Then what?"

"We lower the boats and go after him."

Ahab looked at us with fierce satisfaction and suddenly pulled out a large gold coin. "Here is a Spanish gold coin! A sixteen-dollar piece! Do you see it? Mr. Starbuck, give me the hammer!"

He placed the shiny gold coin on the main mast and put a nail through it. The big gold coin was now on the mast and shone in the sun.

"Whoever sees the white whale first will get the gold coin," cried Ahab.

"Hurrah!" cried the men.

"Now listen to me! This is not an ordinary white whale. The whale I'm looking for is a white-headed sperm whale with a wrinkled brow and a crooked jaw. There are three holes in its tail and a twisted harpoon in its hump - that's my harpoon!" He paused and looked at our excited faces.

"Remember, it's a white whale I want - white! I must have it! Look carefully for it. Even if you see a bubble of water, shout out! And if it is the whale I'm looking for, the gold coin is yours!"

The crew cheered again and stared at the shiny gold coin.

"Captain Ahab," said Tashtego, "is that white whale called Moby Dick?"

"Yes!" shouted Ahab fiercely. "Do you know the white whale then, Tash?"

"Yes," replied Tashtego. "He has a strange way of diving."

"I know him too," said Daggoo. "His spout is big and looks like a fountain."

"I saw him," said Queequeg. "He has many harpoons in his body."

A strange smile crossed Ahab's face, a crazy, evil smile that scared me. "Yes, you've seen him. You've seen Moby Dick!"

"Captain Ahab," said Starbuck looking at the captain cautiously, "Wasn't this the whale that took off your leg?"

"Who told you that?" asked Ahab, his smile disappearing.

"Yes, Starbuck, it was Moby Dick who took off my leg. It was that horrid white whale!" And he let out a cry like a hurt animal.

He lifted his long arms, looked up at the sky and cried, "I'll chase him around the Cape of Good Hope to Cape Horn - I'll follow him all over the seas of the world, until he spouts black blood!" Fire burned in his eyes and he stared at each one of us.

"This is why you men are here - to chase Moby Dick all over the world and hunt him until he dies. Are you brave enough to do this? Are you with me?"

"Yes, we are!" shouted the harpooners and the sailors, who were excited and ready to hunt the terrible beast. "We'll keep a sharp eye and a sharp harpoon as well!" said one of the harpooners.

"Bless you, men!" said Ahab, his voice shaking.

The men cheered but Starbuck did not - his face was grim.

"Why such a sad face, Mr Starbuck? Aren't you brave enough to chase the white whale?" asked Ahab suspiciously.

"Oh," replied Starbuck, "I'm brave enough to face his crooked jaw and the jaws of death, too. But I came on board this ship to hunt all whales, not just one whale. I didn't come here to satisfy my captain's revenge. I came here to hunt whales for their oil. That's my business - whale oil. And I'm here to make money on it. How many barrels of whale oil can we make on only one white whale?"

"Money? Is that what's worrying you - money? Oh, my revenge will make me richer here," cried Ahab hitting his chest.

"That whale attacked you because it was his animal instinct, but you want him out of cruelty and revenge. That is madness!" cried Starbuck.

"Madness!" roared Ahab. "Listen to me, man! Moby Dick looks like a stupid animal, but he's not, he's evil - and that is what I hate."

"We are in trouble!" murmured Starbuck.

"Moby Dick is in my mind every moment of the day. He's in my dreams - his existence insults me. I'd strike the sun if it insulted me! White is the color of evil. Ghosts, skeletons, masks - they're all white. Moby Dick's white and he's evil! I'm like a man in prison and he's the wall - the wall that I have to destroy to be free!"

The two men stood face to face, and Ahab knew he was stronger. He stepped back slowly.

The men of the Pequod were excited and enthusiastic, and felt that Ahab's mission was now their mission.

"Mates!" Ahab cried out. "Bring your harpoons to me and cross them."

Starbuck, Stubb and Flask brought their harpoons to cross them in front of Ahab. "Now swear this: Death to Moby Dick! We'll be punished if we don't kill Moby Dick!"

Ahab then turned to the harpooners and said, "Now, harpooners, use the heads of your harpoons as cups and drink to the death of Moby Dick."

Before going to his cabin Ahab turned back and said to all of us, "Remember that you have all made a promise."

I trembled at the thought of what had happened. Captain Ahab was madness itself. And we had sworn to his madness.

I, Ishmael, was one of that crew and my shouts had gone up with the rest. I had sworn too.



CHAPTER FIVE

"There she blows!"

Ahab knew that as captain of the Pequod he had another task which was not his personal revenge. He had to bring back whale oil because that was the purpose of the voyage. That meant we had to kill other whales, not only Moby Dick. 

We all kept our eyes open for any whale and the days passed slowly and easily. Then one day as I was helping Queequeg make a mat, I heard Tashtego, who was high up on the masthead of the ship, cry, "There she blows! There! There!"

We all looked up and in the distance we saw several sperm whales that were blowing as regularly as a clock. My first whale!

This was the moment I was waiting for. Each member of the crew knew what he had to do, but there was still a lot of confusion and running around.

My heart was beating hard and fast. I looked at the whales in the distance. Was one of them Moby Dick? But no, Moby Dick always swam alone. I was relieved because I didn't want to meet him my first time out. It was almost time for the whale hunt that I had been waiting for. The harpoon boats were lowered into the sea, and this was the beginning of the adventure.

But just as I was getting into my boat I saw them - five extra whaling men appeared out of nowhere. I had never seen them before. Who were they? Where did they come from? They were not ghosts, but real men. They must have spent all of this time in the hold. Could they be the demons Elijah was talking about?

Perhaps Elijah was right - these were Ahab's demons! If Elijah was right about the demons, then what else was he right about?

Four harpoon boats were lowered into the water instead of three. Ahab and his crew of expert whale-killers rowed far ahead of the other three boats. The rowers had great power in their arms and they were very determined.

I learned later that one of these men was a Persian called Fedallah, Ahab's personal harpooner. He was tall and dark and wore an old black Chinese jacket, black trousers and a white turban on his head. He was a mysterious figure. The other four looked like natives of the Philippines.

Starbuck was the master of my boat and he stood at the stern and shouted his orders. I suddenly felt afraid and confused away from the ship. I was at eye level with the sea, and there was fog and mist everywhere. This was the whale's world and I was in it.

Everything at that moment seemed impressive to me. How could these men possibly hunt and kill the biggest creature in the sea?

The three boats moved forward and Starbuck, Stubb and Flask were telling their men to row faster and faster.

I was rowing as fast as I could, but I noticed that there was a lot of competition between the boats and the mates. And, of course, the Filipinos were far ahead of us.

The whales swam as fast as we rowed - they were like arrows shooting through the dark water. Would we ever reach them?

"Come on, men!" shouted Starbuck. "Get those muscles moving!"

I wanted our boat to be the first to reach the whales, but my back and legs started hurting. Then a storm arrived from the north and it started raining hard and the waves grew bigger, so it was harder to row. I had never rowed in such an angry sea with the waves crashing into our little boat. How could we reach the whales when we could hardly row?

And in spite of the increasing danger, in the back of our minds was the shiny gold coin nailed to the mast of the Pequod!

"There's his hump," said Starbuck to Queequeg. "Give it to him!"

Suddenly a sperm whale, a creature of incredible size, came to the surface next to our boat. At the same time the rain became much stronger and we could hardly see anything. Queequeg bravely threw his harpoon at the whale, but his hand was wet with rain and he missed it. So the great creature we had tried to kill escaped back down into the deep, dark waters.

Suddenly our oars flew away and we were lifted and then thrown back into the wild waves of the sea. Miraculously our boat did not break, but it was full of water. The cold water left us confused and we couldn't speak. The world around us had become a curtain of white fog. Where was the Pequod and how could we get there since we were surrounded by thick, white fog?

The wind blew loudly and the storm got worse. We sat trembling in the boat half filled with water. Suddenly Queequeg jumped to his feet and put his hand to his ear. Then we all heard the Pequod approaching. It almost crushed our boat with us in it.

We jumped out and the Pequod sailed right over our boat. We then swam as hard as we could to reach the ship.

I was the last man to be pulled onto the ship. I fell onto the deck and was happy to be alive.

I saw Queequeg and said, "Does this sort of thing happen very often?"

"Yes," he answered without much emotion.

"Did we lose any men?" I asked.

"No," said Starbuck. "They're all safely on board."

The other men were sitting on the deck exhausted, telling their own stories of how they had seen death in the face and how they had swum to safety. I soon realized that each time I went out I was risking my life. The sea and the whales were powerful and unforgiving, and I was just a man. I decided I had better write my last will and testament. I went below deck with Queequeg, who was my witness, and wrote my will. He put his mark on the bottom of the page and it became official.



CHAPTER SIX

The Big Whale Hunt

Life can be very lonely at sea. Weeks go by and you don't see anyone other than the members of the crew. But every now and then we were lucky enough to meet another ship. 

One day, southeast of the Cape of Good Hope, we saw another whaler, the Albatross, which was sailing towards home. Everything about the Albatross showed she had spent too many months at sea, too much rough weather, too much sea and salt. She had been away whaling for four years. And her crew looked weathered too. The captains of both ships normally stop and talk with one another, and this is called a "gam". The gam is a time when the two captains and their crews can exchange a few friendly words and find out about their whaling.

But Ahab didn't like gams because they took time away from hunting Moby Dick - his only thought.

So when we saw the Albatross, he shouted, "Ahoy! Have you seen the white whale?"

The captain of the other ship wanted to answer but his trumpet fell into the sea so that was the end of the gam. The crew was not happy about this because the men needed to see and talk to other sailors.

As time went on the white whale began to obsess our minds too - we started seeing it everywhere.

One clear blue morning the Pequod was sailing towards Java through a bright yellow area of plankton. Daggoo thought he saw Moby Dick and shouted, "There! There he is! Right ahead - the white whale!"

Captain Ahab and everyone else rushed to take a look. But to everyone's disappointment, particularly Ahab's, the enormous creature of the sea was a giant squid. This amazing creature was a soft mass of cream-colored flesh with innumerable long arms that grew out of its body and curled and twisted. It slowly disappeared into the deep sea again.

"What was it?" asked Flask.

"It was the great squid, the biggest creature in the universe.

Few whaling ships have ever seen it... and it's an evil omen," said Starbuck, his eyes wide with horror.

But Queequeg didn't agree. "No," he said. "When you see giant squid, then you quick see whales." Ahab had already gone back to his cabin. The giant squid was not remarkable to him: nothing held interest for him, only the white whale. Nothing touched his soul, only Moby Dick.

The next day it was extremely hot and still. It was my turn to stand watch. And all was still in that part of the Indian Ocean. I had been on the masthead for hours and I was growing sleepy.

Suddenly I saw a gigantic sperm whale, its shiny body rolling in the water like an overturned ship. It seemed to be as sleepy as I was.

Could it be Moby Dick? I observed it carefully. No, it wasn't white. It wasn't Moby Dick, but it was a majestic creature.

"There she blows!" a sailor cried and the sleepy ship came to life.

"Lower the boats!" cried Ahab.

I climbed into Stubb's boat this time and was excited about this new whaling adventure. Today I could hunt my first whale!

The sudden cries of the crew and the movement of the boats probably scared the gigantic creature and he started swimming away. He spouted majestically a few times and then suddenly he lifted his tail forty feet into the air and sank into the deep water.

"There he goes under!" cried Stubb, with his pipe in his mouth.

"Don't hurry! Take it slowly, we're almost on him now." We rowed with all of our strength.

"Stand up, Tashtego!" cried Stubb. "Give it to him now!"

Tashtego's muscular arm threw the harpoon and it struck the whale perfectly. The harpoon was attached to a long rope on the bottom of the boat, and the rope started flying out of the boat, following the harpoon. It burned as it passed through our hands. Stubb stood up and held the rope. "Wet the rope!" he cried. "Wet the rope!"

Now we were attached to the whale, and our boat flew through the water as he swam away, desperately trying to get free. Each man held tightly to his seat.

Then Tashtego and Stubb took their harpoons. We got closer to the whale and Stubb threw his first harpoon at the whale and then a second one and then another. The whale swam more slowly now and we brought the boat closer.

The whale's life was almost over, but he tried to escape and survive with all the strength he had left. Stubb threw harpoon after harpoon into the whale's side. Blood began to shoot out and it covered all of us. I had never seen so much blood in my life.

The whale blew the last huge spouts of spray at us and fought until the end. What a strange and tragic sight! A great life was ending before my eyes. The sea around the boat turned red with the whale's blood. Stubb brought the boat closer to the whale and pushed his lance deep into it, piercing his heart.

"He's dead, Mr Stubb," said Tashtego.

"Yes," said Stubb, taking the pipe out of his mouth and shaking the ashes over the sea. He stood there thoughtfully looking at the huge body.



CHAPTER SEVEN

Whale Oil

We had finally killed our first whale, but our work had just begun. Now we had to bring the huge corpse back to the Pequod and cut it up. Eighteen men pulled the whale with three small boats. The job was difficult and tiring - we worked hard for hours, but it never seemed to end. 

When it was dark we were still pulling the dead body back to the boat. Three lanterns hanging from the Pequod helped us find our way back to the ship. As soon as we reached it Ahab looked at the whale with disappointment because it was not Moby Dick.

"Tie him up for the night!" he ordered angrily and went back to his cabin.

"Is that all he can say!" said Stubb. "Oh, who cares? This was a big day for me!" and he laughed. Nothing could make Stubb sad.

"Alright, men," Starbuck shouted, "tie up the whale!"

We were exhausted after the whale hunt but we did not stop to rest - we got the heavy chains and started working. First we tied the head of the whale to the stern of the ship and the tail to the bow. The huge body now rested alongside the Pequod.

"Tomorrow we can begin cutting up the whale," said Stubb with satisfaction. That night he had whale steak for dinner.

After Stubb's dinner, Queequeg and another sailor went on deck and saw that sharks were beginning to eat the dead body of the whale. They were tearing violently at the whale's flesh. Blood flowed freely from the corpse.

"Put lanterns up over whale," said Queequeg to me. "Light up water and whale."

I immediately hung three lanterns on the ship. Their warm yellow light shone on the dead whale and the red sea. Dozens of hungry sharks attacked the corpse and its blood attracted more sharks. It was a terrible spectacle.

"They're eating our whale!" I cried.

Queequeg and the other sailor were lowered on platforms on the side of the ship and started hitting the sharks with their harpoons.

The two men attacked and killed many of the sharks, and finally the hungry creatures started eating each other. This went on for hours.

The next morning was Sunday - the day to start cutting what was left of the whale after the shark attack. This was a new job for me and I wanted to learn it. Every sailor became a butcher and we started cutting up the whale to get the oil it contained, about a hundred barrels. This, after all, was the purpose of our voyage.

The whale's head was the first part to be cut off, and it was a very difficult job because the head was about one-third of the whale's body. Stubb was an expert at cutting whales. He used long, sharp tools and had to work about ten feet above the whale. As he worked, the whale was still floating in the rough sea. He cut deep into the creature's body and through the spinal cord. When the head was cut off it was tied to the stern of the ship for later use.

We worked on the body of the whale next. We cut a small hole in its side and placed a big hook inside the hole. Then a deep line was cut into its flesh and we started pulling on a rope as the whale rolled over and over in the sea.

As the whale rolled the blubber began to break away from its body. The blubber stuck to the body of the whale like orange rind sticks to an orange. And just like an orange rind, the blubber came off in big strips.

As the blubber was peeled the body was slowly lifted out of the water. In the end there was just a bloody mass.

A harpooner picked up a very sharp tool called a boarding sword and said "Stay back" to all of us. Then he put his sword into the mass of blubber three times. He cut the blubber in two and brought it on the ship. We melted it down to oil, putting the precious liquid into barrels to take home.

Now we had to work on the head, an important part of the whale. Inside the head of the sperm whale there are hundreds of gallons of spermaceti. If a whaler is not skilled he can lose this precious substance.

Tashtego tied a thick rope around his waist and then lowered himself into the head of the whale. He started looking for the place where the spermaceti was.

Tashtego lowered a bucket inside the head. When he pulled it up it was full of spermaceti. This work went on for many long hours.

One of the whale's eyes stared at me - it was lifeless. How strange, I thought, our eyes are set in front of our head and we can see only one image, whatever is in front of us. The whale's eyes are set on both sides of its head so that it can see two different images - one on each side of its head. But people see things only one way - their way. If we could see two images instead of one then perhaps we could see two sides to everything.

This was Ahab's great problem. His obsession came from the fact that he could only see Moby Dick in one way - as evil.

Even though I hunted whales and I had sworn to help Ahab hunt Moby Dick, I could not see whales in only one way. I could not see them as all bad.

As I was thinking, Ahab came on deck and stood by me. He stared at the head of the whale and shook his head.

"Oh, head!" he said, "you've been to the bottom of all the oceans, you've seen the deepest mysteries of life, why can't you tell me about them? Why?"

When we had finished working on the whale, we removed the big hooks and chains and the enormous body floated away from the ship and out to sea.



CHAPTER EIGHT

Queequeg's Coffin

The months passed and we continued hunting whales. 

Captain Ahab spent most of his time below the deck in his cabin. He studied his charts and maps and the movement of sperm whales. His obsession with Moby Dick filled his days and his nights.

When Ahab came on deck he walked noisily from bow to stern, and often stopped to stare at the sea. He looked more and more angry. The whales we had caught and the barrels of oil we had stored meant nothing to him.

Ahab often stood in front of the mast where the gold coin was nailed. It was still shiny; it was made of pure gold and we felt it was sacred. It was from South America. On it were images of palm trees, alpacas, volcanoes, stars and suns. It had a Spanish poetic quality. On its round border you could read the words "Republica del Ecuador: Quito". So this bright coin came from a country beneath the great equator, up in the Andes mountains.

For Ahab the coin represented his determination to make the voyage a success. Starbuck, being a religious man, saw the Trinity in the coin. Stubb, instead, saw the signs of the zodiac in it, and the promise of a lot of money. When Flask looked at it he thought about how many cigars he could buy.

It was our good luck charm - it might help us find Moby Dick.

One evening, while Ahab was looking at his maps, Starbuck came to his cabin. He was worried, and said, "We have a serious problem, Captain. The barrels of oil are leaking - they're losing precious whale oil! We have to check all of the barrels."

"Let the barrels leak! I don't care!" said Ahab.

"You don't care!" cried Starbuck in despair. "What will the owners say, sir? When we return to Nantucket after this long voyage the owners will want to see whole oil-barrels full of whale oil! We don't have a choice - we have to check all of the barrels. That way we can see which barrels are leaking and mend them." Starbuck's face was bright red.

"It will take too long," Ahab cried angrily. "We're approaching Japan soon and my maps say we are sure to find Moby Dick in those waters. We're not stopping to fix some old barrels!"

"We've traveled over twenty thousand miles to find this oil - we can't lose it now," said Starbuck, trying to be calm.

At this point Ahab lost control and pulled a gun from the rack on the wall and pointed it at Starbuck.

Ahab was furious, and said, "Remember, there is one god to rule over the earth, and there is one captain to rule over this ship. And I am the lord and master here! Now go!"

Starbuck stared bravely at his captain and said, "I could tell you to beware of me, but you would laugh. But I'm telling you to beware of yourself - you are your greatest enemy."

Starbuck turned around and started walking away. Ahab called out, "You talk bravely but I see you still obey me."

Starbuck continued walking away. Ahab then spoke to himself, "You think I'm my greatest enemy? Yes, there's truth in that." Then he called Starbuck back.

"Starbuck," he said in a sad, low voice, "you're a good man.

Tell the mates to empty the hold where the barrels are and find the leaks. Go!" Ahab put the gun back on the rack.

Starbuck ordered the crew to bring the barrels out of the hold and everyone worked to find the barrels which were leaking. It was a hard job to move and examine all the heavy barrels. It was terribly hot and damp in the hold. Queequeg put all of his strength into his work and soon became very ill with a high fever.

"What's wrong, Queequeg?" I asked, but he could not hear me. He had a strange look on his face as he lay on the deck.

"Queequeg, say something to me!" I said nervously. I felt his forehead and it was burning and wet with sweat.

I helped him to his feet and another crew member and I took him to his hammock. He had never been ill before.

"I'm going to get the ship's doctor!" I said.

"No!" said Queequeg with a weak voice. "Get carpenter for me."

"The carpenter? Are you crazy?"

"Get carpenter," he repeated.

"Please tell me why," I said.

Queequeg explained that he had once seen coffins in Nantucket and they reminded him of the funeral canoes of his people.

He liked this idea because on his island people were sent out to sea in a canoe when they died.

When a sailor died at sea his body was put inside his hammock and then thrown into the water, where he was usually eaten by sharks. Queequeg did not want this to happen to him.

"Get carpenter," he said again. "He make my canoe."

I did not want my dear friend to die, but I did not want him to get upset. So I called the ship's carpenter and he carefully took Queequeg's measurements and built him a coffin. When it was ready Queequeg got inside because he wanted to try it out. Inside he had a paddle for his trip to the other world and his little idol Yojo. Then he asked for the steel head of his harpoon. He closed his eyes peacefully and lay still inside his new coffin.

I knelt down beside him and felt terribly sad and lonely. I thought about our wonderful friendship; I did not want it to end like this.

How could Queequeg possibly die? He was the strongest man on the Pequod. He had saved many men from death. Was this his time to die? A young sailor played the tambourine and it sounded like Queequeg's funeral march.

I have discovered that there is a big difference between primitive people and modern people. Modern people get sick and sometimes it takes them many months to get well. But primitive people can easily get better in a day.

Luckily, that is what happened to Queequeg.

He suddenly got up from his coffin and climbed out.

"Queequeg not dead!" he said with a loud voice. "I remember something Queequeg not do. Queequeg die another day."

He got better as quickly as he got sick, and we could not understand why.

We asked him if dying depended on our will and his answer was, "Certainly!"

We were very surprised and happy that he was well again. His coffin became a sea chest where he kept his clothes and his idol Yojo. He even started decorating the top of the coffin with the same strange designs he had on his body.



CHAPTER NINE

The Candles

Our long voyage continued and we were able to hunt many whales and fill more barrels with precious whale oil. But there still was no sign of Moby Dick. 

Whenever the Pequod met another whaling ship, Ahab's question was always the same, "Have you seen the white whale?" But none of the whaling ships had seen Moby Dick.

"East!" shouted Ahab. "We must sail East - he's there, in the Japanese sea."

We sailed East to the middle of the Japanese sea and the wind started blowing hard and the sea became rough. Black clouds appeared on the eastern horizon, and that night there was the worst storm I had ever seen. The thunder and lightning never seemed to stop. The Pequod was in the middle of a terrible typhoon and I didn't think we could survive. It rained violently and the ship was thrown in every direction.

The crew was on deck trying to hold down the whaling boats. Then it was night and the worst part of the typhoon hit us. The violent wind and rain tore the sails and broke the masts and the towering waves flooded the deck.

Suddenly I looked up at the masts and saw lights at the tips of the sails - they looked like candles.

The sailors stood close together and stared in amazement at the fire that danced in the sky.

"This is a bad omen - a very bad omen!" said Starbuck nervously. "Tell the captain to turn the ship around."

The crew agreed with him and believed that Ahab's obsession with the white whale was the cause of this.

"Turn the ship around!" cried the crew angrily. "Turn it around!"

Ahab finally came on deck. The violent typhoon and the fire meant something completely different to him. He was more determined than ever.

"Look at that fire in the sky!" he cried, pointing to the sky in the middle of the wild storm. "That white fire leads us to the white whale!"

"No, Ahab," cried Starbuck, the rain pouring on his face, "turn the ship around or we will sail to our death!" He grabbed Ahab's arm desperately and cried, "Ahab! This voyage is doomed. It was doomed from the start. Let's get out of here while there's still hope!"

Ahab was not listening and he moved away from Starbuck. He shook his fist at the fire.

"Oh, great fire," shouted Ahab, "I burn with you! You light the way to the white whale! I am not afraid."

"Look at your boat, Ahab!" cried Starbuck, as the frightened crew stared at their captain. "The storm has almost destroyed it and your harpoon is burning!"

Ahab went to get the burning harpoon and waved it among the crew like a torch.

"If any man turns this ship around I'll put this harpoon through his heart!" shouted Ahab fiercely, "Remember, you all swore to hunt the white whale with me, and we will hunt it! We are in this together and we will not turn back. No storm can stop me! No one can stop me!"

"He's... mad," said Starbuck to he crew, "he's afraid of nothing and no one."

The typhoon continued most of the night, but the next morning the sea was calm again and the sky was clear. Starbuck went down to Ahab's cabin. Before entering he stood near the door and looked at the guns on the wall. He remembered when Ahab had threatened him before.

"If I take a gun and kill this madman," he thought, "I could take the Pequod home and save the lives of all the men on this ship - I'll see my wife Mary and my little boy. How can I stop this madman? I know it's wrong to kill - isn't there another way? I could make him a prisoner until the ship reaches a port. But he would be worse than a tiger in a cage. No! Only a fool would make Ahab a prisoner. Oh, if I let him live we will all die, thousands of miles from our home. What shall I do?"

Starbuck stood in front of Ahab's cabin trembling and then returned to the deck.

The violent typhoon had almost destroyed our ship and we were lucky that we did not lose any men. We slowly cleaned the deck, and repaired the masts and the sails. However, the Pequod was not the same ship: the typhoon had taken the life out of it.

At times like these I asked myself if old Elijah was right. Were we really doomed?

"Alright, men," said Starbuck, "let's start sailing again!" He was tired but not discouraged. He knew we had a job to do and he worked as hard as any member of the crew.

One day Starbuck called the crew, "All hands on deck!"

"What's the problem?" asked Stubb.

"There's a ship approaching!" replied Starbuck.

"Hurrah!" cheered the crew happily. We had not seen another ship in a long time and we hoped to receive some news from home. We all ran to the deck.

Ahab did not like these gams because they took time away from his hunt for Moby Dick.

When the two ships were almost side by side I could see the name of the visiting ship - she was the Rachel.

Ahab asked the same thing every time there was a gam.

"Have you seen the white whale?" he shouted.

The captain of the Rachel shouted back, "Yes, yesterday."

Ahab was overjoyed. Then the captain asked, "Have you seen a whale boat?"

"No, I haven't," shouted Ahab.

In a minute the captain of the Rachel came aboard the Pequod, and Ahab recognized him because both captains were from Nantucket.

"Where was he?" asked Ahab excitedly. "You didn't kill him, did you? Tell me!"

"No," replied Gardiner, the captain of the Rachel.

Ahab was relieved because he wanted the white whale all for himself.

The captain of the Rachel then looked at Ahab with a strange expression.

"Three of our fastest whaling boats went out to hunt him but he escaped and we lost some of our men. One of those men is my son - I must find him. You'll help me, won't you, Ahab? I'll pay for your time, anything you ask. But, please, Ahab, join in the search - help me find my son. Together we can find him!"

Gardiner's mouth trembled and there were tears in his eyes. "My son is lost with the other men on the boat. I know he's somewhere in these seas and he's alone. I can almost hear him cry for help! Please, Ahab, help me find my lost son!"

Ahab stood as cold as stone.

"I would do the same for you if your son were lost. I won't go until you say yes!" Gardiner cried.

So Ahab has a son and a wife, I thought. I could hardly believe that such a man had a family at home waiting for his return.

"Captain Gardiner, I won't do it. I have no time for such matters. The white whale is near and I must hunt him. I'm sorry about your... problem, but I can't help you."

Gardiner was very disappointed and returned to his ship.

We could not believe what we had just heard. Ahab had lost all humanity. What had he become? But none of us could say a word. The two ships went their separate ways - the Pequod to hunt the white whale and the Rachel to find Gardiner's lost son.

After a few days Ahab was on deck staring at the blue, cloudless horizon while Starbuck stood next to him.

"Oh, Starbuck!" said Ahab. "It's such a beautiful day - my first day at sea forty years ago was like this. Forty years have passed, forty years of whaling! When I think of the life I've led - the hard work, the loneliness, the hunger and thirst, the hot and cold. I married my wife between voyages and have been away from my family most of the time. Starbuck, look at me. Do I look as old as I feel?"

Starbuck was amazed by Ahab's words and so was I.

"Oh, my Captain!" cried Starbuck, hopefully. "You have a heart, after all! I have a wife and child too. Oh, Ahab! Let's go home to our families. Let's go back to Nantucket! Turn the ship around!"

Ahab looked at the sea and asked, "What is it that drives me on? Is it me? Or is this my fate? Must I hunt the white whale?"

He paused for a moment and then cried, "No, Ahab must go on!

The white whale is my fate!"

Starbuck had lost all hope - Ahab was a victim of his madness.


CHAPTER TEN

Moby Dick!

It was the night of the beautiful day and Ahab was on deck sniffing the sea air, trying to catch the smell of a whale. Suddenly his eyes glowed like fire and he cried, "I'm going up to the masthead! I smell the white whale!" The crew pulled him up in a kind of basket to the masthead, and then we heard a cry. 

"There she blows! There she blows! A hump like a snowy hill!

It's Moby Dick! The coin is mine! It was fate! None of you could see him, only I!"

Ahab had seen the white whale before anyone else and the gold coin was his.

"But I saw him almost at the same instant that Captain Ahab did, and I cried out!" said Tashtego.

"None of you saw it when I saw it - no, the gold coin is mine - Moby Dick is mine!" cried Ahab. "Lower me quickly, Mr Starbuck! Lower three boats, and lower mine too, Mr Starbuck!"

I stared at the sea and couldn't believe what was happening.

As the whale rose we could all see every wrinkle on his huge, white forehead, his crooked jaw, his mouth, and every twisted harpoon on his milk-white back.

"Ishmael," called Starbuck, "help us lower the boats."

We lowered the boats and we were in the water for the biggest hunt of our lives. Ahab was in his boat with his personal harpooner Fedallah and his crew of Filipinos.

A flock of sea gulls flew over the white giant as he swam joyfully in the green-blue sea. Was this gentle giant the killer of so many men? Perhaps he sensed the approaching danger because he suddenly disappeared deep into the sea.

"He's sounded!" shouted Ahab excitedly. "But he'll come back and when he does, I'll be ready for him!"

We all waited. The sea looked like glass and nothing moved.

An hour passed and there was still no sign of the white whale.

We continued waiting but nothing happened. Ahab leaned over his boat and stared into the depths of the sea, and I did the same. I was sure we had lost the white giant because I could see nothing but blackness.

But Ahab saw something - a small white spot deep in the water. He continued staring at it and the white spot grew bigger - a huge, frightening shape was coming up from the depth of the ocean. It rose directly under Ahab's boat. We saw the huge mouth coming out of the sea like an open tomb! Moby Dick suddenly broke the surface of the water and Ahab's boat was thrown into the air.

Ahab lost his harpoon and he and his men were thrown from the boat. Moby Dick began swimming around the broken boat, as if he were playing an evil game. Ahab was cursing his enemy with the worst possible language, as his peg leg pulled him down under water.

Stubb's boat reached Ahab in time and he jumped in and rescued Ahab. He pulled his exhausted captain on board his boat.

Our boat took on some of the other crew members, while the others swam back to the ship.

On the second day we continued hunting Moby Dick, day and night - never stopping.

"There she blows!" was Ahab's cry from the masthead. It was the white whale.

The boats were lowered and, when the men were close to the white giant, they threw their harpoons into him with all their strength and anger. Moby Dick fought fiercely, moving about violently in the water and making the harpoon ropes cross.

Before the ropes could be cut free, he attacked the boats of Stubb and Flask, which crashed together violently. The crews were thrown into the sea. Ahab's boat tried to rescue the men but Moby Dick smashed his white head against the bottom of Ahab's boat. The boat turned over and Ahab and his men struggled out from under it. The great white whale seemed satisfied with the destruction he had caused and swam off.

The Pequod sent a boat to rescue the crew and pick up the bent harpoons and broken oars. Fedallah had disappeared and many men were hurt. Ahab's peg leg was broken and only one sharp piece was left.

"No bones broken, I hope, sir?" said Stubb, worried.

"Even with broken bones, old Ahab is ready to fight the whale!" the captain cried. "No white whale, no man, no devil can touch old Ahab. Get the other boats ready, Mr Starbuck. I'll circle the world ten times, yes, and in the end I'll kill him!"

The sun set and through the long hours of the night everyone was working on the new boats and the new harpoons, while the ship's carpenter was making Ahab a new leg.

The morning of the third day was beautiful and calm. Ahab was up in the masthead again, but there was no sign of Moby Dick.

Suddenly we heard Ahab's voice, "There she blows!" On the horizon a white iceberg rose out of the sea - it was Moby Dick.

My legs felt weak with fear, but the rest of me was alive with excitement. On Starbuck's face there was nothing but fear of what would happen. I could see the whale moving about violently in the water. He seemed to be warning us to stay away, but we did not stay away. Ahab was ready to hunt the white whale.

"Oh, Captain," cried Starbuck, "it's not too late to go back, even now on the third day. Moby Dick doesn't want you. You want him!"

"Lower the boat!" was Ahab's command. When his boat got close to the white whale, we saw a terrible sight: Fedellah's dead body tied to Moby Dick's side with the ropes of his own harpoon!

When Ahab saw him, the harpoon dropped from his hand.

"Fedallah!" he cried. "I can see you again and you have gone before me. Where's the whale? Has he gone down again?"

Moby Dick moved forward with all his strength.

"I will turn my body from the sun," Ahab shouted. "I will give myself to you. You may destroy everything, but you will not conquer me. I will kill you with my hate."

Ahab grabbed his harpoon and threw it into Moby Dick's white flesh with all his anger. But the rope that held the harpoon o the boat caught Ahab's neck. And as Moby Dick swam forward at great speed, the rope pulled Ahab out of the boat in an instant. Ahab was gone.

Suddenly I cried out in panic. Moby Dick was swimming towards the Pequod! He wanted to destroy it with all his blind anger, and he did. He smashed into the ship's side and the crew were sent to their deaths. Within seconds the Peqoud began to sink. But the white whale had not finished his work of destruction. The whale attacked the sinking ship again.

Ahab and the Pequod went down to the great depths of the sea together. The waves rolled by as they had always done.

Epilogue

The drama's done. I, Ishmael, was the only person who survived the last voyage of the P e q u o d. After the ship had sunk Queequeg's coffin came to the surface, and it floated. I swam to the coffin and held on to it for a day and a night. It saved my life.

The sharks and the sea birds did not bother me. On the second day I saw a ship sailing towards me. It was the Rachel, whose captain was looking for his lost son and found me instead.
`.trim();

}
