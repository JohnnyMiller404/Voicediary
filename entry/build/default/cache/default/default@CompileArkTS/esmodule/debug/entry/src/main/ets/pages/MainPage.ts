if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface MainPage_Params {
    diaryList?: Diary[];
    filteredList?: Diary[];
    searchText?: string;
    showSearch?: boolean;
    selectedFilter?: string;
    fabScale?: number;
    dataManager?: DataManager;
    isInitialized?: boolean;
}
import router from "@ohos:router";
import type { Diary } from '../model/DiaryModel';
import { DataManager } from "@normalized:N&&&entry/src/main/ets/manager/DataManager&";
import promptAction from "@ohos:promptAction";
import type common from "@ohos:app.ability.common";
import { SpeechRecognizer } from "@normalized:N&&&entry/src/main/ets/manager/SpeechRecognizer&";
import hilog from "@ohos:hilog";
class MainPage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__diaryList = new ObservedPropertyObjectPU([], this, "diaryList");
        this.__filteredList = new ObservedPropertyObjectPU([], this, "filteredList");
        this.__searchText = new ObservedPropertySimplePU('', this, "searchText");
        this.__showSearch = new ObservedPropertySimplePU(false, this, "showSearch");
        this.__selectedFilter = new ObservedPropertySimplePU('all', this, "selectedFilter");
        this.__fabScale = new ObservedPropertySimplePU(1.0, this, "fabScale");
        this.dataManager = DataManager.getInstance(getContext(this) as common.UIAbilityContext);
        this.isInitialized = false;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: MainPage_Params) {
        if (params.diaryList !== undefined) {
            this.diaryList = params.diaryList;
        }
        if (params.filteredList !== undefined) {
            this.filteredList = params.filteredList;
        }
        if (params.searchText !== undefined) {
            this.searchText = params.searchText;
        }
        if (params.showSearch !== undefined) {
            this.showSearch = params.showSearch;
        }
        if (params.selectedFilter !== undefined) {
            this.selectedFilter = params.selectedFilter;
        }
        if (params.fabScale !== undefined) {
            this.fabScale = params.fabScale;
        }
        if (params.dataManager !== undefined) {
            this.dataManager = params.dataManager;
        }
        if (params.isInitialized !== undefined) {
            this.isInitialized = params.isInitialized;
        }
    }
    updateStateVars(params: MainPage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__diaryList.purgeDependencyOnElmtId(rmElmtId);
        this.__filteredList.purgeDependencyOnElmtId(rmElmtId);
        this.__searchText.purgeDependencyOnElmtId(rmElmtId);
        this.__showSearch.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedFilter.purgeDependencyOnElmtId(rmElmtId);
        this.__fabScale.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__diaryList.aboutToBeDeleted();
        this.__filteredList.aboutToBeDeleted();
        this.__searchText.aboutToBeDeleted();
        this.__showSearch.aboutToBeDeleted();
        this.__selectedFilter.aboutToBeDeleted();
        this.__fabScale.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __diaryList: ObservedPropertyObjectPU<Diary[]>;
    get diaryList() {
        return this.__diaryList.get();
    }
    set diaryList(newValue: Diary[]) {
        this.__diaryList.set(newValue);
    }
    private __filteredList: ObservedPropertyObjectPU<Diary[]>;
    get filteredList() {
        return this.__filteredList.get();
    }
    set filteredList(newValue: Diary[]) {
        this.__filteredList.set(newValue);
    }
    private __searchText: ObservedPropertySimplePU<string>;
    get searchText() {
        return this.__searchText.get();
    }
    set searchText(newValue: string) {
        this.__searchText.set(newValue);
    }
    private __showSearch: ObservedPropertySimplePU<boolean>;
    get showSearch() {
        return this.__showSearch.get();
    }
    set showSearch(newValue: boolean) {
        this.__showSearch.set(newValue);
    }
    private __selectedFilter: ObservedPropertySimplePU<string>; // all, today, week, month
    get selectedFilter() {
        return this.__selectedFilter.get();
    }
    set selectedFilter(newValue: string) {
        this.__selectedFilter.set(newValue);
    }
    private __fabScale: ObservedPropertySimplePU<number>;
    get fabScale() {
        return this.__fabScale.get();
    }
    set fabScale(newValue: number) {
        this.__fabScale.set(newValue);
    }
    private dataManager: DataManager;
    private isInitialized: boolean;
    aboutToAppear() {
        hilog.info(0x0000, 'MainPage', 'aboutToAppear 被调用');
        if (!this.isInitialized) {
            this.initAllServices();
            this.isInitialized = true;
        }
        this.loadDiaryList();
    }
    onPageShow() {
        this.loadDiaryList();
    }
    initAllServices() {
        DataManager.getInstance(getContext(this) as common.UIAbilityContext);
        SpeechRecognizer.getInstance();
    }
    async loadDiaryList() {
        try {
            this.diaryList = await this.dataManager.loadDiaryList();
            // 重要:置顶的始终排在最前面,然后按时间倒序
            this.diaryList.sort((a, b) => {
                // 如果置顶状态不同,置顶的排前面
                if (a.isPinned && !b.isPinned)
                    return -1;
                if (!a.isPinned && b.isPinned)
                    return 1;
                // 置顶状态相同,按时间倒序
                return b.createTime - a.createTime;
            });
            this.applyFilter();
        }
        catch (error) {
            this.diaryList = [];
            this.filteredList = [];
        }
    }
    applyFilter() {
        let list = [...this.diaryList];
        // 时间过滤
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (this.selectedFilter === 'today') {
            list = list.filter(d => (now - d.createTime) < oneDayMs);
        }
        else if (this.selectedFilter === 'week') {
            list = list.filter(d => (now - d.createTime) < 7 * oneDayMs);
        }
        else if (this.selectedFilter === 'month') {
            list = list.filter(d => (now - d.createTime) < 30 * oneDayMs);
        }
        // 搜索过滤
        if (this.searchText.trim()) {
            const keyword = this.searchText.toLowerCase();
            list = list.filter(d => d.title.toLowerCase().includes(keyword) ||
                d.content.toLowerCase().includes(keyword));
        }
        // 重新排序:确保置顶的在最前面
        list.sort((a, b) => {
            if (a.isPinned && !b.isPinned)
                return -1;
            if (!a.isPinned && b.isPinned)
                return 1;
            return b.createTime - a.createTime;
        });
        this.filteredList = list;
    }
    navigateToDetail(diary?: Diary) {
        // FAB 点击动画
        Context.animateTo({ duration: 200, curve: Curve.EaseOut }, () => {
            this.fabScale = 0.9;
        });
        setTimeout(() => {
            Context.animateTo({ duration: 200, curve: Curve.EaseOut }, () => {
                this.fabScale = 1.0;
            });
        }, 200);
        router.pushUrl({
            url: 'pages/DetailPage',
            params: { diary: diary ? diary.toJson() : null }
        });
    }
    async deleteDiary(diary: Diary, index: number) {
        try {
            await this.dataManager.deleteAudioFile(diary.audioPath);
            const actualIndex = this.diaryList.findIndex(d => d.id === diary.id);
            if (actualIndex >= 0) {
                this.diaryList.splice(actualIndex, 1);
            }
            await this.dataManager.saveDiaryList(this.diaryList);
            this.applyFilter();
            promptAction.showToast({ message: '已删除' });
        }
        catch (error) {
            promptAction.showToast({ message: '删除失败' });
        }
    }
    async togglePin(diary: Diary) {
        try {
            diary.isPinned = !diary.isPinned;
            await this.dataManager.saveDiaryList(this.diaryList);
            await this.loadDiaryList();
            promptAction.showToast({
                message: diary.isPinned ? '已置顶' : '已取消置顶'
            });
        }
        catch (error) {
            promptAction.showToast({ message: '操作失败' });
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create({ alignContent: Alignment.BottomEnd });
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 1. 顶部标题栏 + 搜索栏
            Column.create();
            // 1. 顶部标题栏 + 搜索栏
            Column.width('100%');
            // 1. 顶部标题栏 + 搜索栏
            Column.backgroundColor('#FFFFFF');
            // 1. 顶部标题栏 + 搜索栏
            Column.shadow({ radius: 4, color: 'rgba(0,0,0,0.06)', offsetY: 2 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标题行
            Row.create();
            // 标题行
            Row.width('100%');
            // 标题行
            Row.padding({ left: 24, right: 24, top: 16, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('我的');
            Text.fontSize(14);
            Text.fontColor('#999999');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create({ "id": 16777255, "type": 10003, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
            Text.fontSize(28);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#1E88E5');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 搜索按钮
            Button.createWithChild();
            // 搜索按钮
            Button.width(44);
            // 搜索按钮
            Button.height(44);
            // 搜索按钮
            Button.type(ButtonType.Circle);
            // 搜索按钮
            Button.backgroundColor(this.showSearch ? '#E3F2FD' : Color.Transparent);
            // 搜索按钮
            Button.onClick(() => {
                Context.animateTo({ duration: 300 }, () => {
                    this.showSearch = !this.showSearch;
                    if (!this.showSearch) {
                        this.searchText = '';
                        this.applyFilter();
                    }
                });
            });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
            Image.width(24);
            Image.height(24);
            Image.fillColor(this.showSearch ? '#1E88E5' : '#666666');
        }, Image);
        // 搜索按钮
        Button.pop();
        // 标题行
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 搜索框（动画展开）
            if (this.showSearch) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.width('90%');
                        Row.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                        Row.backgroundColor('#F5F5F5');
                        Row.borderRadius(24);
                        Row.margin({ left: 24, right: 24, bottom: 12 });
                        Row.transition({ type: TransitionType.Insert, opacity: 0, translate: { y: -20 } });
                        Row.transition({ type: TransitionType.Delete, opacity: 0, translate: { y: -20 } });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
                        Image.width(20);
                        Image.height(20);
                        Image.fillColor('#999999');
                        Image.margin({ right: 8 });
                    }, Image);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        TextInput.create({ placeholder: '搜索日记...', text: this.searchText });
                        TextInput.layoutWeight(1);
                        TextInput.fontSize(16);
                        TextInput.backgroundColor(Color.Transparent);
                        TextInput.onChange((value: string) => {
                            this.searchText = value;
                            this.applyFilter();
                        });
                    }, TextInput);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.searchText) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithChild();
                                    Button.width(28);
                                    Button.height(28);
                                    Button.type(ButtonType.Circle);
                                    Button.backgroundColor('#F0F0F0');
                                    Button.onClick(() => {
                                        this.searchText = '';
                                        this.applyFilter();
                                    });
                                }, Button);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
                                    Image.width(16);
                                    Image.height(16);
                                    Image.fillColor('#999999');
                                }, Image);
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
                });
            }
            // 时间过滤标签
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 时间过滤标签
            Row.create({ space: 12 });
            // 时间过滤标签
            Row.width('100%');
            // 时间过滤标签
            Row.padding({ left: 24, right: 24, bottom: 16 });
        }, Row);
        this.FilterChip.bind(this)('全部', 'all');
        this.FilterChip.bind(this)('今天', 'today');
        this.FilterChip.bind(this)('本周', 'week');
        this.FilterChip.bind(this)('本月', 'month');
        // 时间过滤标签
        Row.pop();
        // 1. 顶部标题栏 + 搜索栏
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 2. 日记列表
            if (this.filteredList.length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                        Column.backgroundColor('#FAFAFA');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
                        Image.width(120);
                        Image.height(120);
                        Image.opacity(0.3);
                    }, Image);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.searchText ? '没有找到相关日记' : { "id": 16777235, "type": 10003, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
                        Text.fontSize(16);
                        Text.fontColor('#999999');
                        Text.margin({ top: 24 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (!this.searchText) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('点击右下角按钮开始记录');
                                    Text.fontSize(14);
                                    Text.fontColor('#CCCCCC');
                                    Text.margin({ top: 8 });
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
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.layoutWeight(1);
                        Column.backgroundColor('#FAFAFA');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 统计信息
                        Row.create();
                        // 统计信息
                        Row.width('100%');
                        // 统计信息
                        Row.padding({ left: 24, right: 24, top: 12, bottom: 8 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.filteredList.filter(d => d.isPinned).length > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(`📌 ${this.filteredList.filter(d => d.isPinned).length} 条置顶`);
                                    Text.fontSize(12);
                                    Text.fontColor('#757575');
                                    Text.padding({ left: 8, right: 8, top: 4, bottom: 4 });
                                    Text.backgroundColor('#EEEEEE');
                                    Text.borderRadius(12);
                                    Text.margin({ right: 12 });
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
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`共 ${this.filteredList.length} 条记录`);
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                    }, Text);
                    Text.pop();
                    // 统计信息
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        List.create({ space: 12 });
                        List.width('100%');
                        List.layoutWeight(1);
                        List.padding({ left: 16, right: 16, bottom: 100 });
                        List.scrollBar(BarState.Off);
                        List.edgeEffect(EdgeEffect.Spring);
                    }, List);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = (_item, index: number) => {
                            const diary = _item;
                            {
                                const itemCreation = (elmtId, isInitialRender) => {
                                    ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                                    ListItem.create(deepRenderFunction, true);
                                    if (!isInitialRender) {
                                        ListItem.pop();
                                    }
                                    ViewStackProcessor.StopGetAccessRecording();
                                };
                                const itemCreation2 = (elmtId, isInitialRender) => {
                                    ListItem.create(deepRenderFunction, true);
                                    ListItem.swipeAction({ end: this.swipeActions.bind(this, diary, index) });
                                    ListItem.onClick(() => this.navigateToDetail(diary));
                                };
                                const deepRenderFunction = (elmtId, isInitialRender) => {
                                    itemCreation(elmtId, isInitialRender);
                                    this.DiaryCard.bind(this)(diary);
                                    ListItem.pop();
                                };
                                this.observeComponentCreation2(itemCreation2, ListItem);
                                ListItem.pop();
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.filteredList, forEachItemGenFunction, (diary: Diary) => diary.id, true, false);
                    }, ForEach);
                    ForEach.pop();
                    List.pop();
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 3. 悬浮新建按钮（带脉冲动画）
            Stack.create();
            // 3. 悬浮新建按钮（带脉冲动画）
            Stack.position({ x: '78%', y: '85%' });
            // 3. 悬浮新建按钮（带脉冲动画）
            Stack.zIndex(999);
            // 3. 悬浮新建按钮（带脉冲动画）
            Stack.onAppear(() => {
                // 持续脉冲动画
                setInterval(() => {
                    Context.animateTo({ duration: 1500, curve: Curve.EaseInOut }, () => {
                        this.fabScale = 1.1;
                    });
                    setTimeout(() => {
                        Context.animateTo({ duration: 1500, curve: Curve.EaseInOut }, () => {
                            this.fabScale = 1.0;
                        });
                    }, 1500);
                }, 3000);
            });
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 脉冲光晕
            Circle.create();
            // 脉冲光晕
            Circle.width(64);
            // 脉冲光晕
            Circle.height(64);
            // 脉冲光晕
            Circle.fill('rgba(30, 136, 229, 0.2)');
            // 脉冲光晕
            Circle.scale({ x: this.fabScale * 1.3, y: this.fabScale * 1.3 });
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild({ type: ButtonType.Circle });
            Button.width(64);
            Button.height(64);
            Button.backgroundColor('#1E88E5');
            Button.shadow({ radius: 12, color: 'rgba(30, 136, 229, 0.5)', offsetY: 6 });
            Button.scale({ x: this.fabScale, y: this.fabScale });
            Button.onClick(() => this.navigateToDetail());
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
            Image.width(28);
            Image.height(28);
            Image.fillColor('#FFFFFF');
        }, Image);
        Button.pop();
        // 3. 悬浮新建按钮（带脉冲动画）
        Stack.pop();
        Stack.pop();
    }
    FilterChip(label: string, value: string, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(label);
            Text.fontSize(14);
            Text.fontColor(this.selectedFilter === value ? '#FFFFFF' : '#666666');
            Text.padding({ left: 16, right: 16, top: 8, bottom: 8 });
            Text.backgroundColor(this.selectedFilter === value ? '#1E88E5' : '#F0F0F0');
            Text.borderRadius(20);
            Text.onClick(() => {
                Context.animateTo({ duration: 200 }, () => {
                    this.selectedFilter = value;
                });
                this.applyFilter();
            });
        }, Text);
        Text.pop();
    }
    DiaryCard(diary: Diary, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.backgroundColor('#FFFFFF');
            Column.borderRadius(16);
            Column.border({
                width: diary.isPinned ? 2 : 0,
                color: diary.isPinned ? '#FFE0B2' : Color.Transparent
            });
            Column.shadow({ radius: 8, color: 'rgba(0, 0, 0, 0.06)', offsetY: 2 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
            Row.padding(16);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 左侧：日期块（渐变背景）
            Column.create();
            // 左侧：日期块（渐变背景）
            Column.width(60);
            // 左侧：日期块（渐变背景）
            Column.height(60);
            // 左侧：日期块（渐变背景）
            Column.justifyContent(FlexAlign.Center);
            // 左侧：日期块（渐变背景）
            Column.linearGradient({
                angle: 135,
                colors: [[0x42A5F5, 0.0], [0x1E88E5, 1.0]]
            });
            // 左侧：日期块（渐变背景）
            Column.borderRadius(12);
            // 左侧：日期块（渐变背景）
            Column.margin({ right: 16 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(new Date(diary.createTime).getDate().toString());
            Text.fontSize(26);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#FFFFFF');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${new Date(diary.createTime).getMonth() + 1}月`);
            Text.fontSize(11);
            Text.fontColor('rgba(255,255,255,0.9)');
            Text.margin({ top: 2 });
        }, Text);
        Text.pop();
        // 左侧：日期块（渐变背景）
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 右侧：内容
            Column.create();
            // 右侧：内容
            Column.layoutWeight(1);
            // 右侧：内容
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 置顶标签
            if (diary.isPinned) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.padding({ left: 6, right: 6, top: 2, bottom: 2 });
                        Row.backgroundColor('#FFF3E0');
                        Row.borderRadius(4);
                        Row.margin({ right: 8 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
                        Image.width(12);
                        Image.height(12);
                        Image.fillColor('#FF9800');
                        Image.margin({ right: 4 });
                    }, Image);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('置顶');
                        Text.fontSize(11);
                        Text.fontColor('#FF9800');
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(diary.title);
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#333333');
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(diary.getFormattedTime().split(' ')[1]);
            Text.fontSize(12);
            Text.fontColor('#BBBBBB');
            Text.margin({ top: 6, bottom: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(diary.getContentPreview(60));
            Text.fontSize(14);
            Text.fontColor('#666666');
            Text.lineHeight(22);
            Text.maxLines(2);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        // 右侧：内容
        Column.pop();
        Row.pop();
        Column.pop();
    }
    swipeActions(diary: Diary, index: number, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 4 });
            Row.height('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 置顶按钮
            Button.createWithChild();
            // 置顶按钮
            Button.width(70);
            // 置顶按钮
            Button.height('100%');
            // 置顶按钮
            Button.backgroundColor('#FF9800');
            // 置顶按钮
            Button.type(ButtonType.Normal);
            // 置顶按钮
            Button.onClick(() => this.togglePin(diary));
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
            Image.width(20);
            Image.height(20);
            Image.fillColor('#FFFFFF');
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(diary.isPinned ? '取消' : '置顶');
            Text.fontSize(11);
            Text.fontColor('#FFFFFF');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        // 置顶按钮
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 删除按钮
            Button.createWithChild();
            // 删除按钮
            Button.width(70);
            // 删除按钮
            Button.height('100%');
            // 删除按钮
            Button.backgroundColor('#FF5252');
            // 删除按钮
            Button.type(ButtonType.Normal);
            // 删除按钮
            Button.onClick(() => this.deleteDiary(diary, index));
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777270, "type": 20000, params: [], "bundleName": "com.example.voicediary", "moduleName": "entry" });
            Image.width(20);
            Image.height(20);
            Image.fillColor('#FFFFFF');
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('删除');
            Text.fontSize(11);
            Text.fontColor('#FFFFFF');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        // 删除按钮
        Button.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "MainPage";
    }
}
registerNamedRoute(() => new MainPage(undefined, {}), "", { bundleName: "com.example.voicediary", moduleName: "entry", pagePath: "pages/MainPage", pageFullPath: "entry/src/main/ets/pages/MainPage", integratedHsp: "false", moduleType: "followWithHap" });
