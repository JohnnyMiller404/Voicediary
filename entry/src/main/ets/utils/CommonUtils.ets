// entry/src/main/ets/utils/CommonUtils.ets

import hilog from '@ohos.hilog';

/**
 * 通用工具类
 */
export class CommonUtils {
  
  /**
   * 生成唯一ID
   */
  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 格式化日期
   * @param timestamp 时间戳
   * @param format 格式：'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', 'relative'
   */
  static formatDate(timestamp: number, format: string = 'YYYY-MM-DD HH:mm'): string {
    const date = new Date(timestamp);
    
    if (format === 'relative') {
      return this.getRelativeTime(timestamp);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second);
  }

  /**
   * 获取相对时间描述
   */
  static getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;
    
    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < week) {
      return `${Math.floor(diff / day)}天前`;
    } else if (diff < month) {
      return `${Math.floor(diff / week)}周前`;
    } else if (diff < year) {
      return `${Math.floor(diff / month)}个月前`;
    } else {
      return `${Math.floor(diff / year)}年前`;
    }
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  /**
   * 格式化时长（秒转为 mm:ss 格式）
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * 节流函数
   */
  static throttle(func: Function, delay: number): Function {
    let lastTime = 0;
    return function(...args: any[]) {
      const now = Date.now();
      if (now - lastTime >= delay) {
        func.apply(this, args);
        lastTime = now;
      }
    };
  }

  /**
   * 防抖函数
   */
  static debounce(func: Function, delay: number): Function {
    let timer: number = -1;
    return function(...args: any[]) {
      if (timer >= 0) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  /**
   * 深拷贝对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any;
    }
    
    if (obj instanceof Array) {
      const cloneArr: any[] = [];
      obj.forEach((item) => {
        cloneArr.push(this.deepClone(item));
      });
      return cloneArr as any;
    }
    
    const cloneObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloneObj[key] = this.deepClone(obj[key]);
      }
    }
    return cloneObj;
  }

  /**
   * 验证字符串是否为空
   */
  static isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * 截断文本
   */
  static truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 高亮关键词
   */
  static highlightKeyword(text: string, keyword: string): string {
    if (!keyword || keyword.trim() === '') {
      return text;
    }
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * 随机获取数组元素
   */
  static randomPick<T>(array: T[]): T {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
  }

  /**
   * 数组去重
   */
  static unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }

  /**
   * 延迟执行
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 安全的JSON解析
   */
  static safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      hilog.error(0x0000, 'CommonUtils', 'JSON解析失败: %{public}s', error.message);
      return defaultValue;
    }
  }

  /**
   * 计算两个日期之间的天数差
   */
  static daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.round(diffTime / oneDay);
  }

  /**
   * 判断是否是今天
   */
  static isToday(timestamp: number): boolean {
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  /**
   * 判断是否是本周
   */
  static isThisWeek(timestamp: number): boolean {
    const date = new Date(timestamp);
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    
    return date >= weekStart;
  }

  /**
   * 获取问候语
   */
  static getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 6) {
      return '夜深了';
    } else if (hour < 12) {
      return '早上好';
    } else if (hour < 14) {
      return '中午好';
    } else if (hour < 18) {
      return '下午好';
    } else {
      return '晚上好';
    }
  }

  /**
   * 颜色转换：HEX to RGB
   */
  static hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * 生成随机颜色
   */
  static randomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /**
   * 振动反馈
   */
  static vibrate(duration: number = 50): void {
    try {
      // 注意：需要导入 vibrator 模块
      // import vibrator from '@ohos.vibrator';
      // vibrator.vibrate({ type: 'time', duration: duration });
      hilog.info(0x0000, 'CommonUtils', '触发振动反馈');
    } catch (error) {
      hilog.error(0x0000, 'CommonUtils', '振动失败: %{public}s', JSON.stringify(error));
    }
  }

  /**
   * 复制到剪贴板
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      // 注意：需要导入 pasteboard 模块
      // import pasteboard from '@ohos.pasteboard';
      // const pasteData = pasteboard.createPlainTextData(text);
      // const systemPasteboard = pasteboard.getSystemPasteboard();
      // await systemPasteboard.setPasteData(pasteData);
      hilog.info(0x0000, 'CommonUtils', '已复制到剪贴板');
      return true;
    } catch (error) {
      hilog.error(0x0000, 'CommonUtils', '复制失败: %{public}s', JSON.stringify(error));
      return false;
    }
  }
}

/**
 * 使用示例：
 * 
 * import { CommonUtils } from '../utils/CommonUtils';
 * 
 * // 格式化日期
 * const dateStr = CommonUtils.formatDate(Date.now(), 'YYYY-MM-DD HH:mm');
 * 
 * // 相对时间
 * const relativeTime = CommonUtils.formatDate(diary.createTime, 'relative');
 * 
 * // 防抖搜索
 * const debouncedSearch = CommonUtils.debounce(this.searchDiaries, 300);
 * 
 * // 生成ID
 * const newId = CommonUtils.generateId();
 */
