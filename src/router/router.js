/*
 * @Author: 李星阳
 * @Date: 2021-11-28 14:36:56
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-02-13 10:31:45
 * @Description: 
 */
import { createRouter, createWebHashHistory } from 'vue-router';


export const aTools = [{
    path: '/tools/alarm-clock',
    name_: '闹钟',
    component: () => import( /* webpackChunkName: "alarm-clock.vue" */
        '../pages/tools/alarm-clock/alarm-clock.vue'
    ),
},{
    path: '/tools/nback',
    name_: 'nback',
    component: () => import( /* webpackChunkName: "nback.vue" */
        '../pages/tools/nback/nback.vue'
    ),
}];


export const routes = [
    {
        path: '/',
        name_: '首页',
        icon_: 'fas fa-desktop',
        // icon_: 'fas fa-poll',
        component: ()=>import( /* webpackChunkName: "welcome.vue" */
            '../pages/welcome/welcome.vue'
        ),
    },{
        path: '/shelf',
        name_: '书架',
        icon_: 'fas fa-folder-open',
        component: ()=>import( /* webpackChunkName: "shelf.vue" */ 
            '../pages/shelf/shelf.vue'
        ),
    },{
        path: '/study-lounge',
        name: 'studyLounge',
        name_: '听写',
        // icon_: 'fas fa-keyboard',
        icon_: 'fas fa-graduation-cap',
        component: ()=>import( /* webpackChunkName: "study-lounge.vue" */ 
            '../pages/study-lounge/study-lounge.vue'
        ),
    },{
        path: '/settings',
        name_: '设置',
        icon_: 'fas fa-cog',
        component: ()=>import( /* webpackChunkName: "settings.vue" */
            '../pages/settings/settings.vue'
        ),
    },{
        path: '/dictionary',
        name_: '字典',
        icon_: 'fas fa-book',
        component: ()=>import( /* webpackChunkName: "dictionary.vue" */
            '../pages/dictionary/dictionary.vue'
        ),
    },{
        path: '/tools',
        redirect: '/tools/alarm-clock',
        name_: '工具',
        icon_: 'fas fa-grip-horizontal',
        component: ()=>import( /* webpackChunkName: "tool-portal.vue" */
            '../pages/tools/tool-portal/tool-portal.vue'
        ),
        children: aTools,
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;

