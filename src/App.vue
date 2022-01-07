<template>
    <myNav class="left-part" />
    <div class="right-right">
        <router-view v-if="show" ></router-view>
    </div>
</template>

<script>
import myNav from './components/navigation/navigation.vue';
const { ipcRenderer } = require('electron');

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
        ipcRenderer.on('asynchronous-reply', (event, ...arg) => {
            console.log('主进程来信打印如下：\n', arg);
        });
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



