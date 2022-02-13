<!--
 * @Author: 李星阳
 * @Date: 2021-12-04 15:18:43
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-13 10:34:00
 * @Description: 
-->
<template>
    <div class="outter" >
        <ul class="nav-ul" >
            <li v-for="(cur,idx) of aRoutes" :key="idx" >
                <router-link class="link" :to="cur.path">
                    <i class="icon" :class="cur.icon_"/>
                    <span class="name" >{{cur.name_}}</span>
                </router-link>
            </li>
        </ul>
        <button @click="$root.f5()">刷新</button><br/>
        <button @click="toF5()">刷新</button>
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
    methods: {
        async toF5(){
            console.clear();
            console.log('\n\n已刷新========================');
            this.$root.f5()
        },
    },
};
</script>

<style scoped src="./style/navigation.scss">
</style>