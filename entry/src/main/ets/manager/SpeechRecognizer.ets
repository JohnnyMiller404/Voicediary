import hilog from '@ohos.hilog';
import { speechRecognizer } from '@kit.CoreSpeechKit';
import { BusinessError } from '@ohos.base';

export class SpeechRecognizer {
  private static instance: SpeechRecognizer;
  private asrEngine: speechRecognizer.SpeechRecognitionEngine | null = null;
  private isEngineReady: boolean = false;
  private sessionId: string = `diary_${Date.now()}`;

  private resolvePromise: ((text: string) => void) | null = null;
  private rejectPromise: ((reason?: Error) => void) | null = null;

  private constructor() {
    // 构造函数现在是空的，不再自动初始化
  }

  static getInstance(): SpeechRecognizer {
    if (!SpeechRecognizer.instance) {
      SpeechRecognizer.instance = new SpeechRecognizer();
    }
    return SpeechRecognizer.instance;
  }

  public initialize(): Promise<boolean> {
    if (this.isEngineReady) {
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      const extraParam: Record<string, Object> = { "recognizerMode": "short" };
      const initParams: speechRecognizer.CreateEngineParams = {
        language: 'zh-CN',
        online: 1,
        extraParams: extraParam
      };

      try {
        speechRecognizer.createEngine(initParams, (err: BusinessError, engine: speechRecognizer.SpeechRecognitionEngine) => {
          if (!err && engine) {
            this.asrEngine = engine;
            this.isEngineReady = true;
            hilog.info(0x0000, 'SpeechRecognizer', 'CoreSpeechKit 引擎创建成功');
            this.setupListener();
            resolve(true);
          } else {
            this.isEngineReady = false;
            hilog.error(0x0000, 'SpeechRecognizer', `引擎创建失败: ${err ? err.message : '未知错误'}`);
            reject(new Error(`引擎创建失败: ${err ? err.message : '未知错误'}`));
          }
        });
      } catch (e) {
        const err = e as BusinessError;
        reject(new Error(`调用 createEngine 异常: ${err.message}`));
      }
    });
  }

  private setupListener(): void {
    if (!this.asrEngine) return;
    const listener: speechRecognizer.RecognitionListener = {
      onStart: (sessionId: string) => {
        hilog.info(0x0000, 'SpeechRecognizer', `onStart, sessionId: ${sessionId}`);
      },
      onEvent: (sessionId: string, eventCode: number) => {
        hilog.info(0x0000, 'SpeechRecognizer', `onEvent, sessionId: ${sessionId}, code: ${eventCode}`);
      },
      onResult: (sessionId: string, result: speechRecognizer.SpeechRecognitionResult) => {
        hilog.info(0x0000, 'SpeechRecognizer', `onResult: ${JSON.stringify(result)}`);
        if (result.isLast) {
          this.resolvePromise?.(result.result);
        }
      },
      onComplete: (sessionId: string) => {
        hilog.info(0x0000, 'SpeechRecognizer', `onComplete, sessionId: ${sessionId}`);
      },
      onError: (sessionId: string, errorCode: number, errorMessage: string) => {
        hilog.error(0x0000, 'SpeechRecognizer', `onError: ${errorCode}, ${errorMessage}`);
        this.rejectPromise?.(new Error(`识别错误: ${errorMessage}`));
      },
    };
    this.asrEngine.setListener(listener);
  }

  public startRecognitionSession(): Promise<string> {
    if (!this.isEngineReady || !this.asrEngine) {
      return Promise.reject(new Error("语音识别引擎未就绪"));
    }

    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      const audioParam: speechRecognizer.AudioInfo = {
        audioType: 'pcm', sampleRate: 16000, soundChannel: 1, sampleBit: 16
      };
      const recognizerParams: speechRecognizer.StartParams = {
        sessionId: this.sessionId,
        audioInfo: audioParam,
      };

      try {
        // --- 最终修正：在这里加上非空断言操作符 '!' ---
        this.asrEngine!.startListening(recognizerParams);
      } catch (error) {
        const e = error as BusinessError;
        this.rejectPromise?.(new Error(`启动识别失败: ${e.message}`));
      }
    });
  }

  public feedAudio(pcmData: Uint8Array): void {
    if (!this.isEngineReady || !this.asrEngine) return;
    try {
      this.asrEngine.writeAudio(this.sessionId, pcmData);
    } catch (error) {
      hilog.error(0x0000, 'SpeechRecognizer', '写入音频流失败');
    }
  }

  public stopRecognitionSession(): void {
    if (!this.isEngineReady || !this.asrEngine) return;
    try {
      this.asrEngine.finish(this.sessionId);
    } catch (error) {
      hilog.error(0x0000, 'SpeechRecognizer', '结束识别会话失败');
    }
  }

  public destroyEngine(): void {
    if (this.asrEngine) {
      this.asrEngine.shutdown();
      this.isEngineReady = false;
      this.asrEngine = null;
    }
  }
}