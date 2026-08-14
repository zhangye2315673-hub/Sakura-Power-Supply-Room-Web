# 加湿器程序化重建记录

## 参考与适用性

- 参考：`D:/下载文件/ChatGPT Image 2026年8月2日 19_55_18 (5).png`
- 输入包含正面、侧面、背面三视，1672×941，技术探测通过。
- 主体属于中等复杂度小家电；外轮廓和外壳层级可可靠重建，内部水路、雾化器和背部盖板内侧不可见，只能标记为推测。
- 目标是实时 Three.js 道具，继续使用项目现有 Sakura 赛璐璐材质和线路 accent 色，不照抄参考图粉色。

## Quality contract

1. 不依靠贴图时，剪影必须读成“上部大水箱、下部稳定控制区”的桌面加湿器。
2. 上部水箱、内部水体、下壳、底部强调环必须是四个独立结构层。
3. 顶部喷口必须有独立座、旋转盖、开口和真实 `humidifier-mist-outlet-socket`。
4. 正面必须保持圆形旋钮、旋钮刻线、水滴图标、状态灯的视觉顺序。
5. 背面必须支持自由查看，至少包含服务盖、散热槽和低位盖板，不用空白背壳糊弄。
6. 动画必须从真实喷口发出，持续形成高而宽的体积雾柱，随后汇聚成约本体视觉面积 1.5 倍的立体乌云并下雨。
7. 所有可动结构采用独立 pivot；隐藏结构不伪装为准确重建。

## Detail inventory

| 区域 | 观察到的关键细节 | Three.js 映射 |
|---|---|---|
| 整体 | 宽而圆的锥台，顶部略收、底部稳定 | `humidifier-lower-body-shell`、`humidifier-transparent-water-reservoir` 的 LatheGeometry 轮廓 |
| 上壳 | 大面积半透明/水色储水仓 | 独立透明水箱材质与 `humidifier-inner-water-volume` |
| 接缝 | 水箱与控制区有清晰水平分界 | `humidifier-tank-body-seam` |
| 顶部 | 圆形凹座 | `humidifier-outlet-recess-seat` |
| 顶部 | 矮圆形喷口盖 | `humidifier-outlet-rotary-cap` 与独立 pivot |
| 顶部 | 喷口中央开孔 | `humidifier-outlet-opening` 与 mist socket |
| 正面 | 奶白控制区 | `humidifier-lower-body-shell` |
| 正面 | 圆形旋钮与外环 | `humidifier-control-dial`、outer ring、pivot |
| 正面 | 旋钮短刻线 | `humidifier-control-dial-index` |
| 正面 | 水滴图标 | 独立曲线挤出 `humidifier-water-drop-badge` |
| 正面 | 小状态灯 | `status-indicator` |
| 底部 | 一圈低饱和强调色 | `humidifier-bottom-accent-rail` |
| 底部 | 四个低脚 | `humidifier-foot-1..4` |
| 背部 | 一组竖向散热槽 | `humidifier-rear-vent-1..8` |
| 背部 | 小型服务面板/低盖 | `humidifier-rear-service-panel` 与 `humidifier-rear-drain-cover` |
| 动效 | 雾气必须从顶端出口出现 | 18组四瓣不规则体积雾，父级为 mist socket |
| 动效 | 乌云必须形成且侧视不坍缩 | 9瓣不规则 IcosahedronGeometry，目标尺寸约 4.1×2.5×2.05 |
| 动效 | 云内必须有短促闪电 | 3个内部亮体 + 1根 TubeGeometry 立体闪电 |
| 动效 | 最后明显下雨 | 36个 LatheGeometry 尖顶圆腹水滴，分别落向机顶和附近地面 |
| 动效 | 水箱不应像空塑料罩 | 内部水体与三层水光环轻微波动 |

## 比例和层级

- 总高约 2.93，本体最大直径约 2.34。
- 下部控制壳占总高约 40%，透明水箱占约 54%，顶部出雾组件占约 6%。
- `root`
  - lower body / bottom accent rail / feet
  - transparent reservoir / inner water / water glints
  - outlet cap pivot / mist outlet socket / volumetric mist rig
  - storm cloud rig / internal flash bodies / volumetric lightning
  - volumetric rain rig / 36 water drops
  - control dial pivot / front panel / indicator
  - rear service panel / vents / cover

## 动画设计

- 通电时旋钮转到工作档并有极小机械反馈，喷口盖轻摆。
- 18组四瓣体积雾循环上升约 2.45 模型单位，随高度扩散；不使用 Plane、Sprite 或 Bloom 掩盖轮廓。
- 1.28–2.34秒由雾汇聚出大型立体乌云，2.42–3.75秒三次内部闪光，2.68–4.68秒持续降下36个体积水滴。
- 水体只做 0.8% 的纵向呼吸和 1.2cm 的水面位移，水光环分别上下漂移，避免像固体。
- `resetHumidifierPerformance()` 隐藏整套天气 rig 并复位旋钮/喷口/水体；外层继续统一控制 5.2 秒运行时间。

## 准确与推测区域

准确还原的可见区域：整体比例语言、上下两段结构、透明水箱、水平接缝、顶部圆形喷口组件、正面圆旋钮/水滴/状态灯、底部色环、后部槽阵列。

合理推测：透明壳厚度、内部水位体积、背部低盖用途、四脚在不可见角度的精确固定点、雾化器/风道/排水结构。模型明确没有声称内部机电结构准确。

## 校对记录

- Blockout：先用上下两个 LatheGeometry 锁定圆角锥台剪影，避免用普通圆柱做成直桶。
- Structure：拆出水箱、内水体、接缝、底环、喷口 pivot、控制 pivot、背板和脚。
- Form/detail：补水滴挤出形、旋钮层级、散热槽、喷口孔和服务盖。
- Material/interaction：透明水箱保留低透明度；内部水体单独发光；雾从真实 socket 发出；云、闪电和雨全部为闭合立体几何。
- 浏览器正面、三分之四和背面截图与对照图由汇总代理在统一图鉴场景接入后生成。当前独立模块已经避免对共享注册表产生并发编辑。
