/*
 * @Author: 李星阳
 * @Date: 2021-11-28 14:36:56
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-12-06 16:57:47
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
        path: '/study-lounge',
        name: 'studyLounge',
        name_: '自习室',
        component: ()=>import(/* webpackChunkName: "study-lounge" */ '../pages/study-lounge/study-lounge.vue'),
    },{
        path: '/settings',
        name_: '设置',
        component: ()=>import(/* webpackChunkName: "settings" */ '../pages/settings/settings.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;

