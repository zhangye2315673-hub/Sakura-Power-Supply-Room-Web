# 咖啡机程序化重建

## 参考与结论

- 参考图：`D:/下载文件/ChatGPT Image 2026年8月2日 19_55_20 (10).png`。
- 图中提供正面、右侧面、背面三视。当前执行环境中原始文件已不在该路径，因此外轮廓与组件关系来自任务上下文中显示的三视图；没有伪造像素级相似度评分。
- 适合作为浏览器实时程序化模型：主体为可拆分的圆角硬表面结构，身份主要由 L 形轮廓、开放冲泡腔、杯子、滴水盘、大旋钮和侧后水箱决定。

## 已准确重建的可见区域

- 米白上部圆角主机、后部彩色结构柱、开放冲泡腔与独立低底座形成的 L 形主轮廓。
- 前面板大型旋钮、刻度指示和窄状态灯。
- 冲泡头、金属花洒盘、朝下出液头，以及对齐杯心的液体 socket。
- 宽滴水托盘与 7 条排水槽。
- 独立杯体、杯沿、真正有负空间的杯把、杯内液面。
- 侧后半透明水箱、独立水箱盖、背面散热条、电源入口及四只脚垫。
- 奶白塑料、线路色塑料、深色橡胶、低饱和金属与半透明水箱保持不同材质层级，同时沿用 Sakura 三阶 toon、冷紫阴影与描边。

## 通电动作

- 旋钮转到工作角度，冲泡头产生很轻的泵压振动。
- 咖啡从真实 `liquid-outlet-socket` 向下形成连续细流。
- 杯内液面在冲泡期间上升，后半段从 `steam-socket` 冒出少量蒸汽。
- 水箱有克制的通电光泽呼吸，状态条由共享状态材质点亮。
- `stop()` 会清除液流、蒸汽和发光，并复位旋钮、冲泡头、杯子与水箱位置。

## Pivot 与 Socket

- `coffee-maker-control-dial-pivot`
- `coffee-maker-brew-head-pivot`
- `coffee-maker-cup-pivot`
- `coffee-maker-water-tank-pivot`
- `coffee-maker-brew-head-socket`
- `coffee-maker-liquid-outlet-socket`
- `coffee-maker-cup-socket`
- `coffee-maker-steam-socket`
- `coffee-maker-water-tank-service-socket`
- `coffee-maker-power-socket`

这些节点均暴露在 `root.userData.sculptRuntime`，方便图鉴旋转、通电演示和后续互动扩展。

## 合理推测区域

- 内部水泵、加热器、压力管路、阀门和电线被封闭外壳遮挡，未凭空制作。
- 背部服务面板深度、水箱卡轨和电源口内部结构只按三视轮廓推测。
- 底部螺丝和脚垫固定方式不可见，使用稳定的对称四脚方案。

## 校对状态

- TypeScript 与生产构建通过。
- 已建立独立正面、四分之三、侧面、背面与通电预览场景。
- 原图恢复后，应按 `artifacts/img2threejs/coffee-maker/view-crops.json` 重新裁切三视，再制作最终并排像素对照；在此之前只能确认结构和多角度体积，不声称完成像素级一致。
