/*
 * @Author: 李星阳
 * @Date: 2021-11-27 21:21:16
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-11-27 21:32:56
 * @Description: 
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import HelloWorld from '../components/HelloWorld.vue';


const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: HelloWorld,
        },{
            path: '/t01',
            component: () => import('../pages/t01.vue'),
        },{
            path: '/t02',
            component: () => import('../pages/t02.vue'),
        },
    ],
});

export default router;