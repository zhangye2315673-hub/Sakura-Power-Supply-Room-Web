# 手机 / Sakura incoming-call phone

## v2 视觉升级（2026-08-13）

- 在 v1 完整包围盒内把软圆角直板重塑为八角切面机身，增加四角护块、侧面握持层级、屏幕冠部与下巴饰条。
- 后置相机岛改为更夸张的切角体块，双镜头使用 12 边低多边形轮廓；背部加入无品牌五瓣 Sakura 花章。
- 实体机身采用 `0.0048 / 0.0041 / 0.0033` 三级稳定描边和 `0.18` 物体空间粗细变化；来电环、提示光点和信息粒子不生成描边，避免动画高潮结块。
- 所有既有 pivot、socket、父路径和静止变换保持不变；包围盒与 ground 相对 v1 的自动对比误差均为 `0`。
- 本款没有独立原始参考图，也没有可用的 Comfly/OpenAI 环境凭据。`references/intake-v2/phone` 明确记录为 `conditional-fallback`，不得声称 GPT Image 2 来源或图像精确重建。

## 定位与证据边界

- 工厂函数：`createPhoneModel(options)`
- 模型文件：`src/appliances/models/phone.ts`
- 前置工件：`artifacts/img2threejs/phone/pre-spec.json`
- 细节清单：`artifacts/img2threejs/phone/detail-inventory.json`
- 用途：替换旧吸尘器，作为家电库中的 `S` 级 Type-C 设备，并在游戏和家电图鉴中共用同一模型与动画。

本项没有独立的手机参考图。它不是对某张图片的精确重建，而是依据用户提出的 Sakura 风格、家电身份识别和通电反馈要求完成的原创程序化模型。因此本文不会使用“已还原参考图”之类的表述；前后壳比例、摄像头数量、接口和按钮布局均属于合理设计推测。

## 轮廓与比例锁定

模型局部坐标为 `+Y` 向上、`+Z` 朝正面：

- 外围彩色软胶框尺寸约为 `1.02 × 1.92 × 0.17`，保持接近现代手机的纵向薄板比例。
- 米白后壳嵌在彩色边框内，正面由独立米白窄边框和深色圆角屏幕组成。
- 机身拥有真实侧面厚度，侧键、底部 Type-C 和背面摄像头岛都会打破侧面轮廓，避免远看像一张平面卡片。
- 屏幕占据正面绝大部分面积，听筒与前摄位于屏幕上沿；亮屏后由立体头像、联系人名、来电提示和接挂按钮建立明确的“有人来电”身份。
- 背面使用独立双镜头岛、闪光灯和无品牌 Sakura 圆环标记；没有使用现实品牌 Logo。

## Detail inventory 落地

1. 彩色圆角外围框。
2. 内嵌米白后壳。
3. 独立米白前边框。
4. 深色圆角显示玻璃。
5. 上沿听筒开槽。
6. 独立前置摄像头圆点。
7. 立体头像、发光头像环与人物胸像。
8. 由圆柱笔画组成的 `MOMO` 联系人名。
9. 由圆柱笔画组成的 `CALLING` 来电提示。
10. 具有实体深度的绿色接听按钮、红色挂断按钮和 Tube 电话听筒图标。
11. 右侧独立电源键与 pivot/socket。
12. 左侧双音量键与 pivot/socket。
13. 底部 Type-C 凹口、内舌和连接 socket。
14. 五个扬声器孔与独立麦克风孔。
15. 背面圆角摄像头岛。
16. 两组独立镜头环、镜片和镜头 pivot/socket。
17. 背面闪光灯。
18. 无品牌 Sakura 圆环标记。
19. Torus 立体声波环与 Tube 震动/呼叫弧线。
20. Icosahedron 柔和提示光点与 RoundedBox 信息粒子。
21. 米白聚合物、线路强调色软胶、深色玻璃和低饱和金属四类 toon 材质分区。

上述内容均落实为独立命名网格、重复系统、pivot、socket 或材质状态，不是只写在说明中的装饰清单。

## 组件层级与动作接口

```text
appliance-model-phone
└─ phone-handset-pivot
   ├─ perimeter rail / rear shell
   ├─ phone-screen-assembly-pivot
   │  ├─ front bezel / display glass / earpiece / front camera
   │  └─ phone-incoming-call-ui-pivot
   │     ├─ avatar / MOMO / CALLING
   │     ├─ phone-call-answer-button-pivot
   │     └─ phone-call-hangup-button-pivot
   ├─ phone-call-feedback-rig
   │  ├─ stereo wave rings / vibration pulses / call-signal arcs
   │  └─ soft notification lights / information particles
   ├─ phone-power-button-pivot
   ├─ phone-volume-button-pivot
   ├─ phone-bottom-io-pivot
   └─ phone-rear-camera-island-pivot
      ├─ phone-rear-camera-lens-1-pivot
      └─ phone-rear-camera-lens-2-pivot
```

主要 socket 包括机身、屏幕、来电 UI、接听键、挂断键、电源键、音量键、底部 I/O、USB-C 连接点、摄像头岛和两枚镜头。`root.userData.sculptRuntime` 可供图鉴 Orbit 检查和后续交互扩展使用。

## 通电动画

- `0.035–0.15s` 内屏幕突然亮起并显示完整来电界面，而不是只做整体亮灭。
- 中段 `CALLING` 提示持续闪烁，头像与绿色接听区域以不同频率轻微脉冲。
- 手机本体保留原有升起、高频左右震动与轻微侧滚节奏，没有套用新的通用压缩模板。
- 外围依次出现立体声波环、左右震动脉冲、顶部呼叫弧线、柔和光点和上升的信息粒子。
- 全部外围效果由 `PhonePerformance.ts` 在同一条 5.2 秒共享时间线驱动；游戏和图鉴不复制另一套动画。
- `resetPhonePerformance()` 会关闭来电 UI 与全部模型自有反馈，恢复待机状态。

## Sakura 风格处理

- 使用项目统一的 3 阶 toon 明暗、冷紫色阴影与稳定描边。
- 机身主色为低饱和米白，外围框与来电 UI 继承目标线路的强调色。
- 屏幕和镜片使用深灰紫 toon 材质，不使用写实玻璃反射、强金属 PBR 或 Bloom。
- 前后细节保持几何概括，确保在游戏小比例和图鉴近景中都能识别，同时不变成写实手机广告模型。

## 已确认的可见结果

- 正面、三分之四和背面都能立即读成纵向智能手机，而不是遥控器。
- 正面具有完整屏幕层级、听筒、前摄和一眼可读的来电界面。
- 三分之四视角可见真实厚度、彩色外围框和独立侧键。
- 背面可见独立双镜头岛、闪光灯和米白后壳。
- 通电时联系人、来电提示和接挂按钮清楚，屏幕仍保留深色玻璃的视觉底色。
- 手机周围不再生成普通 `ribbon` 面片；所有来电反馈均有立体厚度，且不使用战斗星、电流或必杀技语义。

校对图：

- `artifacts/img2threejs/phone/render-front.png`
- `artifacts/img2threejs/phone/render-three-quarter.png`
- `artifacts/img2threejs/phone/render-back.png`
- `artifacts/img2threejs/phone/render-powered.png`

## 合理推测与未建模区域

- 整个外观没有独立参考图，属于基于需求的原创设计推测。
- 后摄岛位置、双镜头数量、闪光灯布局和背面圆环均非图像证据。
- Type-C 凹口深度、扬声器孔数量、麦克风位置和侧键行程属于功能性推测。
- 内部电池、主板、天线断带、振动马达、镜头光学、屏幕堆栈、胶层和隐藏紧固件均未建模。
- 当前验收只能证明它符合项目风格、结构清单和手机身份识别要求，不能给出基于参考像素的 IoU、SSIM 或“精确还原”结论。
