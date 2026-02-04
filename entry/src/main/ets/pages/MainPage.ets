import router from '@ohos.router';
import { Diary } from '../model/DiaryModel';
import { DataManager } from '../manager/DataManager';
import promptAction from '@ohos.promptAction';
import common from '@ohos.app.ability.common';
import { SpeechRecognizer } from '../manager/SpeechRecognizer';
import hilog from '@ohos.hilog';

@Entry
@Component
struct MainPage {
  @State diaryList: Diary[] = [];
  @State filteredList: Diary[] = [];
  @State searchText: string = '';
  @State showSearch: boolean = false;
  @State selectedFilter: string = 'all'; // all, today, week, month
  @State fabScale: number = 1.0;

  private dataManager: DataManager = DataManager.getInstance(getContext(this) as common.UIAbilityContext);
  private isInitialized: boolean = false;

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
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // 置顶状态相同,按时间倒序
        return b.createTime - a.createTime;
      });
      this.applyFilter();
    } catch (error) {
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
    } else if (this.selectedFilter === 'week') {
      list = list.filter(d => (now - d.createTime) < 7 * oneDayMs);
    } else if (this.selectedFilter === 'month') {
      list = list.filter(d => (now - d.createTime) < 30 * oneDayMs);
    }

    // 搜索过滤
    if (this.searchText.trim()) {
      const keyword = this.searchText.toLowerCase();
      list = list.filter(d =>
      d.title.toLowerCase().includes(keyword) ||
      d.content.toLowerCase().includes(keyword)
      );
    }

    // 重新排序:确保置顶的在最前面
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createTime - a.createTime;
    });

    this.filteredList = list;
  }

  navigateToDetail(diary?: Diary) {
    // FAB 点击动画
    animateTo({ duration: 200, curve: Curve.EaseOut }, () => {
      this.fabScale = 0.9;
    });
    setTimeout(() => {
      animateTo({ duration: 200, curve: Curve.EaseOut }, () => {
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
    } catch (error) {
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
    } catch (error) {
      promptAction.showToast({ message: '操作失败' });
    }
  }

  build() {
    Stack({ alignContent: Alignment.BottomEnd }) {
      Column() {
        // 1. 顶部标题栏 + 搜索栏
        Column() {
          // 标题行
          Row() {
            Column() {
              Text('我的')
                .fontSize(14)
                .fontColor('#999999')
              Text($r('app.string.voice_diary_title'))
                .fontSize(28)
                .fontWeight(FontWeight.Bold)
                .fontColor('#1E88E5')
                .margin({ top: 4 })
            }
            .alignItems(HorizontalAlign.Start)
            .layoutWeight(1)

            // 搜索按钮
            Button() {
              Image($r('app.media.icon'))
                .width(24)
                .height(24)
                .fillColor(this.showSearch ? '#1E88E5' : '#666666')
            }
            .width(44)
            .height(44)
            .type(ButtonType.Circle)
            .backgroundColor(this.showSearch ? '#E3F2FD' : Color.Transparent)
            .onClick(() => {
              animateTo({ duration: 300 }, () => {
                this.showSearch = !this.showSearch;
                if (!this.showSearch) {
                  this.searchText = '';
                  this.applyFilter();
                }
              });
            })
          }
          .width('100%')
          .padding({ left: 24, right: 24, top: 16, bottom: 12 })

          // 搜索框（动画展开）
          if (this.showSearch) {
            Row() {
              Image($r('app.media.icon'))
                .width(20)
                .height(20)
                .fillColor('#999999')
                .margin({ right: 8 })

              TextInput({ placeholder: '搜索日记...', text: this.searchText })
                .layoutWeight(1)
                .fontSize(16)
                .backgroundColor(Color.Transparent)
                .onChange((value: string) => {
                  this.searchText = value;
                  this.applyFilter();
                })

              if (this.searchText) {
                Button() {
                  Image($r('app.media.icon'))
                    .width(16)
                    .height(16)
                    .fillColor('#999999')
                }
                .width(28)
                .height(28)
                .type(ButtonType.Circle)
                .backgroundColor('#F0F0F0')
                .onClick(() => {
                  this.searchText = '';
                  this.applyFilter();
                })
              }
            }
            .width('90%')
            .padding({ left: 16, right: 16, top: 10, bottom: 10 })
            .backgroundColor('#F5F5F5')
            .borderRadius(24)
            .margin({ left: 24, right: 24, bottom: 12 })
            .transition({ type: TransitionType.Insert, opacity: 0, translate: { y: -20 } })
            .transition({ type: TransitionType.Delete, opacity: 0, translate: { y: -20 } })
          }

          // 时间过滤标签
          Row({ space: 12 }) {
            this.FilterChip('全部', 'all')
            this.FilterChip('今天', 'today')
            this.FilterChip('本周', 'week')
            this.FilterChip('本月', 'month')
          }
          .width('100%')
          .padding({ left: 24, right: 24, bottom: 16 })
        }
        .width('100%')
        .backgroundColor('#FFFFFF')
        .shadow({ radius: 4, color: 'rgba(0,0,0,0.06)', offsetY: 2 })

        // 2. 日记列表
        if (this.filteredList.length === 0) {
          Column() {
            Image($r('app.media.icon'))
              .width(120)
              .height(120)
              .opacity(0.3)

            Text(this.searchText ? '没有找到相关日记' : $r('app.string.no_diary_yet'))
              .fontSize(16)
              .fontColor('#999999')
              .margin({ top: 24 })

            if (!this.searchText) {
              Text('点击右下角按钮开始记录')
                .fontSize(14)
                .fontColor('#CCCCCC')
                .margin({ top: 8 })
            }
          }
          .width('100%')
          .layoutWeight(1)
          .justifyContent(FlexAlign.Center)
          .backgroundColor('#FAFAFA')
        } else {
          Column() {
            // 统计信息
            Row() {
              if (this.filteredList.filter(d => d.isPinned).length > 0) {
                Text(`📌 ${this.filteredList.filter(d => d.isPinned).length} 条置顶`)
                  .fontSize(12)
                  .fontColor('#757575')
                  .padding({ left: 8, right: 8, top: 4, bottom: 4 })
                  .backgroundColor('#EEEEEE')
                  .borderRadius(12)
                  .margin({ right: 12 })
              }
              Text(`共 ${this.filteredList.length} 条记录`)
                .fontSize(14)
                .fontColor('#999999')
            }
            .width('100%')
            .padding({ left: 24, right: 24, top: 12, bottom: 8 })

            List({ space: 12 }) {
              ForEach(this.filteredList, (diary: Diary, index: number) => {
                ListItem() {
                  this.DiaryCard(diary)
                }
                .swipeAction({ end: this.swipeActions(diary, index) })
                .onClick(() => this.navigateToDetail(diary))
              }, (diary: Diary) => diary.id)
            }
            .width('100%')
            .layoutWeight(1)
            .padding({ left: 16, right: 16, bottom: 100 })
            .scrollBar(BarState.Off)
            .edgeEffect(EdgeEffect.Spring)
          }
          .layoutWeight(1)
          .backgroundColor('#FAFAFA')
        }
      }
      .width('100%')
      .height('100%')

      // 3. 悬浮新建按钮（带脉冲动画）
      Stack() {
        // 脉冲光晕
        Circle()
          .width(64)
          .height(64)
          .fill('rgba(30, 136, 229, 0.2)')
          .scale({ x: this.fabScale * 1.3, y: this.fabScale * 1.3 })

        Button({ type: ButtonType.Circle }) {
          Image($r('app.media.icon'))
            .width(28)
            .height(28)
            .fillColor('#FFFFFF')
        }
        .width(64)
        .height(64)
        .backgroundColor('#1E88E5')
        .shadow({ radius: 12, color: 'rgba(30, 136, 229, 0.5)', offsetY: 6 })
        .scale({ x: this.fabScale, y: this.fabScale })
        .onClick(() => this.navigateToDetail())
      }
      .position({ x: '78%', y: '85%' })
      .zIndex(999)
      .onAppear(() => {
        // 持续脉冲动画
        setInterval(() => {
          animateTo({ duration: 1500, curve: Curve.EaseInOut }, () => {
            this.fabScale = 1.1;
          });
          setTimeout(() => {
            animateTo({ duration: 1500, curve: Curve.EaseInOut }, () => {
              this.fabScale = 1.0;
            });
          }, 1500);
        }, 3000);
      })
    }
    .width('100%')
    .height('100%')
  }

  @Builder
  FilterChip(label: string, value: string) {
    Text(label)
      .fontSize(14)
      .fontColor(this.selectedFilter === value ? '#FFFFFF' : '#666666')
      .padding({ left: 16, right: 16, top: 8, bottom: 8 })
      .backgroundColor(this.selectedFilter === value ? '#1E88E5' : '#F0F0F0')
      .borderRadius(20)
      .onClick(() => {
        animateTo({ duration: 200 }, () => {
          this.selectedFilter = value;
        });
        this.applyFilter();
      })
  }

  @Builder
  DiaryCard(diary: Diary) {
    Column() {
      Row() {
        // 左侧：日期块（渐变背景）
        Column() {
          Text(new Date(diary.createTime).getDate().toString())
            .fontSize(26)
            .fontWeight(FontWeight.Bold)
            .fontColor('#FFFFFF')
          Text(`${new Date(diary.createTime).getMonth() + 1}月`)
            .fontSize(11)
            .fontColor('rgba(255,255,255,0.9)')
            .margin({ top: 2 })
        }
        .width(60)
        .height(60)
        .justifyContent(FlexAlign.Center)
        .linearGradient({
          angle: 135,
          colors: [[0x42A5F5, 0.0], [0x1E88E5, 1.0]]
        })
        .borderRadius(12)
        .margin({ right: 16 })

        // 右侧：内容
        Column() {
          Row() {
            // 置顶标签
            if (diary.isPinned) {
              Row() {
                Image($r('app.media.icon'))
                  .width(12)
                  .height(12)
                  .fillColor('#FF9800')
                  .margin({ right: 4 })
                Text('置顶')
                  .fontSize(11)
                  .fontColor('#FF9800')
              }
              .padding({ left: 6, right: 6, top: 2, bottom: 2 })
              .backgroundColor('#FFF3E0')
              .borderRadius(4)
              .margin({ right: 8 })
            }

            Text(diary.title)
              .fontSize(16)
              .fontWeight(FontWeight.Bold)
              .fontColor('#333333')
              .maxLines(1)
              .textOverflow({ overflow: TextOverflow.Ellipsis })
              .layoutWeight(1)
          }
          .width('100%')

          Text(diary.getFormattedTime().split(' ')[1])
            .fontSize(12)
            .fontColor('#BBBBBB')
            .margin({ top: 6, bottom: 8 })

          Text(diary.getContentPreview(60))
            .fontSize(14)
            .fontColor('#666666')
            .lineHeight(22)
            .maxLines(2)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
        }
        .layoutWeight(1)
        .alignItems(HorizontalAlign.Start)
      }
      .width('100%')
      .padding(16)
    }
    .width('100%')
    .backgroundColor('#FFFFFF')
    .borderRadius(16)
    .border({
      width: diary.isPinned ? 2 : 0,
      color: diary.isPinned ? '#FFE0B2' : Color.Transparent
    })
    .shadow({ radius: 8, color: 'rgba(0, 0, 0, 0.06)', offsetY: 2 })
  }

  @Builder
  swipeActions(diary: Diary, index: number) {
    Row({ space: 4 }) {
      // 置顶按钮
      Button() {
        Column() {
          Image($r('app.media.icon'))
            .width(20)
            .height(20)
            .fillColor('#FFFFFF')
          Text(diary.isPinned ? '取消' : '置顶')
            .fontSize(11)
            .fontColor('#FFFFFF')
            .margin({ top: 4 })
        }
      }
      .width(70)
      .height('100%')
      .backgroundColor('#FF9800')
      .type(ButtonType.Normal)
      .onClick(() => this.togglePin(diary))

      // 删除按钮
      Button() {
        Column() {
          Image($r('app.media.icon'))
            .width(20)
            .height(20)
            .fillColor('#FFFFFF')
          Text('删除')
            .fontSize(11)
            .fontColor('#FFFFFF')
            .margin({ top: 4 })
        }
      }
      .width(70)
      .height('100%')
      .backgroundColor('#FF5252')
      .type(ButtonType.Normal)
      .onClick(() => this.deleteDiary(diary, index))
    }
    .height('100%')
  }
}