# 电饭煲 / Rice cooker

## 参考判断

- 主体是横向胖圆的台面家电，不是竖直方盒。
- 正面与侧面能锁定下锅体宽深比、粉色穹顶盖与水平接缝。
- 背面能锁定粗大 U 形提扣/铰链、下方电源面板和双孔八字插口。
- 参考文件在子代理运行环境中不可读，本次按任务中可见的正/侧/背三视图人工建立尺寸与细节清单。

## 已还原区域

- 胖圆横向下锅体、下部窄裙边和四只小脚。
- 独立粉色穹顶盖，环形接缝、正面开盖键和顶部排气槽。
- 前方竖向椭圆控制岛，两颗状态灯、大矩形开关与独立 pivot。
- 侧面小控制、背部铰链圆筒、U 形提扣和铰链胶圈。
- 背部粉色电源面板、深色八字入电口与两个孔位。
- Sakura 的米白机身、跟随当前彩线的点缀色、3 阶赛璐璐明暗和冷紫描边。

## 通电动画

- 大开关先下压并有一次小回弹。
- 左右状态灯在保温/煲饭状态间切换，不使用重 Bloom。
- 锅盖绕背部铰链轴微开并轻跳，不会整块平移。
- 蒸汽从顶部排气 socket 少量上升；`stop()` 会将盖子、开关、灯光与蒸汽全部复位。

## 合理推测

- 内锅、加热盘、温控器、密封圈、保温层与内部线路在参考中不可见，本版未虚构。
- 铰链内部连杆与底部固定螺丝分布被视为隐藏结构。
- 蒸汽起点放在图中可见的顶部槽，内部蒸汽通道为功能性推测。

## 结构交付

- 工厂：`createRiceCookerModel(options)`
- 模型：`src/appliances/models/riceCooker.ts`
- 证据：`artifacts/img2threejs/rice-cooker/`
- 可动节点：`rice-cooker-lid-hinge-pivot`、`rice-cooker-rear-latch-pivot`、`rice-cooker-cook-switch-pivot`
- sockets：`rice-cooker-steam-socket`、`rice-cooker-power-socket`、`rice-cooker-lid-hinge-socket`、`rice-cooker-latch-socket`

