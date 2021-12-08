<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-08 17:29:13
 * @Description: 
-->

<template>
    <section >
        <h1 class="welcome" >
            Welcome
            {{$store.state.userInfo.name}}
        </h1>
    </section>
</template>

<script>
import oMethods from './js/welcome.js';

export default {
    name: "welcome",
    data(){
        return {
            aRoot: [],
        };
    },
    created(){
        // this.logFn();
        console.log(this.logFn);
    },
    methods: {
        ...oMethods,
    },
};

</script>

<style scoped src="./style/welcome.scss" lang="scss">
</style>