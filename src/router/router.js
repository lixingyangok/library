/*
 * @Author: 李星阳
 * @Date: 2021-11-28 14:36:56
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-11-28 14:40:12
 * @Description: 
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import HelloWorld from '../components/HelloWorld.vue'


const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: HelloWorld
        },{
            path: '/t01',
            component: ()=>import('../pages/t01.vue')
        },{
            path: '/t02',
            component: ()=>import('../pages/t02.vue')
        },
    ]
})

export default router