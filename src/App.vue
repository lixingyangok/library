<template>
    <myNav class="left-part" />
    <div class="right-right">
        <router-view v-if="show" ></router-view>
    </div>
</template>

<script>
import myNav from './components/navigation/navigation.vue';

export default {
    name: "my-app",
    components: {
        myNav,
    },
    data(){
        return {
            show: true,
        };
    },
    created(){
        window.vm = this;
        // ▼插入一条学习记录
        fnInvoke('db','addOneRecord'); 
        // ▼注册一个方法，用于接收主进程的消息
        oRenderer.on('logInBrower', (event, ...arg) => {
            if (arg.length == 1) arg = arg[0];
            console.log('▼ 主进程来信：\n', arg);
        });
    },
    methods:{
        async f5(){
            this.show = false;
            await this.$nextTick();
            this.show = true;
        },
    },
};
</script>

<style scoped lang="scss" >
.left-part{
    flex: none;
}
.right-right{
    flex: auto;
    overflow: hidden;
}
</style>



