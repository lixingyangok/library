<template>
    <myNav class="left-part" />
    <div class="right-right">
        <router-view></router-view>
    </div>
</template>

<script>
import myNav from './components/navigation/navigation.vue';

export default {
    name: "my-app",
    components: {
        myNav,
    },
    created(){

    },
};
</script>

<style scoped lang="scss" >

.left-part{
    flex: none;
}
.right-right{
    flex: auto;
}
</style>



