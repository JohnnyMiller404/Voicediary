// DiaryModel.ets - 需要添加新字段支持

export interface DiaryJson {
  id: string;
  title: string;
  content: string;
  audioPath: string;
  createTime: number;
  isPinned?: boolean;  // 新增：是否置顶
  mood?: string;       // 新增:情绪标签
  tags?: string[];     // 新增:自定义标签
}

export class Diary {
  id: string;
  title: string;
  content: string;
  audioPath: string;
  createTime: number;
  isPinned: boolean;
  mood: string;
  tags: string[];

  constructor(
    id: string,
    title: string,
    content: string,
    audioPath: string,
    createTime: number,
    isPinned: boolean = false,
    mood: string = '',
    tags: string[] = []
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.audioPath = audioPath;
    this.createTime = createTime;
    this.isPinned = isPinned;
    this.mood = mood;
    this.tags = tags;
  }

  static fromJson(json: DiaryJson): Diary {
    return new Diary(
      json.id,
      json.title,
      json.content,
      json.audioPath,
      json.createTime,
      json.isPinned ?? false,
      json.mood ?? '',
      json.tags ?? []
    );
  }

  toJson(): DiaryJson {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      audioPath: this.audioPath,
      createTime: this.createTime,
      isPinned: this.isPinned,
      mood: this.mood,
      tags: this.tags
    };
  }

  getFormattedTime(): string {
    const date = new Date(this.createTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  getContentPreview(maxLength: number = 50): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }
    return this.content.substring(0, maxLength) + '...';
  }

  static generateTitle(content: string, timestamp: number): string {
    const date = new Date(timestamp);
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

    if (!content || content.trim().length === 0) {
      return `${dateStr}的日记`;
    }

    // 提取前20个字符作为标题
    const preview = content.trim().substring(0, 20);
    return preview.length < content.trim().length ? `${preview}...` : preview;
  }
}