<!--
 * @Author: 李星阳
 * @Date: 2021-12-04 15:18:43
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-04 15:35:26
 * @Description: 
-->
<template>
    <ul class="nav-ul" >
        <li v-for="(cur,idx) of aRoutes" :key="idx" >
            <router-link :to="cur.path" >
                {{cur.name_}}    
            </router-link>
        </li>
    </ul>
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
};
</script>

<style scoped src="./style/navigation.scss">
</style>