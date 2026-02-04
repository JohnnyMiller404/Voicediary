import media from "@ohos:multimedia.media";
import audio from "@ohos:multimedia.audio";
import fs from "@ohos:file.fs";
import hilog from "@ohos:hilog";
import type { BusinessError } from "@ohos:base";
/**
 * 音频管理器 - 统一管理录音和播放功能
 * 修复版：解决状态管理和资源释放问题
 */
export class AudioManager {
    private static instance: AudioManager;
    private recorder: media.AVRecorder | null = null;
    private player: media.AVPlayer | null = null;
    private audioCapturer: audio.AudioCapturer | null = null;
    private isCapturing: boolean = false;
    private isRecording: boolean = false;
    private isPlaying: boolean = false;
    private currentAudioPath: string = '';
    private recordStartTime: number = 0;
    private playerState: media.AVPlayerState = 'idle';
    private recorderState: media.AVRecorderState = 'idle';
    // 新增：防止重复初始化的标记
    private isRecorderInitializing: boolean = false;
    private isPlayerInitializing: boolean = false;
    private onPcmDataCallback?: (data: ArrayBuffer) => void;
    private onRecordStartCallback?: () => void;
    private onRecordStopCallback?: (duration: number) => void;
    private onPlayStartCallback?: () => void;
    private onPlayCompleteCallback?: () => void;
    private onErrorCallback?: (error: string) => void;
    private constructor() { }
    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }
    async initRecorder(): Promise<void> {
        // 防止重复初始化
        if (this.isRecorderInitializing) {
            hilog.info(0x0000, 'AudioManager', '录音器正在初始化中，跳过');
            return;
        }
        if (this.recorder && this.recorderState !== 'released') {
            hilog.info(0x0000, 'AudioManager', '录音器已存在且可用');
            return;
        }
        try {
            this.isRecorderInitializing = true;
            // 如果存在旧实例，先清理
            if (this.recorder) {
                try {
                    await this.recorder.release();
                }
                catch (e) {
                    hilog.warn(0x0000, 'AudioManager', '释放旧录音器失败，继续');
                }
            }
            this.recorder = await media.createAVRecorder();
            this.recorderState = 'idle';
            // 监听录音器状态变化
            this.recorder.on('stateChange', (state: media.AVRecorderState) => {
                hilog.info(0x0000, 'AudioManager', `录音器状态变化: ${state}`);
                this.recorderState = state;
            });
            hilog.info(0x0000, 'AudioManager', '录音器初始化成功');
        }
        catch (error) {
            const e = error as BusinessError;
            const errorMsg = `录音器初始化失败: ${e.message}`;
            hilog.error(0x0000, 'AudioManager', errorMsg);
            this.onErrorCallback?.(errorMsg);
            throw new Error(errorMsg);
        }
        finally {
            this.isRecorderInitializing = false;
        }
    }
    async initPlayer(): Promise<void> {
        // 防止重复初始化
        if (this.isPlayerInitializing) {
            hilog.info(0x0000, 'AudioManager', '播放器正在初始化中，跳过');
            return;
        }
        // 如果播放器存在且未被释放，直接返回
        if (this.player && this.playerState !== 'released') {
            hilog.info(0x0000, 'AudioManager', `播放器已存在，当前状态: ${this.playerState}`);
            return;
        }
        try {
            this.isPlayerInitializing = true;
            // 如果存在旧实例，先清理
            if (this.player) {
                try {
                    await this.player.release();
                }
                catch (e) {
                    hilog.warn(0x0000, 'AudioManager', '释放旧播放器失败，继续');
                }
            }
            this.player = await media.createAVPlayer();
            this.playerState = 'idle';
            this.player.on('stateChange', (state: media.AVPlayerState) => {
                hilog.info(0x0000, 'AudioManager', `播放器状态变化: ${state}`);
                this.playerState = state;
                if (state === 'completed' || state === 'stopped') {
                    this.isPlaying = false;
                    this.onPlayCompleteCallback?.();
                }
                else if (state === 'playing') {
                    this.isPlaying = true;
                    this.onPlayStartCallback?.();
                }
            });
            this.player.on('error', (err) => {
                const e = err as Error;
                this.isPlaying = false;
                hilog.error(0x0000, 'AudioManager', `播放错误: ${e.message}`);
                this.onErrorCallback?.('播放失败: ' + e.message);
            });
            hilog.info(0x0000, 'AudioManager', '播放器初始化成功');
        }
        catch (error) {
            const e = error as BusinessError;
            const errorMsg = `播放器初始化失败: ${e.message}`;
            hilog.error(0x0000, 'AudioManager', errorMsg);
            this.onErrorCallback?.(errorMsg);
            throw new Error(errorMsg);
        }
        finally {
            this.isPlayerInitializing = false;
        }
    }
    async initCapturer(): Promise<void> {
        if (this.audioCapturer) {
            hilog.info(0x0000, 'AudioManager', 'AudioCapturer 已存在');
            return;
        }
        try {
            const audioStreamInfo: audio.AudioStreamInfo = {
                samplingRate: audio.AudioSamplingRate.SAMPLE_RATE_16000,
                channels: audio.AudioChannel.CHANNEL_1,
                sampleFormat: audio.AudioSampleFormat.SAMPLE_FORMAT_S16LE,
                encodingType: audio.AudioEncodingType.ENCODING_TYPE_RAW
            };
            const audioCapturerInfo: audio.AudioCapturerInfo = {
                source: audio.SourceType.SOURCE_TYPE_MIC,
                capturerFlags: 0
            };
            const capturerOptions: audio.AudioCapturerOptions = {
                streamInfo: audioStreamInfo,
                capturerInfo: audioCapturerInfo
            };
            this.audioCapturer = await audio.createAudioCapturer(capturerOptions);
            hilog.info(0x0000, 'AudioManager', 'AudioCapturer 初始化成功');
        }
        catch (error) {
            const e = error as BusinessError;
            const errorMsg = `AudioCapturer 初始化失败: ${e.message}`;
            hilog.error(0x0000, 'AudioManager', errorMsg);
            this.onErrorCallback?.(errorMsg);
            throw new Error(errorMsg);
        }
    }
    async startRecording(audioPath: string, config?: RecordConfig): Promise<void> {
        if (this.isRecording) {
            hilog.warn(0x0000, 'AudioManager', '已经在录音中');
            return;
        }
        try {
            // 1. 确保录音器已初始化
            await this.initRecorder();
            // 2. 检查录音器状态，如果不是 idle，先重置
            if (this.recorderState !== 'idle') {
                hilog.info(0x0000, 'AudioManager', `录音器状态为 ${this.recorderState}，正在重置...`);
                await this.recorder!.reset();
                await this.waitForRecorderState('idle', 2000);
            }
            // 3. 打开文件
            const file = await fs.open(audioPath, fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE);
            // 4. 配置录音参数
            const defaultConfig: media.AVRecorderConfig = {
                audioSourceType: media.AudioSourceType.AUDIO_SOURCE_TYPE_MIC,
                profile: {
                    audioBitrate: config?.bitrate || 32000,
                    audioChannels: config?.channels || 1,
                    audioCodec: media.CodecMimeType.AUDIO_AAC,
                    audioSampleRate: config?.sampleRate || 16000,
                    fileFormat: media.ContainerFormatType.CFT_MPEG_4A
                },
                url: `fd://${file.fd}`
            };
            // 5. 准备并启动录音器
            await this.recorder!.prepare(defaultConfig);
            await this.waitForRecorderState('prepared', 2000);
            await this.recorder!.start();
            hilog.info(0x0000, 'AudioManager', '录音器启动成功');
            // 6. 启动音频采集器
            await this.initCapturer();
            if (this.audioCapturer) {
                await this.audioCapturer.start();
                this.isCapturing = true;
                this.readPcmDataLoop();
                hilog.info(0x0000, 'AudioManager', 'PCM采集器启动成功');
            }
            // 7. 更新状态并触发回调
            this.isRecording = true;
            this.currentAudioPath = audioPath;
            this.recordStartTime = Date.now();
            this.onRecordStartCallback?.();
        }
        catch (error) {
            const e = error as BusinessError;
            const errorMsg = `开始录音失败: ${e.message}`;
            hilog.error(0x0000, 'AudioManager', errorMsg);
            this.isRecording = false;
            this.onErrorCallback?.(errorMsg);
            throw new Error(errorMsg);
        }
    }
    async stopRecording(): Promise<RecordResult> {
        if (!this.isRecording) {
            hilog.warn(0x0000, 'AudioManager', '当前没有在录音');
            return { success: false, audioPath: '', duration: 0 };
        }
        if (!this.recorder) {
            hilog.error(0x0000, 'AudioManager', '录音器不存在');
            return { success: false, audioPath: '', duration: 0 };
        }
        // 计算时长（提前计算，避免后续出错无法获取）
        const duration = Math.floor((Date.now() - this.recordStartTime) / 1000);
        const audioPath = this.currentAudioPath;
        try {
            // 1. 先停止音频采集器
            this.isCapturing = false;
            if (this.audioCapturer) {
                try {
                    await this.audioCapturer.stop();
                    await this.audioCapturer.release();
                    this.audioCapturer = null;
                    hilog.info(0x0000, 'AudioManager', 'PCM采集器已停止');
                }
                catch (e) {
                    hilog.warn(0x0000, 'AudioManager', 'PCM采集器停止失败，继续');
                }
            }
            // 2. 检查录音器状态
            if (this.recorderState === 'idle' || this.recorderState === 'released') {
                hilog.warn(0x0000, 'AudioManager', `录音器状态异常: ${this.recorderState}，跳过停止操作`);
                this.isRecording = false;
                this.onRecordStopCallback?.(duration);
                return { success: true, audioPath: audioPath, duration: duration };
            }
            // 3. 只有在 started 状态才停止录音器
            if (this.recorderState === 'started') {
                try {
                    await this.recorder.stop();
                    hilog.info(0x0000, 'AudioManager', '录音器已停止');
                }
                catch (e) {
                    hilog.warn(0x0000, 'AudioManager', '录音器停止失败，尝试重置');
                }
            }
            // 4. 重置录音器（无论停止是否成功）
            try {
                await this.recorder.reset();
                hilog.info(0x0000, 'AudioManager', '录音器已重置');
            }
            catch (e) {
                hilog.warn(0x0000, 'AudioManager', '录音器重置失败');
            }
            // 5. 更新状态并触发回调
            this.isRecording = false;
            this.onRecordStopCallback?.(duration);
            return { success: true, audioPath: audioPath, duration: duration };
        }
        catch (error) {
            const e = error as BusinessError;
            const errorMsg = `停止录音失败: ${e.message}`;
            hilog.error(0x0000, 'AudioManager', errorMsg);
            this.isRecording = false;
            // 即使出错也触发回调，让用户知道录音已结束
            this.onRecordStopCallback?.(duration);
            return { success: true, audioPath: audioPath, duration: duration };
        }
    }
    private async readPcmDataLoop() {
        if (!this.audioCapturer)
            return;
        try {
            const bufferSize = await this.audioCapturer.getBufferSize();
            while (this.isCapturing) {
                try {
                    const buffer = await this.audioCapturer.read(bufferSize, true);
                    this.onPcmDataCallback?.(buffer);
                }
                catch (error) {
                    hilog.error(0x0000, 'AudioManager', '读取PCM数据失败');
                    break;
                }
            }
        }
        catch (error) {
            hilog.error(0x0000, 'AudioManager', '获取缓冲区大小失败');
            this.isCapturing = false;
        }
    }
    async play(audioPath: string): Promise<void> {
        let fileHandle: fs.File | null = null;
        try {
            // 1. 停止当前播放
            if (this.isPlaying) {
                await this.stop();
                await this.delay(300);
            }
            // 2. 确保播放器已初始化
            await this.initPlayer();
            // 3. 检查文件是否存在
            try {
                await fs.access(audioPath);
                hilog.info(0x0000, 'AudioManager', `文件存在: ${audioPath}`);
            }
            catch (e) {
                throw new Error('音频文件不存在');
            }
            // 4. 根据当前状态处理播放器
            hilog.info(0x0000, 'AudioManager', `准备播放，当前状态: ${this.playerState}`);
            if (this.playerState === 'released' || !this.player) {
                hilog.info(0x0000, 'AudioManager', '播放器已释放，重新初始化...');
                await this.initPlayer();
            }
            else if (this.playerState !== 'idle') {
                hilog.info(0x0000, 'AudioManager', `当前状态 ${this.playerState}，正在重置...`);
                await this.player!.reset();
                await this.waitForPlayerState('idle', 3000);
            }
            // *** 关键修复：使用文件描述符格式 ***
            // 5. 打开文件获取文件描述符
            fileHandle = await fs.open(audioPath, fs.OpenMode.READ_ONLY);
            // 6. 获取文件信息（用于 AVFileDescriptor）
            const stat = await fs.stat(audioPath);
            // 7. 构造 AVFileDescriptor 对象
            const avFileDescriptor: media.AVFileDescriptor = {
                fd: fileHandle.fd,
                offset: 0,
                length: stat.size
            };
            hilog.info(0x0000, 'AudioManager', `使用文件描述符播放: fd=${fileHandle.fd}, size=${stat.size}`);
            // 8. 设置音频源（使用 AVFileDescriptor）
            this.player!.fdSrc = avFileDescriptor;
            // 9. 等待自动进入 initialized 状态
            await this.waitForPlayerState('initialized', 3000);
            // 10. 准备播放
            await this.player!.prepare();
            hilog.info(0x0000, 'AudioManager', '播放器准备中...');
            // 11. 等待进入 prepared 状态
            await this.waitForPlayerState('prepared', 3000);
            // 12. 开始播放
            await this.player!.play();
            this.currentAudioPath = audioPath;
            hilog.info(0x0000, 'AudioManager', '开始播放');
            // 注意：不要在这里关闭文件，播放完成后再关闭
        }
        catch (error) {
            // 如果出错，关闭文件句柄
            if (fileHandle) {
                try {
                    fs.closeSync(fileHandle.fd);
                }
                catch (e) {
                    hilog.warn(0x0000, 'AudioManager', '关闭文件失败');
                }
            }
            const e = error as BusinessError | Error;
            const errorMsg = `播放失败: ${e.message}`;
            hilog.error(0x0000, 'AudioManager', errorMsg);
            this.onErrorCallback?.(errorMsg);
            throw new Error(errorMsg);
        }
    }
    private async waitForPlayerState(targetState: media.AVPlayerState, timeout: number = 3000): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.playerState === targetState) {
                resolve();
                return;
            }
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (this.playerState === targetState) {
                    clearInterval(checkInterval);
                    resolve();
                }
                else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`等待播放器状态 ${targetState} 超时，当前状态: ${this.playerState}`));
                }
            }, 100);
        });
    }
    private async waitForRecorderState(targetState: media.AVRecorderState, timeout: number = 3000): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.recorderState === targetState) {
                resolve();
                return;
            }
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (this.recorderState === targetState) {
                    clearInterval(checkInterval);
                    resolve();
                }
                else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`等待录音器状态 ${targetState} 超时，当前状态: ${this.recorderState}`));
                }
            }, 100);
        });
    }
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async stop(): Promise<void> {
        if (!this.isPlaying || !this.player) {
            hilog.info(0x0000, 'AudioManager', '当前没有在播放');
            return;
        }
        try {
            await this.player.stop();
            hilog.info(0x0000, 'AudioManager', '播放已停止');
        }
        catch (error) {
            const e = error as BusinessError;
            hilog.error(0x0000, 'AudioManager', `停止播放失败: ${e.message}`);
            throw new Error(e.message);
        }
    }
    setCallbacks(callbacks: AudioCallbacks): void {
        this.onRecordStartCallback = callbacks.onRecordStart;
        this.onRecordStopCallback = callbacks.onRecordStop;
        this.onPlayStartCallback = callbacks.onPlayStart;
        this.onPlayCompleteCallback = callbacks.onPlayComplete;
        this.onErrorCallback = callbacks.onError;
        this.onPcmDataCallback = callbacks.onPcmData;
    }
    // 新增：清理所有资源的方法
    async cleanup(): Promise<void> {
        try {
            if (this.audioCapturer) {
                await this.audioCapturer.release();
                this.audioCapturer = null;
            }
            if (this.recorder) {
                await this.recorder.release();
                this.recorder = null;
            }
            if (this.player) {
                await this.player.release();
                this.player = null;
            }
            hilog.info(0x0000, 'AudioManager', '所有音频资源已清理');
        }
        catch (error) {
            hilog.error(0x0000, 'AudioManager', '清理资源失败');
        }
    }
}
export interface RecordConfig {
    bitrate?: number;
    channels?: number;
    sampleRate?: number;
}
export interface RecordResult {
    success: boolean;
    audioPath: string;
    duration: number;
}
export interface AudioCallbacks {
    onRecordStart?: () => void;
    onRecordStop?: (duration: number) => void;
    onPlayStart?: () => void;
    onPlayComplete?: () => void;
    onError?: (error: string) => void;
    onPcmData?: (data: ArrayBuffer) => void;
}
