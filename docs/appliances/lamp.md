# 台灯（Lamp）程序化重建记录

## 参考与适用性

- 参考图：`D:/下载文件/ChatGPT Image 2026年8月2日 19_55_15 (1).png`
- 工作流：`img2threejs 1.4.1`
- 探测结果：1672×941 PNG，技术适用性 `pass`。
- 语义适用性：`pass`。单张图同时包含正面、侧面/四分之三和背面视图，主体轮廓清楚，主要材质边界可辨。
- 对象类型：可俯仰台灯；`object / hard-surface / articulated assembly`。
- 复杂度：`moderate`。整体轮廓简单，但灯罩、铰链、灯光 socket 和分层外壳必须形成真实父子层级。

流水线工件位于 `artifacts/img2threejs/lamp/`：

- `probe.json`
- `assessment.json`
- `detail-inventory.json`
- `detail-crops/`
- `object-sculpt-spec.json`

## 比例锁定

程序化模型以 Y=0 为落地面，+Y 向上，+Z 为正面。首轮比例：

| 部位 | 尺寸（模型单位） | 视觉目标 |
|---|---:|---|
| 总高 | 约 4.12 | 保持参考图“高而细”的主体比例 |
| 底座直径 | 1.73 | 宽、浅、稳定；第二轮对照后放宽约 15% |
| 底座总高 | 0.315 | 三层阶梯结构 |
| 灯杆直径 | 0.12 | 明显细于底座脚座和灯罩 |
| 灯罩高度 | 0.94 | 形成完整钟形主体 |
| 灯罩口径 | 1.33 | 下宽上窄，避免变成直筒 |

## Detail inventory

| ID | 类型 | 可见细节 | 代码映射 |
|---|---|---|---|
| base-beveled-rim | bevel | 底座柔和上肩与深色下缘 | `lamp-base-body`、`lamp-base-lower-ring` |
| base-layer-seam | seam | 上板和下环之间的环形接缝 | 三个独立底座网格的交界 |
| stem-foot-collar | ridge | 粉色短圆柱脚座包住细灯杆 | `lamp-stem-foot-collar` |
| stem-satin-highlight | gloss | 灯杆窄高光，表现缎面涂层 | `creamMaterial` 的三阶 toon 响应 |
| hinge-round-cap | fastener | 铰链两侧圆形轴帽 | `lamp-hinge-cap-left/right` |
| hinge-yoke | contour | 灯杆后方粉色竖向支架 | `lamp-hinge-yoke` |
| shade-taper | contour | 灯罩后端窄、开口端宽 | 开口 `CylinderGeometry` 锥台 |
| shade-front-rim | ridge | 灯罩口独立奶油色包边 | `lamp-shade-front-rim` |
| shade-panel-value | gloss | 灯罩宽面积冷紫阴影分阶 | Sakura 三阶 toon 材质 |
| top-button | ridge | 灯罩窄端的小型粉色按钮 | `lamp-shade-top-button` |
| diffuser-emission | emissive | 灯罩内暖色发光扩散片 | `lamp-warm-diffuser` |

## 组件层级与动作准备

```text
appliance-model-lamp
├─ base lower ring / body / top plate
├─ foot pads（推测）
├─ stem foot collar
├─ stem
├─ stem top socket
├─ hinge yoke
└─ lamp-head-hinge-pivot
   ├─ axle + side caps
   ├─ shade shell + top cap
   ├─ front rim
   ├─ warm diffuser
   ├─ top button
   └─ lamp-light-socket
      └─ warm point light
```

- `lamp-head-hinge-pivot` 的局部 X 轴是俯仰轴，建议范围约 `-0.9 ～ 0.16 rad`。
- 灯罩、扩散片、按钮和灯光 socket 全部挂在同一 pivot 下；俯仰时不会发生灯光与灯罩脱离。
- 所有可见零件是具名独立网格，继续复用 `ApplianceModelKit` 的点击、描边、材质释放和 runtime socket 结构。

## 通电动画

- 灯泡呼吸：暖色扩散片的 emissive 强度作缓慢正弦呼吸，同时 PointLight 保持较低强度，避免破坏 Sakura 赛璐璐明暗。
- 灯罩点头：铰链在静止角附近进行约 `±0.042 rad` 的轻微俯仰，只驱动灯头总成。
- 停机：`stop()` 将 emissive、灯光强度和铰链角度精确恢复到待机值。

## 准确还原区域

- 圆盘底座的宽浅比例和上浅下深的分层轮廓。
- 细长奶油色灯杆与粉色脚座的粗细关系。
- 下宽上窄的钟形灯罩、独立口沿和顶部粉色按钮。
- 后方竖向支架、圆形铰链轴帽和真实俯仰层级。
- 奶油白、粉色、暖黄扩散片的材质分区；具体颜色会继承游戏当前线路 accent，保持原有 SAKURA 配色系统。

## 合理推测与仍存在的差异

- 参考图没有展示灯罩内部，因此扩散片深度、灯泡位置和 socket 结构属于功能性推测。
- 参考图没有展示底座底面；两个低矮脚垫依据接触阴影推测，未添加不存在证据的电源接口和装饰。
- 铰链只在外部视图中可见，内部阻尼机构无法确定；当前用穿轴和双侧轴帽表达机械关系。
- 参考图线稿存在二维美术夸张；Three.js 模型使用 24～28 段锥台/圆柱，在实时性能和轮廓圆润度之间取舍，不会逐像素复制线稿。
- 当前模型已完成结构、材质和主图鉴接入校对；严格 sculpt-spec 门禁仍有生成器占位树与参考 PBR 证据缺失，限制已如实记录，未将其误报为通过。

## 浏览器校对结果

- 已在主图鉴中接入并截图验证，最终证据为 `artifacts/img2threejs/lamp/lamp-gallery-powered.png`。
- 三轮几何校正先后解决了俯仰时灯杆穿入扩散片、底座偏窄、铰链轴帽识别不足的问题。
- 最终三视图为 `lamp-render-final.png`，并排对照为 `lamp-comparison-final.png`；详细分层评分和严格门禁限制见同目录 `review-report.md`。
- 动画已用数值断言验证：通电时铰链角、扩散片/口沿 emissive 和局部灯光均变化，`stop()` 后全部恢复待机状态。
