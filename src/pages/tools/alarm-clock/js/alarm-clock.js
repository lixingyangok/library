
import { reactive } from 'vue';
const moment = require('moment');

export function audioControl() {
    const aDom = [];
    const oAlarmTime = {hour: 5, minute: 40, second: 0}; // 每天 xx 开始启动
    const sLastAlarm = (()=>{ // 上次响铃时间
        const [oNow, oAim] = [moment(), moment().set(oAlarmTime)];
        if (oAim.diff(oNow, 'minute') > 0) return;
        return moment().format('yyyy-MM-DD'); // 标记今天已经响铃了
    })();
    const oAlarm = reactive({
        sAim : '',
        sNow: '',
        sGap: '',
        sLastAlarm,
    });
    const oData = reactive({
        aMusic: [],
        fVolume: 0.01,
    });
    // ▲数据
    // ▼方法
    function setDom(el, idx){
        aDom[idx] = el;
    }
    function refreshTime(){
        window.mmt = moment;
        intervalFn();
        return setInterval(()=>intervalFn(), 1 * 1000);
    }
    function intervalFn(){
        let [oNow, oAim] = [moment(), moment().set(oAlarmTime)];
        let iToNextGap = oAim.diff(oNow, 'second');
        if (iToNextGap < 0) { // 已到达（超过）目标时间
            oAim.add(1, 'days');
            iToNextGap = oAim.diff(oNow, 'second'); // 查询时间01的领先秒数
            const sToday = moment().format('yyyy-MM-DD');
            if (oAlarm.sLastAlarm != sToday) {
                oAlarm.sLastAlarm = sToday;
                toBoom();
            }
        }
        const iGapHours = ~~(iToNextGap / 60 / 60);
        const iGapMinutes = ~~(iToNextGap / 60 % 60);
        const iGapSeconds = iToNextGap - 60 * (iGapHours * 60 + iGapMinutes);
        const sToNextGap = `
            ${iGapHours}
            :${String(iGapMinutes).padStart(2, '0')}
            :${String(iGapSeconds).padStart(2, '0')}
        `.replace(/\s+/g, '');
        oAlarm.sNow = oNow.format('yyyy-MM-DD HH:mm:ss');
        oAlarm.sAim = oAim.format('yyyy-MM-DD HH:mm:ss');
        oAlarm.sGap = sToNextGap;
    }
    function toBoom(iLong=15){
        console.log('开始播放');
        let idx = 0;
        const fFrequency = iLong * (1000 * 60) / 100;
        let oAudio = aDom[idx];
        oData.volume = 0.01;
        oAudio.volume = 0.01;
        oAudio.play();
        setInterval(() => {
            const fNewVal = Math.min(1, oData.fVolume + 0.01).toFixed(2) * 1;
            oData.fVolume = fNewVal;
            oAudio.volume = fNewVal;
            const fResult = (oAudio.duration - oAudio.currentTime) * 1000;
            if (fResult > fFrequency) return;
            setTimeout(()=>{
                oAudio.currentTime = 0;
                oAudio.pause();
                if (!aDom[++idx]) idx = 0;
                oAudio = aDom[idx]; 
                oAudio.volume = fNewVal;
                oAudio.play();
            }, fResult);
        }, fFrequency);
    }
    return {
        oData,
        oAlarm,
        oFn: {
            setDom,
            refreshTime,
            toBoom,
        },
    };
};


