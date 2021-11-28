/*
 * @Author: 李星阳
 * @Date: 2021-11-28 14:46:14
 * @LastEditors: 李星阳
 * @LastEditTime: 2021-11-28 14:56:26
 * @Description: 
 */
import { createStore } from 'vuex';

const store = createStore({
    state: {
        userInfo: {
            name: 'myName',
        },
    },
    mutations: {
        getUserInfo(state, name) {
            state.userInfo.name = name;
        },
    },
    actions: {
        asyncGetUserInfo({ commit }) {
            setTimeout(() => {
                commit("getUserInfo", +new Date() + 'action');
            }, 2000);
        },
    },
    getters: {
        userInfoGetter(state) {
            return state.userInfo.name;
        },
    },
});

export default store;