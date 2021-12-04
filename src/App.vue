<template>
    <myNav class="left-part" />
    <div class="right-right">
        <router-view></router-view>
    </div>
</template>

<script>
import myNav from './components/navigation/navigation.vue';

export default {
    name: "app",
    components: {
        myNav,
    },
    created(){
        console.log('this', this);
        console.log('process', process);
    },
};
</script>

<style lang="scss" >
body{
    background: #eee;
}
#app{
    opacity: 1;
    outline: solid 1px;
    outline: solid 1px;
    display: flex;
    min-height: 100vh;
}
.left-part{
    flex: none;
}
.right-right{
    flex: auto;
}
</style>



