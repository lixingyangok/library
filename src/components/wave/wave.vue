<!--
 * @Author: 李星阳
 * @Date: 2022-01-03 10:09:58
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-03 11:42:33
 * @Description: 
-->
<template>
    新wave----
    {{count}}<br/>
    <p @click="oFn01.aaAdd">{{oData01.aa}}</p>
    <p @click="oFn01.bbAdd">{{oData01.bb}}</p>
</template>
<!--  -->
<script>export default {name: 'my-wave'};</script>
<script setup>
import {ref} from 'vue';
import w01 from './js/wave.js';

const count = ref(0);
const [oData01, oFn01] = w01();
</script>

<style scoped src="./style/wave.scss"></style>