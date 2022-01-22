<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-22 19:28:52
 * @Description: 
-->

<template>
    <section class="outer" >
        <h2>{{aDisks}}</h2>
        <ul>
            <li v-for="(cur, idx) of oConfig.aRoot" :key="idx"
                @click="choseRoot(cur)"
            >
                {{cur}}
                <el-button type="text" @click="showDialog(cur)">
                    弹出窗口
                </el-button>
            </li>
        </ul>
        <br/>
        <h2>当前浏览：{{aPath.join('/')}}</h2>
        <br/>
        <!-- ▼宝库 -->
        <article class="directory-list" >
            <ul v-for="(aColumn, i1) of aTree" :key="i1">
                <li v-for="(cur, i2) of aColumn" :key="i2"
                    @click="ckickTree(i1, i2, cur)"
                    :class="{active: cur.sItem == aPath[i1+1]}"
                >
                    <i v-if="cur.isDirectory"
                        class="folder-mark fas fa-folder"
                        :class="{'has-media': cur.hasMedia}"
                    />
                    <i v-else-if="cur.isMedia" class="fas fa-circle"
                        :class="cur.srt ? '' : 'no-match'"
                    />
                    {{cur.sItem}}
                </li>
            </ul>
        </article>
    </section>
    <!--  -->
    <el-dialog title="初始化" width="900px"
        v-model="dialogVisible"
    >
        <el-tree node-key="id1" default-expand-all
            :data="dataSource" :expand-on-click-node="false"
        >
            <template #default="{ node, data }">
                <span class="tree-line">
                    <span>
                        {{ node.label }}
                        <span v-if="data.hasMedia">
                            （{{ data.hasMedia }}）
                        </span>
                    </span>
                    <span v-if="data.hasMedia" >
                        <el-button type="text" @click="getFolder(data)">
                            入库
                        </el-button>
                    </span>
                </span>
            </template>
        </el-tree>
        <!-- ▼按钮▼ -->
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">
                    Cancel
                </el-button>
                <el-button type="primary" @click="dialogVisible = false">
                    Confirm
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script>
import oMethods, {dataSource} from './js/shelf.js';

export default {
    name: "shelf",
    data(){
        return {
            dataSource: [],
            // dataSource,
            aDisks: document.body.disks,
            oConfig: window.oConfig,
            aPath: [window.oConfig.aRoot[0]],
            aTree: [],
            dialogVisible: false,
        };
    },
    mounted(){

    },
    watch: {
        aPath: {
            deep: true,
            immediate: true,
            handler(aNewVal){
                this.getDirChildren();
            },
        },
    },
    methods: {
        ...oMethods,
    },
};
</script>

<style scoped src="./style/shelf.scss" lang="scss">
</style>


