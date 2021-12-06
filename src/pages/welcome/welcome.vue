<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-06 16:56:09
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

export default {
    name: "welcome",
    data(){
        return {
            aRoot: [],
        };
    },
    created(){
        
    },
    methods: {},
};

</script>

<style scoped src="./style/welcome.scss" lang="scss">
</style>