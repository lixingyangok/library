<!--
 * @Author: 李星阳
 * @Date: 2022-01-23 18:49:41
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-08-21 16:22:21
 * @Description: 
-->
<template>
    <article class="outer-dom" v-show="!beDialog || isShowSelf">
        <component :is="beDialog ? 'el-dialog' : 'div'"
            v-model="isShowSelf"
        >
            <template #title v-if="beDialog">
                查字典
            </template>
            <div class="search-bar">
                单词：
                <input v-model="sKey" @input="toSearch"/>
                <button @click="toSearch">
                    搜索
                </button>
                <button Aclick="toSearch">
                    全字匹配
                </button>
                <span>
                    结果{{iResult}}条
                </span>
            </div>
            <ul class="result-list" >
                <li v-for="(cur,idx) of aResult" :key="idx">
                    <h3 class="dir" >{{cur.dir.split('/').slice(2).join(' > ')}}</h3>
                    <ul>
                        <li v-for="(item, i02) of cur.aList" :key="i02">
                            <h4 class="file-name" v-if="(i02 === 0) || item.name != cur.aList[i02-1].name">
                                {{item.name}}
                            </h4>
                            <p>
                                <span v-for="(sWord, i02) of splitSentence(item.text, sKey || word)" :key="`${idx}-${i02}`"
                                    :class="{'matched': sWord.word}"
                                >
                                    {{sWord.word || sWord}}
                                </span>
                            </p>
                        </li>
                    </ul>
                </li>
            </ul>
        </component>
    </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { splitSentence, groupThem } from './js/dictionary.js';

const props = defineProps({
    dialogVisible: Boolean,
    beDialog: Boolean,
    word: String,
});
const emit = defineEmits(['update:dialogVisible']);
const isShowSelf = computed({
    get: () => {
        return props.dialogVisible;
    },
    set: val => {
        emit('update:dialogVisible', val);
    },
});
const sKey = ref(''); // 可填入测试用的搜索关键字
const iResult = ref(0); // 搜索结果数量
const aResult = ref({});
let iSearchingQ = 0;
// ▼方法
toSearch();
function toSearch(){
    const sAim = sKey.v || props.word;
    if (!sAim) return (aResult.v = {});
    (async idx => {
        const sWhere = `WHERE text like '%${sAim}%' and text like '% %'`; // 至少包含1个空格  
        const searchRows = fnInvoke('db', 'doSql', `
			SELECT line.text, media.id, media.dir, media.name
            FROM line left join media
            ON line.mediaId = media.id ${sWhere}
            ORDER BY media.dir, media.name
            limit 50
		`);
        const searchCount = fnInvoke('db', 'doSql', `
			SELECT count(*) as iCount FROM line ${sWhere}
		`);
        const oResult = await Promise.all([searchRows, searchCount]);
        if (idx != iSearchingQ) return;
        const [[aRes], [aCount=[]]] = oResult;
        iResult.v = aCount[0]?.iCount;
        const aArr = groupThem(aRes);
        aResult.v = aArr;
    })(++iSearchingQ);
}

watch(
    isShowSelf,
    (newVal, oldVal) => {
        if (!newVal || !props.word) return;
        // console.log('搜索：', props.word);
        toSearch();
    },
);
// fnInvoke(
//     'db', 'searchLineBybWord', sAim,
// ).catch(err => {
//     console.log('查询出错\n', err);
// }).then(res=>{
//     console.log('res')
//     console.log(res)
// })
// COUNT(*) as iCount, 
</script>

<style lang="scss" src="./style/dictionary.scss" ></style>