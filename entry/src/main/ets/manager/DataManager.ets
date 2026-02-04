import dataPreferences from '@ohos.data.preferences';
import { Diary, DiaryJson } from '../model/DiaryModel';
import fs from '@ohos.file.fs';
import common from '@ohos.app.ability.common';

/**
 * 数据管理器 - 负责数据持久化
 */
export class DataManager {
  private static instance: DataManager;
  private preferences: dataPreferences.Preferences | null = null;
  private readonly STORE_NAME = 'voice_diary_store';
  private readonly KEY_DIARY_LIST = 'diary_list';
  private context: common.Context;

  private constructor(context: common.Context) {
    this.context = context;
  }

  static getInstance(context?: common.Context): DataManager {
    if (!DataManager.instance && context) {
      DataManager.instance = new DataManager(context);
    }
    return DataManager.instance;
  }

  async init(): Promise<void> {
    try {
      this.preferences = await dataPreferences.getPreferences(this.context, this.STORE_NAME);
    } catch (error) {
      const e = error as Error;
      throw new Error(e.message);
    }
  }

  async saveDiaryList(diaryList: Diary[]): Promise<void> {
    if (!this.preferences) {
      await this.init();
    }
    try {
      const jsonString = JSON.stringify(diaryList.map(diary => diary.toJson()));
      await this.preferences!.put(this.KEY_DIARY_LIST, jsonString);
      await this.preferences!.flush();
    } catch (error) {
      const e = error as Error;
      throw new Error(e.message);
    }
  }

  async loadDiaryList(): Promise<Diary[]> {
    if (!this.preferences) {
      await this.init();
    }
    try {
      const jsonString = await this.preferences!.get(this.KEY_DIARY_LIST, '[]') as string;
      // 修正2: 明确地将解析后的对象断言为 DiaryJson 数组，解决 any 类型报错
      const jsonArray = JSON.parse(jsonString) as DiaryJson[];
      return jsonArray.map((json: DiaryJson) => Diary.fromJson(json));
    } catch (error) {
      const e = error as Error;
      console.error(`[DataManager] Load failed: ${e.message}`);
      return [];
    }
  }

  async deleteAudioFile(audioPath: string): Promise<void> {
    try {
      const file = await fs.open(audioPath);
      await fs.unlink(audioPath);
      fs.close(file);
    } catch (error) {
      // 文件不存在或删除失败，静默处理
    }
  }

  getAudioFilePath(diaryId: string): string {
    const filesDir = this.context.filesDir;
    return `${filesDir}/${diaryId}.m4a`;
  }
}

