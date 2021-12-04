<!--
 * @Author: 李星阳
 * @Date: 2021-12-04 15:18:43
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-04 15:27:23
 * @Description: 
-->
<template>
    <ul class="nav-ul" >
        <li v-for="(cur,idx) of aNav" :key="idx" >
            <router-link :to="cur.link" >
                {{cur.name}}    
            </router-link>
        </li>
    </ul>
</template>

<script>
export default {
    name: 'navigation',
    data(){
        return {
            aNav: [{
                name: '首页',
                link: '/',
            },{
                name: 't01',
                link: '/t01',
            },{
                name: 't02',
                link: '/t02',
            }],
        };
    },
};
</script>

<style scoped src="./style/navigation.scss">
</style>