import router from '@ohos.router';
import { Diary, DiaryJson } from '../model/DiaryModel';
import { DataManager } from '../manager/DataManager';
import { AudioManager, AudioCallbacks } from '../manager/AudioManager';
import { SpeechRecognizer } from '../manager/SpeechRecognizer';
import promptAction from '@ohos.promptAction';
import hilog from '@ohos.hilog';
import fs from '@ohos.file.fs';

@Entry
@Component
struct DetailPage {
  @State diary: Diary | null = null;
  @State isRecording: boolean = false;
  @State isPlaying: boolean = false;
  @State recognizedText: string = '';
  @State currentTime: string = '00:00';
  @State hasContent: boolean = false;
  @State showMenu: boolean = false;
  // 动画状态
  @State recordBtnScale: number = 1.0;
  @State rippleScale: number = 1.0;
  @State rippleOpacity: number = 0;
  @State waveAmplitude: number[] = [0.3, 0.5, 0.7, 0.5, 0.3, 0.6, 0.4, 0.8];
  @State audioProgress: number = 0; // 0-100
  // 新增：情绪标签
  @State selectedMood: string = '';
  private moodOptions: string[] = ['😊 开心', '😢 难过', '😡 生气', '😌 平静', '🤔 思考', '😴 疲惫'];
  private dataManager: DataManager = DataManager.getInstance();
  private audioManager: AudioManager = AudioManager.getInstance();
  private speechRecognizer: SpeechRecognizer = SpeechRecognizer.getInstance();
  private timerInterval: number = -1;
  private waveInterval: number = -1;
  private isRecognitionStarted: boolean = false;

  aboutToAppear() {
    const params = router.getParams() as Record<string, Object>;
    if (params && params['diary']) {
      this.diary = Diary.fromJson(params['diary'] as DiaryJson);
      if (this.diary) {
        this.recognizedText = this.diary.content;
        this.selectedMood = this.diary.mood || '';
        this.hasContent = true;
      }
    } else {
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
    } catch (error) {
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
          animateTo({ duration: 1000, iterations: -1, curve: Curve.EaseInOut }, () => {
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
          animateTo({ duration: 300 }, () => {
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
    } catch (error) {
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
    } else {
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
    } catch (error) {
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
    } catch (error) {
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
      } else {
        await this.audioManager.play(this.diary.audioPath);
      }
    } catch (error) {
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
      } else {
        diaryList.push(this.diary);
      }
      await this.dataManager.saveDiaryList(diaryList);
      promptAction.showToast({ message: '保存成功' });
      setTimeout(() => router.back(), 500);
    } catch (error) {
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
      } else {
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
    })
  }

  build() {
    Column() {
      // 1. 顶部导航栏（渐变背景）
      Row() {
        Button() {
          Image($r('app.media.icon'))
            .width(24).height(24)
            .fillColor('#FFFFFF')
        }
        .backgroundColor(Color.Transparent)
        .onClick(() => router.back())

        Text(this.hasContent ? '日记详情' : '新建日记')
          .fontSize(18)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')
          .layoutWeight(1)
          .textAlign(TextAlign.Center)

        if (this.hasContent) {
          Button() {
            Image($r('app.media.icon'))
              .width(24).height(24)
              .fillColor('#FFFFFF')
          }
          .backgroundColor(Color.Transparent)
          .onClick(() => {
            this.showMenu = !this.showMenu;
          })
        } else {
          Blank().width(32)
        }
      }
      .width('100%')
      .height(56)
      .padding({ left: 16, right: 16 })
      .linearGradient({
        angle: 135,
        colors: [[0x42A5F5, 0.0], [0x1E88E5, 1.0]]
      })
      .shadow({ radius: 8, color: 'rgba(30, 136, 229, 0.3)', offsetY: 4 })
      .zIndex(10)

      // 菜单弹窗
      if (this.showMenu) {
        Column() {
          Button('保存日记')
            .width('100%')
            .backgroundColor('#FFFFFF')
            .fontColor('#333333')
            .onClick(() => {
              this.showMenu = false;
              this.saveDiary();
            })

          Divider().color('#F0F0F0')

          Button('重新录制')
            .width('100%')
            .backgroundColor('#FFFFFF')
            .fontColor('#FF5252')
            .onClick(() => {
              this.showMenu = false;
              this.resetRecording();
            })
        }
        .width(150)
        .backgroundColor('#FFFFFF')
        .borderRadius(8)
        .position({ x: '75%', y: 60 })
        .shadow({ radius: 8, color: 'rgba(0,0,0,0.15)' })
        .zIndex(100)
        .padding(8)
      }

      // 2. 主体内容
      Column() {
        if (!this.hasContent) {
          // ==================== 录音界面 ====================
          Column() {
            Blank().layoutWeight(1)

            // 录音状态提示
            Column() {
              Text(this.isRecording ? '正在录音中...' : '轻触开始录音')
                .fontSize(18)
                .fontWeight(FontWeight.Medium)
                .fontColor(this.isRecording ? '#1E88E5' : '#999999')
                .margin({ bottom: 12 })

              if (this.isRecording) {
                Text('说出你想记录的内容')
                  .fontSize(14)
                  .fontColor('#BBBBBB')
              }
            }
            .margin({ bottom: 40 })

            // 音频波形可视化
            if (this.isRecording) {
              Row({ space: 4 }) {
                ForEach(this.waveAmplitude, (amplitude: number, index: number) => {
                  Rect()
                    .width(4)
                    .height(60 * amplitude)
                    .fill('#1E88E5')
                    .borderRadius(2)
                }, (item: number, index: number) => index.toString())
              }
              .height(60)
              .justifyContent(FlexAlign.Center)
              .margin({ bottom: 30 })
            }

            // 录音按钮
            Stack() {
              if (this.isRecording) {
                Circle()
                  .width(140)
                  .height(140)
                  .fill('rgba(255, 82, 82, 0.2)')
                  .scale({ x: this.rippleScale, y: this.rippleScale })
                  .opacity(this.rippleOpacity)
              }

              Button({ type: ButtonType.Circle }) {
                Column() {
                  Image(this.isRecording ? $r('app.media.icon') : $r('app.media.icon'))
                    .width(this.isRecording ? 32 : 40)
                    .height(this.isRecording ? 32 : 40)
                    .fillColor('#FFFFFF')
                }
              }
              .width(120)
              .height(120)
              .backgroundColor(this.isRecording ? '#FF5252' : '#1E88E5')
              .shadow({
                radius: 12,
                color: this.isRecording ? 'rgba(255, 82, 82, 0.4)' : 'rgba(30, 136, 229, 0.4)',
                offsetY: 6
              })
              .scale({ x: this.recordBtnScale, y: this.recordBtnScale })
              .onClick(() => {
                animateTo({ duration: 150 }, () => {
                  this.recordBtnScale = 0.95;
                });
                setTimeout(() => {
                  animateTo({ duration: 150 }, () => {
                    this.recordBtnScale = 1.0;
                  });
                }, 150);
                this.toggleRecording();
              })
            }

            // 计时器
            Text(this.currentTime)
              .fontSize(48)
              .fontWeight(FontWeight.Lighter)
              .fontColor(this.isRecording ? '#333333' : '#E0E0E0')
              .fontFamily('Monospace')
              .margin({ top: 50 })
              .transition({ type: TransitionType.All, opacity: 1 })

            Blank().layoutWeight(1)

            // 提示文字
            if (!this.isRecording) {
              Text('点击麦克风开始录音')
                .fontSize(14)
                .fontColor('#CCCCCC')
                .margin({ bottom: 40 })
            }
          }
          .width('100%')
          .height('100%')
          .linearGradient({
            angle: 180,
            colors: [[0xFAFAFA, 0.0], [0xF0F0F0, 1.0]]
          })

        } else {
          // ==================== 详情界面 ====================
          Scroll() {
            Column() {
              // 音频播放器
              if (this.diary?.audioPath) {
                Column() {
                  Row() {
                    Button({ type: ButtonType.Circle }) {
                      Image($r('app.media.icon'))
                        .width(24).height(24)
                        .fillColor('#FFFFFF')
                    }
                    .width(56)
                    .height(56)
                    .backgroundColor(this.isPlaying ? '#FF5252' : '#1E88E5')
                    .shadow({ radius: 8, color: 'rgba(30, 136, 229, 0.3)' })
                    .onClick(() => this.playAudio())

                    Column() {
                      Text(this.isPlaying ? '播放中...' : '点击播放录音')
                        .fontSize(16)
                        .fontColor('#333333')
                        .fontWeight(FontWeight.Medium)

                      // 进度条
                      Progress({ value: this.audioProgress, total: 100, type: ProgressType.Linear })
                        .width('100%')
                        .height(4)
                        .color('#1E88E5')
                        .margin({ top: 8 })
                    }
                    .margin({ left: 16 })
                    .layoutWeight(1)
                    .alignItems(HorizontalAlign.Start)

                    if (!this.isRecognitionStarted) {
                      Button('重录')
                        .fontSize(14)
                        .fontColor('#FF5252')
                        .backgroundColor('#FFE5E5')
                        .padding({
                          left: 16,
                          right: 16,
                          top: 8,
                          bottom: 8
                        })
                        .borderRadius(20)
                        .onClick(() => this.resetRecording())
                    }
                  }
                  .width('100%')
                }
                .width('100%')
                .padding(20)
                .backgroundColor('#FFFFFF')
                .borderRadius(16)
                .margin({ bottom: 16 })
                .shadow({ radius: 8, color: 'rgba(0,0,0,0.06)', offsetY: 2 })
              }

              // 情绪标签选择
              Column() {
                Text('今天的心情')
                  .fontSize(14)
                  .fontColor('#999999')
                  .margin({ bottom: 12 })
                  .width('100%')
                Flex({ wrap: FlexWrap.Wrap, justifyContent: FlexAlign.Start }) {
                  ForEach(this.moodOptions, (mood: string) => {
                    Text(mood)
                      .fontSize(14)
                      .padding({
                        left: 12,
                        right: 12,
                        top: 8,
                        bottom: 8
                      })
                      .backgroundColor(this.selectedMood === mood ? '#E3F2FD' : '#F5F5F5')
                      .fontColor(this.selectedMood === mood ? '#1E88E5' : '#666666')
                      .borderRadius(20)
                      .border({
                        width: this.selectedMood === mood ? 2 : 0,
                        color: '#1E88E5'
                      })
                      .onClick(() => {
                        animateTo({ duration: 200 }, () => {
                          this.selectedMood = mood;
                        });
                      })
                      .margin({ right: 12, bottom: 8 })
                  }, (mood: string) => mood)
                }
                .width('100%')
              }
              .width('100%')
              .padding(20)
              .backgroundColor('#FFFFFF')
              .borderRadius(16)
              .margin({ bottom: 16 })
              .shadow({ radius: 8, color: 'rgba(0,0,0,0.06)', offsetY: 2 })

              // 文本内容
              Column() {
                Row() {
                  Text('内容详情')
                    .fontSize(16)
                    .fontWeight(FontWeight.Bold)
                    .fontColor('#333333')

                  Blank()

                  Text(`${this.recognizedText.length} 字`)
                    .fontSize(12)
                    .fontColor('#999999')
                }
                .width('100%')
                .margin({ bottom: 16 })

                TextArea({ text: this.recognizedText })
                  .width('100%')
                  .height(450)
                  .fontSize(16)
                  .fontColor('#333333')
                  .lineHeight(28)
                  .padding(16)
                  .backgroundColor('#FAFAFA')
                  .borderRadius(12)
                  .onChange((value: string) => {
                    this.recognizedText = value;
                  })
              }
              .width('100%')
              .padding(20)
              .backgroundColor('#FFFFFF')
              .borderRadius(16)
              .shadow({ radius: 8, color: 'rgba(0,0,0,0.06)', offsetY: 2 })

            }
            .padding(16)
          }
          .layoutWeight(1)
          .edgeEffect(EdgeEffect.Spring)
        }
      }
      .layoutWeight(1)
      .width('100%')
      .backgroundColor('#F5F5F5')
    }
    .width('100%')
    .height('100%')
  }
}