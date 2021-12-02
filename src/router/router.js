/*
 * @Author: 李星阳
 * @Date: 2021-11-28 14:36:56
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-02 20:28:55
 * @Description: 
 */
import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: ()=>import(/* webpackChunkName: "welcome.vue" */ '../pages/welcome/welcome.vue'),
        },{
            path: '/t01',
            component: ()=>import(/* webpackChunkName: "t01" */ '../pages/t01.vue'),
        },{
            path: '/t02',
            component: ()=>import(/* webpackChunkName: "t02" */ '../pages/t02.vue'),
        },
    ],
});


export default router;