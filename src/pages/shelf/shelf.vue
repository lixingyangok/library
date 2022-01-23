<!--
 * @Author: 李星阳
 * @Date: 2021-12-02 20:27:04
 * @LastEditors: 李星阳
 * @LastEditTime: 2022-01-23 20:29:04
 * @Description: 
-->

<template>
    <section class="outer" >
        <h2>{{aDisks}}</h2>
        <ul>
            <li v-for="(cur, idx) of oConfig.aRoot" :key="idx">
                <span @click="choseRoot(cur)">
                    {{cur}}
                </span>
                &nbsp;
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
    <el-dialog title="初始化" width="960px"
        v-model="dialogVisible"
    >
        <el-tree node-key="sPath" default-expand-all
            :data="aFolders" :expand-on-click-node="false"
        >
            <template #default="{ node, data }">
                <span class="tree-line">
                    <span class="label" :title="node.label">
                        {{ node.label }}
                    </span>
                    <span v-if="data.hasMedia" class="right-info">
                        <el-progress class="progress-bar" :show-text="false"
                            :percentage="Math.min(100, ((oMediaHomes[data.sPath] || 0) / data.hasMedia) * 100)" 
                        />
                        <span class="count" :class="{full: data.hasMedia==oMediaHomes[data.sPath]}">
                            {{`${oMediaHomes[data.sPath] || 0}/${data.hasMedia}`}}
                        </span>
                        <el-button type="text" @click="checkFolder(data)">
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
    <!-- ▼文件夹的【媒体列表】 -->
    <el-dialog title="初始化" width="550px"
        v-model="bMediaDialog"
    >
        <ul class="media-list-in-dialog" >
            <li v-for="(cur,idx) of aMediaForShow" :key="idx"
                class="one-media"
            >
                <span class="name" :title="cur.name">
                    {{cur.name}}
                </span>
                <span class="status">
                    媒体/字幕：
                    <i :class="{'no-yet': cur.iStatus!=1}" >
                        {{['✘', '✔'][cur.iStatus]}}
                    </i>
                    <i :class="{'no-yet': !oLineMap[cur.hash], 'no-srt': !cur.srt}">
                        {{ oLineMap[cur.hash] ? '✔' : '✘' }}
                    </i>
                </span>
            </li>
        </ul>
        <br/>
        <el-button type="primary" @click="saveOneByOne">
            入库
        </el-button>
        <!-- ▼按钮▼ -->
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="bMediaDialog = false">
                    Cancel
                </el-button>
                <el-button type="primary" @click="bMediaDialog = false">
                    Confirm
                </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<script>
import oMethods from './js/shelf.js';

export default {
    name: "shelf",
    data(){
        return {
            aFolders: [],
            aFolderMedia: [],
            aDisks: document.body.disks,
            oConfig: window.oConfig,
            aPath: [window.oConfig.aRoot[0]],
            aTree: [],
            dialogVisible: false, // 用于导入的1级窗口
            bMediaDialog: false,
            aMediaHomes: [],
            // ▼数据库中的数据
            oMediaHomes: {},
            oLineMap: {},
        };
    },
    computed:{
        aMediaForShow(){
            return this.aFolderMedia;
        }, 
    },
    mounted(){
        this.getMediaHomesArr();
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


