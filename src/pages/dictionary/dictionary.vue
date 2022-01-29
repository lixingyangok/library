<!--
 * @Author: 李星阳
 * @Date: 2022-01-23 18:49:41
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-28 21:22:51
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
            <input v-model="sKey" 
                @keydown="toSearch"
            />
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
import { ref, computed } from 'vue';

const props = defineProps({
    dialogVisible: Boolean,
    beDialog: Boolean,
});
const emit = defineEmits(['update:dialogVisible']);
console.log('emit---\n', emit);
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
// ▼方法
async function toSearch(){
    if (!sKey.v) return;
    aResult.v = [];
    console.log('搜索：', sKey.v);
    const aRes = await fnInvoke(
        'db', 'searchLineBybWord', sKey.v
    ).catch(err=>{
        console.log('查询出错\n', err);
    });
    console.log('搜索结果：', aRes);
    if (!aRes) return;
    aResult.v = aRes;
}
</script>

<style lang="scss"
    src="./style/dictionary.scss" 
></style>