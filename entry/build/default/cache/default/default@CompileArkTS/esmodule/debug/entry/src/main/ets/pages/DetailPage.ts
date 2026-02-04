if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface DetailPage_Params {
    diary?: Diary | null;
    isRecording?: boolean;
    isPlaying?: boolean;
    recognizedText?: string;
    currentTime?: string;
    hasContent?: boolean;
    showMenu?: boolean;
    recordBtnScale?: number;
    rippleScale?: number;
    rippleOpacity?: number;
    waveAmplitude?: number[];
    audioProgress?: number;
    selectedMood?: string;
    moodOptions?: string[];
    dataManager?: DataManager;
    audioManager?: AudioManager;
    speechRecognizer?: SpeechRecognizer;
    timerInterval?: number;
    waveInterval?: number;
    isRecognitionStarted?: boolean;
}
import router from "@ohos:router";
import { Diary } from "@normalized:N&&&entry/src/main/ets/model/DiaryModel&";
import type { DiaryJson } from "@normalized:N&&&entry/src/main/ets/model/DiaryModel&";
import { DataManager } from "@normalized:N&&&entry/src/main/ets/manager/DataManager&";
import { AudioManager } from "@normalized:N&&&entry/src/main/ets/manager/AudioManager&";
import type { AudioCallbacks } from "@normalized:N&&&entry/src/main/ets/manager/AudioManager&";
import { SpeechRecognizer } from "@normalized:N&&&entry/src/main/ets/manager/SpeechRecognizer&";
import promptAction from "@ohos:promptAction";
import hilog from "@ohos:hilog";
class DetailPage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__diary = new ObservedPropertyObjectPU(null, this, "diary");
        this.__isRecording = new ObservedPropertySimplePU(false, this, "isRecording");
        this.__isPlaying = new ObservedPropertySimplePU(false, this, "isPlaying");
        this.__recognizedText = new ObservedPropertySimplePU('', this, "recognizedText");
        this.__currentTime = new ObservedPropertySimplePU('00:00', this, "currentTime");
        this.__hasContent = new ObservedPropertySimplePU(false, this, "hasContent");
        this.__showMenu = new ObservedPropertySimplePU(false, this, "showMenu");
        this.__recordBtnScale = new ObservedPropertySimplePU(1.0, this, "recordBtnScale");
        this.__rippleScale = new ObservedPropertySimplePU(1.0, this, "rippleScale");
        this.__rippleOpacity = new ObservedPropertySimplePU(0, this, "rippleOpacity");
        this.__waveAmplitude = new ObservedPropertyObjectPU([0.3, 0.5, 0.7, 0.5, 0.3, 0.6, 0.4, 0.8], this, "waveAmplitude");
        this.__audioProgress = new ObservedPropertySimplePU(0, this, "audioProgress");
        this.__selectedMood = new ObservedPropertySimplePU('', this, "selectedMood");
        this.moodOptions = ['😊 开心', '😢 难过', '😡 生气', '😌 平静', '🤔 思考', '😴 疲惫'];
        this.dataManager = DataManager.getInstance();
        this.audioManager = AudioManager.getInstance();
        this.speechRecognizer = SpeechRecognizer.getInstance();
        this.timerInterval = -1;
        this.waveInterval = -1;
        this.isRecognitionStarted = false;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DetailPage_Params) {
        if (params.diary !== undefined) {
            this.diary = params.diary;
        }
        if (params.isRecording !== undefined) {
            this.isRecording = params.isRecording;
        }
        if (params.isPlaying !== undefined) {
            this.isPlaying = params.isPlaying;
        }
        if (params.recognizedText !== undefined) {
            this.recognizedText = params.recognizedText;
        }
        if (params.currentTime !== undefined) {
            this.currentTime = params.currentTime;
        }
        if (params.hasContent !== undefined) {
            this.hasContent = params.hasContent;
        }
        if (params.showMenu !== undefined) {
            this.showMenu = params.showMenu;
        }
        if (params.recordBtnScale !== undefined) {
            this.recordBtnScale = params.recordBtnScale;
        }
        if (params.rippleScale !== undefined) {
            this.rippleScale = params.rippleScale;
        }
        if (params.rippleOpacity !== undefined) {
            this.rippleOpacity = params.rippleOpacity;
        }
        if (params.waveAmplitude !== undefined) {
            this.waveAmplitude = params.waveAmplitude;
        }
        if (params.audioProgress !== undefined) {
            this.audioProgress = params.audioProgress;
        }
        if (params.selectedMood !== undefined) {
            this.selectedMood = params.selectedMood;
        }
        if (params.moodOptions !== undefined) {
            this.moodOptions = params.moodOptions;
        }
        if (params.dataManager !== undefined) {
            this.dataManager = params.dataManager;
        }
        if (params.audioManager !== undefined) {
            this.audioManager = params.audioManager;
        }
        if (params.speechRecognizer !== undefined) {
            this.speechRecognizer = params.speechRecognizer;
        }
        if (params.timerInterval !== undefined) {
            this.timerInterval = params.timerInterval;
        }
        if (params.waveInterval !== undefined) {
            this.waveInterval = params.waveInterval;
        }
        if (params.isRecognitionStarted !== undefined) {
            this.isRecognitionStarted = params.isRecognitionStarted;
        }
    }
    updateStateVars(params: DetailPage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__diary.purgeDependencyOnElmtId(rmElmtId);
        this.__isRecording.purgeDependencyOnElmtId(rmElmtId);
        this.__isPlaying.purgeDependencyOnElmtId(rmElmtId);
        this.__recognizedText.purgeDependencyOnElmtId(rmElmtId);
        this.__currentTime.purgeDependencyOnElmtId(rmElmtId);
        this.__hasContent.purgeDependencyOnElmtId(rmElmtId);
        this.__showMenu.purgeDependencyOnElmtId(rmElmtId);
        this.__recordBtnScale.purgeDependencyOnElmtId(rmElmtId);
        this.__rippleScale.purgeDependencyOnElmtId(rmElmtId);
        this.__rippleOpacity.purgeDependencyOnElmtId(rmElmtId);
        this.__waveAmplitude.purgeDependencyOnElmtId(rmElmtId);
        this.__audioProgress.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedMood.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__diary.aboutToBeDeleted();
        this.__isRecording.aboutToBeDeleted();
        this.__isPlaying.aboutToBeDeleted();
        this.__recognizedText.aboutToBeDeleted();
        this.__currentTime.aboutToBeDeleted();
        this.__hasContent.aboutToBeDeleted();
        this.__showMenu.aboutToBeDeleted();
        this.__recordBtnScale.aboutToBeDeleted();
        this.__rippleScale.aboutToBeDeleted();
        this.__rippleOpacity.aboutToBeDeleted();
        this.__waveAmplitude.aboutToBeDeleted();
        this.__audioProgress.aboutToBeDeleted();
        this.__selectedMood.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __diary: ObservedPropertyObjectPU<Diary | null>;
    get diary() {
        return this.__diary.get();
    }
    set diary(newValue: Diary | null) {
        this.__diary.set(newValue);
    }
    private __isRecording: ObservedPropertySimplePU<boolean>;
    get isRecording() {
        return this.__isRecording.get();
    }
    set isRecording(newValue: boolean) {
        this.__isRecording.set(newValue);
    }
    private __isPlaying: ObservedPropertySimplePU<boolean>;
    get isPlaying() {
        return this.__isPlaying.get();
    }
    set isPlaying(newValue: boolean) {
        this.__isPlaying.set(newValue);
    }
    private __recognizedText: ObservedPropertySimplePU<string>;
    get recognizedText() {
        return this.__recognizedText.get();
    }
    set recognizedText(newValue: string) {
        this.__recognizedText.set(newValue);
    }
    private __currentTime: ObservedPropertySimplePU<string>;
    get currentTime() {
        return this.__currentTime.get();
    }
    set currentTime(newValue: string) {
        this.__currentTime.set(newValue);
    }
    private __hasContent: ObservedPropertySimplePU<boolean>;
    get hasContent() {
        return this.__hasContent.get();
    }
    set hasContent(newValue: boolean) {
        this.__hasContent.set(newValue);
    }
    private __showMenu: ObservedPropertySimplePU<boolean>;
    get showMenu() {
        return this.__showMenu.get();
    }
    set showMenu(newValue: boolean) {
        this.__showMenu.set(newValue);
    }
    // 动画状态
    private __recordBtnScale: ObservedPropertySimplePU<number>;
    get recordBtnScale() {
        return this.__recordBtnScale.get();
    }
    set recordBtnScale(newValue: number) {
        this.__recordBtnScale.set(newValue);
    }
    private __rippleScale: ObservedPropertySimplePU<number>;
    get rippleScale() {
        return this.__rippleScale.get();
    }
    set rippleScale(newValue: number) {
        this.__rippleScale.set(newValue);
    }
    private __rippleOpacity: ObservedPropertySimplePU<number>;
    get rippleOpacity() {
        return this.__rippleOpacity.get();
    }
    set rippleOpacity(newValue: number) {
        this.__rippleOpacity.set(newValue);
    }
    private __waveAmplitude: ObservedPropertyObjectPU<number[]>;
    get waveAmplitude() {
        return this.__waveAmplitude.get();
    }
    set waveAmplitude(newValue: number[]) {
        this.__waveAmplitude.set(newValue);
    }
    private __audioProgress: ObservedPropertySimplePU<number>; // 0-100
    get audioProgress() {
        return this.__audioProgress.get();
    }
    set audioProgress(newValue: number) {
        this.__audioProgress.set(newValue);
    }
    // 新增：情绪标签
    private __selectedMood: ObservedPropertySimplePU<string>;
    get selectedMood() {
        return this.__selectedMood.get();
    }
    set selectedMood(newValue: string) {
        this.__selectedMood.set(newValue);
    }
    private moodOptions: string[];
    private dataManager: DataManager;
    private audioManager: AudioManager;
    private speechRecognizer: SpeechRecognizer;
    private timerInterval: number;
    private waveInterval: number;
    private isRecognitionStarted: boolean;
    aboutToAppear() {
        const params = router.getParams() as Record<string, Object>;
        if (params && params['diary']) {
            this.diary = Diary.fromJson(params['diary'] as DiaryJson);
            if (this.diary) {
                this.recognizedText = this.diary.content;
                this.selectedMood = this.diary.mood || '';
                this.hasContent = true;
            }
        }
        else {
            this.hasContent = false;
        }
        this.initAllServices();
    }
    aboutToDisappear() {
        this.stopTimer();
        this.stopWaveAnimation();
        if (this.isRecording) {
            this.stopRecording().catch((err: Error) => {
            });
        }
    }
    async initAllServices() {
        await this.initAudioManager();
        try {
            const isSuccess = await this.speechRecognizer.initialize();
            if (isSuccess) {
                hilog.info(0x0000, 'DetailPage', '语音识别服务准备就绪');
            }
        }
        catch (error) {
            if (error instanceof Error) {
                promptAction.showToast({ message: `识别服务初始化失败: ${error.message}` });
            }
        }
    }
    async initAudioManager() {
        try {
            await this.audioManager.initRecorder();
            await this.audioManager.initPlayer();
            const callbacks: AudioCallbacks = {
                onRecordStart: () => {
                    this.isRecording = true;
                    this.startTimer();
                    this.startWaveAnimation();
                    Context.animateTo({ duration: 1000, iterations: -1, curve: Curve.EaseInOut }, () => {
                        this.rippleScale = 1.5;
                        this.rippleOpacity = 0.5;
                    });
                    if (!this.isRecognitionStarted) {
                        this.startRecognitionAfterRecording();
                    }
                },
                onRecordStop: (duration: number) => {
                    this.isRecording = false;
                    this.stopTimer();
                    this.stopWaveAnimation();
                    Context.animateTo({ duration: 300 }, () => {
                        this.rippleScale = 1.0;
                        this.rippleOpacity = 0;
                    });
                    this.hasContent = true;
                },
                onPlayStart: () => {
                    this.isPlaying = true;
                    this.startAudioProgress();
                },
                onPlayComplete: () => {
                    this.isPlaying = false;
                    this.audioProgress = 0;
                },
                onError: (error: string) => {
                    this.isRecording = false;
                    this.isPlaying = false;
                },
                onPcmData: (data: ArrayBuffer) => {
                    this.speechRecognizer.feedAudio(new Uint8Array(data));
                }
            };
            this.audioManager.setCallbacks(callbacks);
        }
        catch (error) {
            if (error instanceof Error) {
                promptAction.showToast({ message: `音频初始化失败: ${error.message}` });
            }
        }
    }
    private startRecognitionAfterRecording() {
        this.isRecognitionStarted = true;
        this.speechRecognizer.startRecognitionSession()
            .then(text => {
            this.recognizedText = text;
            if (this.diary) {
                this.diary.content = this.recognizedText;
                this.diary.title = Diary.generateTitle(this.recognizedText, this.diary.createTime);
            }
        })
            .catch((error: Error) => {
            this.recognizedText = `语音识别失败: ${error.message}`;
        });
    }
    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        }
        else {
            await this.startRecording();
        }
    }
    async startRecording() {
        if (this.isRecording) {
            return;
        }
        try {
            const diaryId = Date.now().toString();
            const audioPath = this.dataManager.getAudioFilePath(diaryId);
            this.diary = new Diary(diaryId, '', '', audioPath, Date.now());
            this.isRecognitionStarted = false;
            await this.audioManager.startRecording(audioPath);
        }
        catch (error) {
            this.isRecording = false;
        }
    }
    async stopRecording() {
        if (!this.isRecording) {
            return;
        }
        try {
            await this.audioManager.stopRecording();
            this.speechRecognizer.stopRecognitionSession();
            this.isRecognitionStarted = false;
        }
        catch (error) {
            this.speechRecognizer.stopRecognitionSession();
            this.isRecognitionStarted = false;
        }
    }
    async playAudio() {
        if (!this.diary?.audioPath) {
            return;
        }
        try {
            if (this.isPlaying) {
                await this.audioManager.stop();
            }
            else {
                await this.audioManager.play(this.diary.audioPath);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                promptAction.showToast({ message: `播放失败: ${error.message}` });
            }
        }
    }
    async saveDiary() {
        if (!this.diary || !this.recognizedText) {
            promptAction.showToast({ message: '内容为空' });
            return;
        }
        try {
            this.diary.content = this.recognizedText;
            this.diary.mood = this.selectedMood;
            if (!this.diary.title) {
                this.diary.title = Diary.generateTitle(this.recognizedText, this.diary.createTime);
            }
            const diaryList = await this.dataManager.loadDiaryList();
            const existingIndex = diaryList.findIndex(d => d.id === this.diary!.id);
            if (existingIndex >= 0) {
                diaryList[existingIndex] = this.diary;
            }
            else {
                diaryList.push(this.diary);
            }
            await this.dataManager.saveDiaryList(diaryList);
            promptAction.showToast({ message: '保存成功' });
            setTimeout(() => router.back(), 500);
        }
        catch (error) {
            if (error instanceof Error) {
                promptAction.showToast({ message: `保存失败: ${error.message}` });
            }
        }
    }
    startTimer() {
        const startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            this.currentTime = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        }, 1000);
    }
    stopTimer() {
        if (this.timerInterval >= 0) {
            clearInterval(this.timerInterval);
            this.timerInterval = -1;
            this.currentTime = '00:00';
        }
    }
    startWaveAnimation() {
        this.waveInterval = setInterval(() => {
            this.waveAmplitude = this.waveAmplitude.map(() => Math.random() * 0.8 + 0.2);
        }, 150);
    }
    stopWaveAnimation() {
        if (this.waveInterval >= 0) {
            clearInterval(this.waveInterval);
            this.waveInterval = -1;
        }
    }
    startAudioProgress() {
        // 模拟音频进度（实际应该从 AudioManager 获取）
        const duration = 30000; // 假设30秒
        const interval = 100;
        const step = (interval / duration) * 100;
        const progressInterval = setInterval(() => {
            if (this.audioProgress >= 100 || !this.isPlaying) {
                clearInterval(progressInterval);
                this.audioProgress = 0;
            }
            else {
                this.audioProgress += step;
            }
        }, interval);
    }
    resetRecording() {
        AlertDialog.show({
            title: '重新录制',
            message: '重新录制将丢失当前内容,确定吗?',
            primaryButton: {
                value: '取消',
                action: () => {
                }
            },
            secondaryButton: {
                value: '确定重录',
                fontColor: '#FF5252',
                action: () => {
                    this.hasContent = false;
                    this.recognizedText = '';
                    this.currentTime = '00:00';
                    this.selectedMood = '';
                }
            }
        });
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 1. 顶部导航栏（渐变背景）
            Row.create();
            // 1. 顶部导航栏（渐变背景）
            Row.width('100%');
            // 1. 顶部导航栏（渐变背景）
            Row.height(56);
            // 1. 顶部导航栏（渐变背景）
            Row.padding({ left: 16, right: 16 });
            // 1. 顶部导航栏（渐变背景）
            Row.linearGradient({
                angle: 135,
                colors: [[0x42A5F5, 0.0], [0x1E88E5, 1.0]]
            });
            // 1. 顶部导航栏（渐变背景）
            Row.shadow({ radius: 8, color: 'rgba(30, 136, 229, 0.3)', offsetY: 4 });
            // 1. 顶部导航栏（渐变背景）
            Row.zIndex(10);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.backgroundColor(Color.Transparent);
            Button.onClick(() => router.back());
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
            Image.width(24);
            Image.height(24);
            Image.fillColor('#FFFFFF');
        }, Image);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.hasContent ? '日记详情' : '新建日记');
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#FFFFFF');
            Text.layoutWeight(1);
            Text.textAlign(TextAlign.Center);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.hasContent) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithChild();
                        Button.backgroundColor(Color.Transparent);
                        Button.onClick(() => {
                            this.showMenu = !this.showMenu;
                        });
                    }, Button);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
                        Image.width(24);
                        Image.height(24);
                        Image.fillColor('#FFFFFF');
                    }, Image);
                    Button.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.width(32);
                    }, Blank);
                    Blank.pop();
                });
            }
        }, If);
        If.pop();
        // 1. 顶部导航栏（渐变背景）
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 菜单弹窗
            if (this.showMenu) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width(150);
                        Column.backgroundColor('#FFFFFF');
                        Column.borderRadius(8);
                        Column.position({ x: '75%', y: 60 });
                        Column.shadow({ radius: 8, color: 'rgba(0,0,0,0.15)' });
                        Column.zIndex(100);
                        Column.padding(8);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('保存日记');
                        Button.width('100%');
                        Button.backgroundColor('#FFFFFF');
                        Button.fontColor('#333333');
                        Button.onClick(() => {
                            this.showMenu = false;
                            this.saveDiary();
                        });
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Divider.create();
                        Divider.color('#F0F0F0');
                    }, Divider);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('重新录制');
                        Button.width('100%');
                        Button.backgroundColor('#FFFFFF');
                        Button.fontColor('#FF5252');
                        Button.onClick(() => {
                            this.showMenu = false;
                            this.resetRecording();
                        });
                    }, Button);
                    Button.pop();
                    Column.pop();
                });
            }
            // 2. 主体内容
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 2. 主体内容
            Column.create();
            // 2. 主体内容
            Column.layoutWeight(1);
            // 2. 主体内容
            Column.width('100%');
            // 2. 主体内容
            Column.backgroundColor('#F5F5F5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (!this.hasContent) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // ==================== 录音界面 ====================
                        Column.create();
                        // ==================== 录音界面 ====================
                        Column.width('100%');
                        // ==================== 录音界面 ====================
                        Column.height('100%');
                        // ==================== 录音界面 ====================
                        Column.linearGradient({
                            angle: 180,
                            colors: [[0xFAFAFA, 0.0], [0xF0F0F0, 1.0]]
                        });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.layoutWeight(1);
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 录音状态提示
                        Column.create();
                        // 录音状态提示
                        Column.margin({ bottom: 40 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.isRecording ? '正在录音中...' : '轻触开始录音');
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor(this.isRecording ? '#1E88E5' : '#999999');
                        Text.margin({ bottom: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.isRecording) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('说出你想记录的内容');
                                    Text.fontSize(14);
                                    Text.fontColor('#BBBBBB');
                                }, Text);
                                Text.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    // 录音状态提示
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        // 音频波形可视化
                        if (this.isRecording) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create({ space: 4 });
                                    Row.height(60);
                                    Row.justifyContent(FlexAlign.Center);
                                    Row.margin({ bottom: 30 });
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    ForEach.create();
                                    const forEachItemGenFunction = (_item, index: number) => {
                                        const amplitude = _item;
                                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                                            Rect.create();
                                            Rect.width(4);
                                            Rect.height(60 * amplitude);
                                            Rect.fill('#1E88E5');
                                            Rect.borderRadius(2);
                                        }, Rect);
                                    };
                                    this.forEachUpdateFunction(elmtId, this.waveAmplitude, forEachItemGenFunction, (item: number, index: number) => index.toString(), true, true);
                                }, ForEach);
                                ForEach.pop();
                                Row.pop();
                            });
                        }
                        // 录音按钮
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 录音按钮
                        Stack.create();
                    }, Stack);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.isRecording) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Circle.create();
                                    Circle.width(140);
                                    Circle.height(140);
                                    Circle.fill('rgba(255, 82, 82, 0.2)');
                                    Circle.scale({ x: this.rippleScale, y: this.rippleScale });
                                    Circle.opacity(this.rippleOpacity);
                                }, Circle);
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithChild({ type: ButtonType.Circle });
                        Button.width(120);
                        Button.height(120);
                        Button.backgroundColor(this.isRecording ? '#FF5252' : '#1E88E5');
                        Button.shadow({
                            radius: 12,
                            color: this.isRecording ? 'rgba(255, 82, 82, 0.4)' : 'rgba(30, 136, 229, 0.4)',
                            offsetY: 6
                        });
                        Button.scale({ x: this.recordBtnScale, y: this.recordBtnScale });
                        Button.onClick(() => {
                            Context.animateTo({ duration: 150 }, () => {
                                this.recordBtnScale = 0.95;
                            });
                            setTimeout(() => {
                                Context.animateTo({ duration: 150 }, () => {
                                    this.recordBtnScale = 1.0;
                                });
                            }, 150);
                            this.toggleRecording();
                        });
                    }, Button);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create(this.isRecording ? { "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" } : { "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
                        Image.width(this.isRecording ? 32 : 40);
                        Image.height(this.isRecording ? 32 : 40);
                        Image.fillColor('#FFFFFF');
                    }, Image);
                    Column.pop();
                    Button.pop();
                    // 录音按钮
                    Stack.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 计时器
                        Text.create(this.currentTime);
                        // 计时器
                        Text.fontSize(48);
                        // 计时器
                        Text.fontWeight(FontWeight.Lighter);
                        // 计时器
                        Text.fontColor(this.isRecording ? '#333333' : '#E0E0E0');
                        // 计时器
                        Text.fontFamily('Monospace');
                        // 计时器
                        Text.margin({ top: 50 });
                        // 计时器
                        Text.transition({ type: TransitionType.All, opacity: 1 });
                    }, Text);
                    // 计时器
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.layoutWeight(1);
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        // 提示文字
                        if (!this.isRecording) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('点击麦克风开始录音');
                                    Text.fontSize(14);
                                    Text.fontColor('#CCCCCC');
                                    Text.margin({ bottom: 40 });
                                }, Text);
                                Text.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    // ==================== 录音界面 ====================
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // ==================== 详情界面 ====================
                        Scroll.create();
                        // ==================== 详情界面 ====================
                        Scroll.layoutWeight(1);
                        // ==================== 详情界面 ====================
                        Scroll.edgeEffect(EdgeEffect.Spring);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.padding(16);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        // 音频播放器
                        if (this.diary?.audioPath) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.width('100%');
                                    Column.padding(20);
                                    Column.backgroundColor('#FFFFFF');
                                    Column.borderRadius(16);
                                    Column.margin({ bottom: 16 });
                                    Column.shadow({ radius: 8, color: 'rgba(0,0,0,0.06)', offsetY: 2 });
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.width('100%');
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithChild({ type: ButtonType.Circle });
                                    Button.width(56);
                                    Button.height(56);
                                    Button.backgroundColor(this.isPlaying ? '#FF5252' : '#1E88E5');
                                    Button.shadow({ radius: 8, color: 'rgba(30, 136, 229, 0.3)' });
                                    Button.onClick(() => this.playAudio());
                                }, Button);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
                                    Image.width(24);
                                    Image.height(24);
                                    Image.fillColor('#FFFFFF');
                                }, Image);
                                Button.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.margin({ left: 16 });
                                    Column.layoutWeight(1);
                                    Column.alignItems(HorizontalAlign.Start);
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.isPlaying ? '播放中...' : '点击播放录音');
                                    Text.fontSize(16);
                                    Text.fontColor('#333333');
                                    Text.fontWeight(FontWeight.Medium);
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    // 进度条
                                    Progress.create({ value: this.audioProgress, total: 100, type: ProgressType.Linear });
                                    // 进度条
                                    Progress.width('100%');
                                    // 进度条
                                    Progress.height(4);
                                    // 进度条
                                    Progress.color('#1E88E5');
                                    // 进度条
                                    Progress.margin({ top: 8 });
                                }, Progress);
                                Column.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    If.create();
                                    if (!this.isRecognitionStarted) {
                                        this.ifElseBranchUpdateFunction(0, () => {
                                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                Button.createWithLabel('重录');
                                                Button.fontSize(14);
                                                Button.fontColor('#FF5252');
                                                Button.backgroundColor('#FFE5E5');
                                                Button.padding({
                                                    left: 16,
                                                    right: 16,
                                                    top: 8,
                                                    bottom: 8
                                                });
                                                Button.borderRadius(20);
                                                Button.onClick(() => this.resetRecording());
                                            }, Button);
                                            Button.pop();
                                        });
                                    }
                                    else {
                                        this.ifElseBranchUpdateFunction(1, () => {
                                        });
                                    }
                                }, If);
                                If.pop();
                                Row.pop();
                                Column.pop();
                            });
                        }
                        // 情绪标签选择
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 情绪标签选择
                        Column.create();
                        // 情绪标签选择
                        Column.width('100%');
                        // 情绪标签选择
                        Column.padding(20);
                        // 情绪标签选择
                        Column.backgroundColor('#FFFFFF');
                        // 情绪标签选择
                        Column.borderRadius(16);
                        // 情绪标签选择
                        Column.margin({ bottom: 16 });
                        // 情绪标签选择
                        Column.shadow({ radius: 8, color: 'rgba(0,0,0,0.06)', offsetY: 2 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('今天的心情');
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                        Text.margin({ bottom: 12 });
                        Text.width('100%');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Flex.create({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start });
                        Flex.width('100%');
                    }, Flex);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const mood = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(mood);
                                Text.fontSize(14);
                                Text.padding({
                                    left: 12,
                                    right: 12,
                                    top: 8,
                                    bottom: 8
                                });
                                Text.backgroundColor(this.selectedMood === mood ? '#E3F2FD' : '#F5F5F5');
                                Text.fontColor(this.selectedMood === mood ? '#1E88E5' : '#666666');
                                Text.borderRadius(20);
                                Text.border({
                                    width: this.selectedMood === mood ? 2 : 0,
                                    color: '#1E88E5'
                                });
                                Text.onClick(() => {
                                    Context.animateTo({ duration: 200 }, () => {
                                        this.selectedMood = mood;
                                    });
                                });
                                Text.margin({ right: 12, bottom: 8 });
                            }, Text);
                            Text.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.moodOptions, forEachItemGenFunction, (mood: string) => mood, false, false);
                    }, ForEach);
                    ForEach.pop();
                    Flex.pop();
                    // 情绪标签选择
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 文本内容
                        Column.create();
                        // 文本内容
                        Column.width('100%');
                        // 文本内容
                        Column.padding(20);
                        // 文本内容
                        Column.backgroundColor('#FFFFFF');
                        // 文本内容
                        Column.borderRadius(16);
                        // 文本内容
                        Column.shadow({ radius: 8, color: 'rgba(0,0,0,0.06)', offsetY: 2 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.width('100%');
                        Row.margin({ bottom: 16 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('内容详情');
                        Text.fontSize(16);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor('#333333');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`${this.recognizedText.length} 字`);
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                    }, Text);
                    Text.pop();
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        TextArea.create({ text: this.recognizedText });
                        TextArea.width('100%');
                        TextArea.height(450);
                        TextArea.fontSize(16);
                        TextArea.fontColor('#333333');
                        TextArea.lineHeight(28);
                        TextArea.padding(16);
                        TextArea.backgroundColor('#FAFAFA');
                        TextArea.borderRadius(12);
                        TextArea.onChange((value: string) => {
                            this.recognizedText = value;
                        });
                    }, TextArea);
                    // 文本内容
                    Column.pop();
                    Column.pop();
                    // ==================== 详情界面 ====================
                    Scroll.pop();
                });
            }
        }, If);
        If.pop();
        // 2. 主体内容
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "DetailPage";
    }
}
registerNamedRoute(() => new DetailPage(undefined, {}), "", { bundleName: "com.example.voicediary", moduleName: "entry", pagePath: "pages/DetailPage", pageFullPath: "entry/src/main/ets/pages/DetailPage", integratedHsp: "false", moduleType: "followWithHap" });
