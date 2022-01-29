<!--
 * @Author: 李星阳
 * @Date: 2022-01-23 18:49:41
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-29 18:55:23
 * @Description: 
-->
<template>
    <article>
        <br/>
        <br/>
        <br/>
        <!-- class="dictionary" -->
        <component 
            :is="beDialog ? 'el-dialog' : 'div'"
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
            <ul class="result-list" >
                <li v-for="(cur,idx) of aResult" :key="idx">
                    {{cur.text}}
                </li>
            </ul>
        </component>
    </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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
const aResult = ref([]);
let iSearchingQ = 0;
// ▼方法
function toSearch(){
    const sAim = sKey.v || props.word;
    if (!sAim) {
        aResult.v = [];
        return;
    }
    (async idx => {
        const aRes = await fnInvoke(
            'db', 'searchLineBybWord', sAim,
        ).catch(err => {
            console.log('查询出错\n', err);
        });
        if (idx != iSearchingQ) return;
        aResult.v = aRes || [];
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

<style lang="scss"
    src="./style/dictionary.scss" 
></style>