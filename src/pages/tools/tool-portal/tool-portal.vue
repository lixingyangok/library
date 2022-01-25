<!--
 * @Author: 李星阳
 * @Date: 2022-01-25 17:22:53
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-25 17:45:54
 * @Description: 
-->

<template>
    <div class="coat" >
        <ul class="nav" >
            <li v-for="(cur,idx) of aTools" :key="idx">
                <router-link :to="cur.path">
                    {{cur.name_}}
                </router-link>
            </li>
        </ul>
        <!-- 分界 -->
        <article>
            <router-view></router-view>
        </article>
    </div>
</template>


<script>
import {aTools} from '../../../router/router.js';

export default {
    name: 'tool-portal',
    data(){
        return {
            aTools,
        };
    },
};
</script>

<style lang="scss" src="./style/tool-portal.scss">
</style>