<!--
 * @Author: 李星阳
 * @Date: 2022-02-04 00:23:27
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-04 00:26:03
 * @Description: 
-->

<template>
    <textarea v-model="sInputing">

    </textarea>
</template>

<script setup>
import {ref} from 'vue';

const sInputing = ref('testing');

</script>

<style scoped>
textarea{
    width: 100%;
    height: 80px;
}
</style>
