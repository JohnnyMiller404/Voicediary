import UIAbility from "@ohos:app.ability.UIAbility";
import type Want from "@ohos:app.ability.Want";
import type AbilityConstant from "@ohos:app.ability.AbilityConstant";
import hilog from "@ohos:hilog";
import type window from "@ohos:window";
import abilityAccessCtrl from "@ohos:abilityAccessCtrl";
import type { Permissions } from "@ohos:abilityAccessCtrl";
import type { BusinessError } from "@ohos:base";
const TAG = 'VoiceDiaryEntry';
export default class EntryAbility extends UIAbility {
    private windowStage: window.WindowStage | null = null;
    onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onCreate');
        hilog.info(0x0000, TAG, 'Want: %{public}s', JSON.stringify(want));
        hilog.info(0x0000, TAG, 'LaunchParam: %{public}s', JSON.stringify(launchParam));
    }
    onDestroy(): void {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onDestroy');
        // 清理资源
        this.windowStage = null;
    }
    async onWindowStageCreate(windowStage: window.WindowStage): Promise<void> {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onWindowStageCreate');
        // 保存 windowStage 引用
        this.windowStage = windowStage;
        // 在加载任何页面之前，先完成权限请求
        const hasPermissions = await this.requestAllPermissions();
        if (hasPermissions) {
            hilog.info(0x0000, TAG, '所有权限已获取，开始加载页面...');
            this.loadMainPage(windowStage);
        }
        else {
            hilog.error(0x0000, TAG, '核心权限被拒绝，应用无法正常运行');
            this.context.terminateSelf();
        }
    }
    // *** 关键修复2：添加 onNewWant 方法处理应用被重新启动 ***
    onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam): void {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onNewWant');
        hilog.info(0x0000, TAG, 'New Want: %{public}s', JSON.stringify(want));
        // 当应用在后台时被重新启动（例如点击桌面图标），确保显示主页面
        if (this.windowStage) {
            hilog.info(0x0000, TAG, '重新加载主页面');
            this.loadMainPage(this.windowStage);
        }
    }
    // *** 新增方法：统一的页面加载逻辑 ***
    private loadMainPage(windowStage: window.WindowStage): void {
        windowStage.loadContent('pages/MainPage', (err) => {
            if (err.code) {
                hilog.error(0x0000, TAG, '加载页面失败: %{public}s', JSON.stringify(err));
                return;
            }
            hilog.info(0x0000, TAG, '页面加载成功');
        });
    }
    async requestAllPermissions(): Promise<boolean> {
        const permissions: Array<Permissions> = [
            'ohos.permission.MICROPHONE',
            'ohos.permission.READ_MEDIA',
            'ohos.permission.WRITE_MEDIA',
            'ohos.permission.INTERNET'
        ];
        const atManager = abilityAccessCtrl.createAtManager();
        try {
            hilog.info(0x0000, TAG, '开始请求权限...');
            const result = await atManager.requestPermissionsFromUser(this.context, permissions);
            let isAllGranted = true;
            for (let i = 0; i < result.authResults.length; i++) {
                const permission = permissions[i];
                const grantResult = result.authResults[i];
                if (grantResult !== abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
                    hilog.error(0x0000, TAG, `权限 ${permission} 被拒绝`);
                    isAllGranted = false;
                }
                else {
                    hilog.info(0x0000, TAG, `权限 ${permission} 已授予`);
                }
            }
            return isAllGranted;
        }
        catch (error) {
            const err = error as BusinessError;
            hilog.error(0x0000, TAG, `权限请求异常: ${err.message}`);
            return false;
        }
    }
    onWindowStageDestroy(): void {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onWindowStageDestroy');
        this.windowStage = null;
    }
    onForeground(): void {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onForeground');
    }
    onBackground(): void {
        hilog.info(0x0000, TAG, '%{public}s', 'Ability onBackground');
    }
}
