# 电热水壶 v2 图像分析

输入视图为当前运行时四视图截图，已通过 reference-admission。目标是保持电热水壶身份、动画接触点和 v1 包围盒，同时强化 Sakura Crossing 的低多边形切面语言。

- 宏观：主体是 12 边径向切面的下宽上窄壳体，底部有双层圆形电源底座；右侧 D 形把手和左侧短上扬壶嘴形成不对称剪影。
- 中观：奶油色肩带与底座、樱粉壳体/把手、冷紫暗缝、前置透明水位窗和七条刻度线构成功能识别层级；盖体与按钮独立于壳体并绑定后侧铰链。
- 微观：壶嘴出口圈、开关索引线、状态灯、四个橡胶脚、壳体底缘接缝及蒸汽低多边形体块。
- 材质：2-3 段 Toon 明暗，奶油白/樱粉/薄荷色点缀，冷紫阴影；主体使用稳定三档墨线，主轮廓 0.0048、结构 0.0041、细节 0.0033，物体空间相位固定且约 ±18% 变化。
- 动画约束：`kettle-lid-hinge-pivot`、`kettle-power-switch-pivot`、`kettle-spout-steam-socket`、`kettle-rear-power-socket` 和把手上下 socket 冻结；蒸汽体块仅作为 socket 子节点，不使用 Sprite/PlaneGeometry。

GPT Image 2 外部生成尝试记录在 `references/intake-v2/kettle/generation-status.json`。由于 `ai.comfly.org` 在连接阶段超时，未伪造生成结果；本次规格和建模证据使用已准入的程序化四视图与 v1 档案截图。
