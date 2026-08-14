# 收音机程序化重建记录

## 参考、用途与适用性

- 参考图：`D:/下载文件/ChatGPT Image 2026年8月2日 19_55_17 (3).png`
- 用途：浏览器实时家电道具，在主游戏外围展示，也可在家电图鉴中使用 OrbitControls 独立查看。
- 图片探测：1672×941 PNG，技术检查通过。
- 原始三视图整张图因为包含三个互相分离的主体，在自动 admission 中被判为 fragmented。没有绕过门禁，而是从原图生成正面、侧面、背面三个独立证据裁切；三张裁切均通过 admission。
- 适用性：`pass`。参考图同时提供正、侧、背三视图，足以判断主轮廓、深度、前后面板和天线收纳结构。
- 复杂度：`complex`。主体轮廓不复杂，但包含横向格栅、刻度阵列、背部风孔、双旋钮和铰接伸缩天线。

工作流工件：

- `artifacts/img2threejs/radio/pre-spec-assessment.json`
- `artifacts/img2threejs/radio/detail-inventory.json`
- `artifacts/img2threejs/radio/object-sculpt-spec.json`
- `artifacts/img2threejs/radio/view-crops/front.png`
- `artifacts/img2threejs/radio/view-crops/side.png`
- `artifacts/img2threejs/radio/view-crops/back.png`

## Pre-spec assessment

| 维度 | 评分（0–3） | 依据 |
|---|---:|---|
| 轮廓复杂度 | 2 | 宽扁圆角箱体，天线明显打断上方轮廓 |
| 组件数量 | 3 | 机壳、前后面板、扬声器、显示窗、控制件、天线和四脚均为独立组件 |
| 层级深度 | 3 | 根节点→模块→旋钮/游标/天线 pivot→可视零件 |
| 重复密度 | 3 | 16条扬声器栅条、9条频率刻度、4×4背部风孔 |
| 材质层数 | 2 | 米白塑料、线路强调色塑料、深色声腔、显示玻璃、金属、橡胶 |
| 局部细节 | 3 | 面板接缝、同心旋钮圈、指示灯、铰链、螺钉、脚垫 |
| 遮挡风险 | 1 | 三视图大幅降低遮挡风险，仅内部与底面不可见 |
| 动作准备 | 3 | 扬声器、频率游标、两个旋钮和天线都需要独立 pivot |

普通 spec 校验已通过，但 blockout 门禁仍要求浏览器截图和视觉复核；没有伪造该证据，也没有用降低复杂度的方式绕过严格门禁。模型已经按完成的 pre-spec 与 detail inventory 手工实现，等待整合后的家电图鉴页面完成统一截图门禁。

## Detail inventory

1. 宽扁圆角机壳和连续大倒角。
2. 粉色内嵌前面板及周圈接缝。
3. 独立扬声器圆角框和深色声腔。
4. 约16条等距横向格栅。
5. 右上厚边框频率窗和深色显示面。
6. 频率窗中的浅灰刻度与粉色十字游标。
7. 一小一大的双旋钮层级，大旋钮带同心护圈。
8. 两颗克制的圆形状态点。
9. 三段逐级收细的伸缩天线和末端帽头。
10. 背面右上天线椭圆支架、圆轴和铰链 pivot。
11. 背部内凹圆角检修盖板。
12. 四列四行的圆端散热槽阵列。
13. 背板两颗圆头固定件。
14. 四个低矮圆角脚垫。

这些细节全部映射到了独立几何组件、重复系统或动画层级，不仅停留在文字清单中。

## 组件层级与动作轴

```text
appliance-model-radio
├─ radio-outer-shell
├─ radio-front-panel-lip
├─ radio-front-panel
├─ radio-speaker-frame
├─ radio-speaker-cavity
├─ radio-speaker-diaphragm-pivot
│  └─ radio-speaker-diaphragm
├─ radio-speaker-slat-1 … 16
├─ radio-frequency-frame
├─ radio-frequency-face
├─ radio-frequency-tick-1 … 9
├─ radio-frequency-pointer-pivot
│  ├─ radio-frequency-pointer-vertical
│  └─ radio-frequency-pointer-horizontal
├─ radio-volume-knob-pivot
├─ radio-tuning-knob-pivot
├─ radio-rear-access-panel
├─ radio-rear-vent-r1-c1 … r4-c4
├─ radio-foot-*（四只）
└─ radio-antenna-hinge-pivot
   ├─ radio-antenna-hinge-axle
   ├─ radio-antenna-segment-1 … 3
   └─ radio-antenna-tip-cap
```

- `radio-speaker-socket` 位于扬声器膜片中心。
- `radio-antenna-root-socket` 位于天线铰轴中心。
- `radio-volume-knob-pivot` 和 `radio-tuning-knob-pivot` 均绕本地 Z 轴旋转。
- `radio-antenna-hinge-pivot` 绕本地 Z 轴折叠，参考姿态为约 `0.86 rad`。
- 所有格栅、刻度、风孔和天线节段都命名，便于图鉴拾取、检查和以后拆解。

## 几何与材质策略

- 主体、面板、显示框、扬声器框和脚垫使用真实圆角盒体，不用普通 BoxGeometry 假装圆角。
- 扬声器格栅和背面风孔使用独立低面数圆角条，保证三分之四视角下仍然读得到厚度。
- 频率窗由边框、显示面、刻度、游标和浅色玻璃分层组成。
- 天线使用三段重叠圆柱，每段逐级收细；天线与机壳之间设真实铰链和轴套。
- 主体材质继续复用项目的三阶 Sakura toon、冷紫阴影和描边；参考图只用于结构与比例，不复制粉色配色，强调色由对应电线传入。
- 金属仍保持低反射、低饱和的赛璐璐表现，不引入写实 PBR 或 Bloom。

## 通电动画

- 扬声器：使用短促波峰驱动膜片向前鼓动，并带约2.5%的面内弹性，停止后回到原位。
- 频率游标：在显示窗中缓慢左右游走；大调谐旋钮与游标同步小角度旋转。
- 小音量旋钮：以更小振幅轻摆，避免两个旋钮完全同相显得机械。
- 天线：以铰链为根部做非常克制的左右轻摆，三段杆始终保持整体装配关系。
- 显示面：通电时增加轻微冷色自发光，断电后归零。
- `stop()` 会明确复位膜片、游标、旋钮、天线和显示材质，不残留永久动作。

## 准确还原区域

- 机身宽高比、圆角箱体与前后壳深度关系。
- 左侧扬声器框、深色声腔和横向栅条的区域比例。
- 右上频率窗、刻度、十字游标，以及右下大小旋钮布局。
- 背部检修板、4×4散热孔、两颗固定件和天线横向收纳关系。
- 三段伸缩天线、末端帽头、铰链轴和四脚结构。

## 合理推测区域

- 扬声器锥盆被格栅遮挡，其深度和鼓动幅度属于动画需要的推测。
- 调谐机构、扬声器内部、电子元件和声腔不可见，未重建。
- 底面电池仓、螺钉和电源线出口没有证据，底部保持封闭简化。
- 背部检修盖板的真实壁厚、卡扣和开合结构不可见，模型仅表达外部接缝。
- 天线完全展开时的精确节段长度无法从插画定量恢复，当前长度按正面和背面轮廓估算。

## 当前限制

这是面向浏览器实时运行和 Sakura 视觉语言的程序化重建，不是制造级 CAD。参考图带有插画化描边、非物理高光和弱透视，模型优先保证轮廓、结构层级、身份零件和动画层级；不会声称从插画反演出真实塑料厚度、内部声学结构或精确金属粗糙度。

