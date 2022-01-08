<!--
 * @Author: 李星阳
 * @Date: 2021-12-04 15:18:43
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-08 15:11:08
 * @Description: 
-->
<template>
    <div class="outter" >
        <ul class="nav-ul" >
            <li v-for="(cur,idx) of aRoutes" :key="idx" >
                <router-link :to="cur.path" >
                    {{cur.name_}}    
                </router-link>
            </li>
        </ul>
        <br/>
        <button @click="toF5()">
            页面刷新
        </button>
        <br/>
        <button @click="toF5(true)">
            刷新清空
        </button>
    </div>
</template>

<script>
import {routes} from '../../router/router.js';

export default {
    name: 'navigation',
    data(){
        return {
            aRoutes: routes,
        };
    },
    created(){

    },
    methods:{
        async toF5(willClear){
            if (willClear) console.clear();
            else console.log('\n刷新========================');
            this.$root.show = false;
            await this.$nextTick();
            this.$root.show = true;
        },
    },
};
</script>

<style scoped src="./style/navigation.scss">
</style>