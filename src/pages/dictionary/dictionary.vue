<!--
 * @Author: 李星阳
 * @Date: 2022-01-23 18:49:41
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-04 21:00:24
 * @Description: 
-->
<template>
    <article class="outer-dom" v-show="isShowSelf">
        <component :is="beDialog ? 'el-dialog' : 'div'"
            v-model="isShowSelf"
        >
            <template #title v-if="beDialog">
                查字典
            </template>
            单词：
            <input v-model="sKey" @input="toSearch"/>
            <button @click="toSearch">
                搜索
            </button>
            {{(aResult.count || []).length}}
            <ul class="result-list" >
                <li v-for="(cur,idx) of aResult.rows" :key="idx">
                    ◆{{idx+1}}
                    <span v-for="(sWord, i02) of cur.text.split(/\s+/g)" :key="i02"
                        :class="splitSentence(sWord, sKey || word)"
                    >
                        {{sWord}}
                    </span>
                </li>
            </ul>
        </component>
    </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { splitSentence } from './js/dictionary.js';

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
const sKey = ref('');
const aResult = ref({});
let iSearchingQ = 0;
// ▼方法
toSearch();
function toSearch(){
    const sAim = sKey.v || props.word;
    if (!sAim) return (aResult.v = {});
    (async idx => {
        const oRes = await fnInvoke(
            'db', 'searchLineBybWord', sAim,
        ).catch(err => {
            console.log('查询出错\n', err);
        });
        if (idx != iSearchingQ) return;
        aResult.v = (oRes || {});
    })(++iSearchingQ);
}

watch(
    isShowSelf,
    (newVal, oldVal) => {
        if (!newVal || !props.word) return;
        console.log('搜索：', props.word);
        toSearch();
    },
);

</script>

<style lang="scss" src="./style/dictionary.scss" ></style>