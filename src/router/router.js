/*
 * @Author: 李星阳
 * @Date: 2021-11-28 14:36:56
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-04 15:35:05
 * @Description: 
 */
import { createRouter, createWebHashHistory } from 'vue-router';

export const routes = [
    {
        path: '/',
        name_: '首页',
        component: ()=>import(/* webpackChunkName: "welcome.vue" */ '../pages/welcome/welcome.vue'),
    },{
        path: '/shelf',
        name_: '书架',
        component: ()=>import(/* webpackChunkName: "shelf" */ '../pages/shelf/shelf.vue'),
    },{
        path: '/t01',
        name_: 't01',
        component: ()=>import(/* webpackChunkName: "t01" */ '../pages/t01.vue'),
    },{
        path: '/t02',
        name_: 't02',
        component: ()=>import(/* webpackChunkName: "t02" */ '../pages/t02.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;

