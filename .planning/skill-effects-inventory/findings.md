# 技能模式效果矩阵

## 统一表现管线

一次技能连接的实际顺序是：

`玩家点击可抽线 -> manual-exit -> connecting -> skill-cue -> 逻辑 commit -> 3D/全屏/线缆表现 -> settle -> idle`

- `cue`：`#skill-cue` 显示家电名、技能名和说明，标签为“技能发动”。
- `commit`：约 220ms 后标签切换为“效果生效”，此时命令已经修改逻辑状态。
- `settle`：普通效果约 650ms、拓扑变化约 900ms 后标签切换为“结算完成”，清除瞬时高亮/全屏效果并解锁输入。
- 所有技能都会调用 `SkillEffectModelKit.play()`，但只有 20 个家电有 `ASSET_BY_APPLIANCE` 映射；其余技能依靠家电通电动画、线缆状态变化或 HUD 提示。
- `SkillResolution.presentation.assetIds` 当前始终为空，实际资产选择由 `Game.ts` 按家电名硬编码；这是后续统一表现配置时的明显改造点。

## 29 个技能逐项清单

字段说明：`3D` 为 `SkillEffectModelKit` 资产；`全屏` 为 `SakuraPipeline` 后处理；`HUD` 为状态槽/临时图标；`提醒` 为玩家在屏幕上能看到或操作到的反馈。

| # | 家电 / 技能 | 技能逻辑 | 3D / 前端动画 | 图标 | 玩家提醒 | 修改关注点 |
|---|---|---|---|---|---|---|
| 1 | 台灯 / `lamp-hint` 照明提示 | 从当前真实可抽线中随机选 1 根，持续写入 `lampHintCableId`，抽走后清除。 | `lamp-spotlight-crown` 瞬时冠环；目标线缆黄 tint。无全屏。 | 无持久槽图标。 | cue 显示“照明提示”；目标线持续高亮。 | 高亮是否足够醒目；是否需要箭头/脉冲或“可抽”文案。 |
| 2 | 加湿器 / `bathroom-steam` 浴室蒸汽 | 无 DEBUFF 时生成 3 回合 DEBUFF；每次正确抽线递减，3 次后消失。 | `humidifier-glass-wiper` 瞬时擦拭；全屏 `bathroom-steam` 蒸汽/模糊；持续蒸汽来自后处理。 | DEBUFF `bathroom-steam`，3 回合倒计数。 | cue + 状态 tooltip；抽线后回合数变化。 | 全屏遮挡强度、移动端可读性、消退节奏。 |
| 3 | 风扇 / `clear-steam` 吹散蒸汽 | 仅在浴室蒸汽存在时触发，清除 DEBUFF。 | `fan-airflow-ribbon` 瞬时气流；清除全屏蒸汽。 | 无持久图标；原 DEBUFF 消失。 | cue 说明“提前清除浴室蒸汽”，状态槽消失。 | 清除反馈缺少专门“被解除”标记，可增加消散动画。 |
| 4 | 除湿机 / `dehumidify` 净化与干燥护罩 | 有 DEBUFF 时清除；无 DEBUFF 时生成 3 回合 `dry-shield` BUFF。 | `dehumidifier-shield-droplets` 持久护罩；无全屏。 | BUFF `dry-shield`，3 回合。 | cue；状态槽 tooltip 说明抵挡下一次负面状态。 | 当前 `setStatus(debuff)` 与干燥护罩互斥逻辑要保持；需要明确“净化/生成护罩”分支文案。 |
| 5 | 冰箱 / `freeze-plugs` 急冻封头 | 无 DEBUFF 且可用出口超过 1 时，随机冻结约一半出口，至少留 1 个；持续 3 回合。 | `refrigerator-ice-shell` 持久附着每根目标线；目标线冻结 tint。无全屏。 | DEBUFF `frozen-plug`，3 回合，tooltip 显示目标数。 | cue；目标线冰壳和不可抽状态；可用出口变化。 | 冰壳与“至少保留一个出口”关系需更清晰；冻结目标的可见性。 |
| 6 | 吹风机 / `hair-dryer-branch` 解冻或热风改色 | 有冰冻时优先清除；否则随机将一根非当前路由色线改成有效橙红路由。 | 无独立 3D 技能模型、无全屏；解冻约 `2.4s` 渐退冰壳，改色约 `1.82s` 从线体中心向两端扩散并在约 `2.04s` 提交，不发光。 | 无持久图标。 | cue 文案根据分支相同；结果直接在线体冰冻或颜色变化上显示。 | 仍可把两个分支改成不同标题，进一步明确本次实际结果。 |
| 7 | 洗衣机 / `spin-remove` 脱水甩线 | 从全部剩余线随机永久移除最多 2 根；改变拓扑。 | 当前无洗衣机专属 `ASSET_BY_APPLIANCE` 技能资产；线缆以 burst/petal + 隐藏移除表现。 | 无持久图标。 | cue；目标线高亮后自动消失；拓扑结算延迟 900ms。 | 缺少“脱水甩线”专属旋转/离心 3D 表现，是高优先级缺口。 |
| 8 | 泡泡机 / `bubble-shield` 虹膜泡泡 | 生成 5 回合 BUFF；抵挡一次受阻点击后立即消耗。 | `bubble-shell-wave-membrane` 持久护罩；全屏 `iridescent-bubble` 折射。 | BUFF `iridescent-bubble`，5 回合。 | cue；状态槽计数；受阻时 HUD toast“防护状态抵挡了这次错误”。 | 受阻瞬间缺少泡泡破裂专属动画/音效。 |
| 9 | 电视机 / `glitch-reconstruct` 故障重构 | 随机重构最多 3 根剩余线的路径/出口方向；必须通过可解拓扑校验。 | 无电视机专属 3D 资产；瞬时全屏 `television-glitch`；目标线重建。 | 无持久图标。 | cue；目标线高亮；结算延迟 900ms。 | 全屏故障是主要表现，缺少“哪几根被重构”的局部 3D 语义。 |
| 10 | 收音机 / `route-broadcast` 三步路线广播 | 取当前 `removalSequence` 前 3 根，不改逻辑，只提示顺序。 | `radio-sequence-markers` 瞬时 1/2/3 标记。无全屏。 | 无持久图标。 | cue；三根目标高亮；需靠记忆按顺序抽取。 | 目前目标高亮同时出现，需确认是否改为 1 -> 2 -> 3 分段播放。 |
| 11 | 烤面包机 / `swap-ends` 双面翻烤 | 随机最多 2 根非假插头线交换头尾；重算阻挡并校验可解。 | 无烤面包机专属技能资产；线缆路径反转。 | 无持久图标。 | cue；目标线高亮；拓扑结算延迟 900ms。 | 缺少“翻面/加热/两端交换”可视化，玩家可能只看到线突然变化。 |
| 12 | 电热水壶 / `steam-thaw` 高温蒸汽解冻 | 仅冰冻 DEBUFF 存在时触发，清除全部冰冻。 | `kettle-steam-ribbon` 瞬时蒸汽；冰壳持久特效移除。 | 原 `frozen-plug` DEBUFF 消失。 | cue；状态槽消失；解冻后的线恢复可抽。 | 需要区分“热水壶自身通电动画”和“解除冰冻结果”。 |
| 13 | 咖啡机 / `coffee-lock` 咖啡封技 | 无 DEBUFF 时生成 4 回合 DEBUFF；遮蔽线色并阻止后续 4 次家电技能。 | 无咖啡机专属 3D 技能资产；全屏 `coffee-lock` 棕色液体覆盖；全线咖啡色 tint。 | DEBUFF `coffee-lock`，4 回合。 | cue；每次被封锁仍提示“技能被封锁”；状态 tooltip。 | “封技”反馈应和普通无效果区分；全线 tint 不能降低可抽性判断。 |
| 14 | 扫地机器人 / `snapshot-sweep` 快照清线 | 快照读取触发瞬间全部真实可抽线并自动永久移除；不连家电、不推进普通回合。 | 无技能专属 3D 资产；目标线按约 0.1 秒间隔沿真实出口自动消失，petal burst。 | 无持久图标。 | cue；所有目标线高亮后逐根清除；拓扑结算延迟 900ms。 | 缺少扫地机器人扫描/LiDAR/吸入路径的专属表现；应避免一帧全消失。 |
| 15 | 电饭煲 / `rice-thick-cable` 米饭膨胀粗线 | 无 DEBUFF 时生成 3 回合视觉 DEBUFF；只改变线体视觉粗度，不改碰撞/出口。 | 无专属 3D 技能资产；全线 `setSkillTint(米饭色, 0.28)`，粗线由线缆渲染表现。 | DEBUFF `rice-thick-cable`，3 回合。 | cue；全线视觉变粗；tooltip 明确“不改变真实碰撞”。 | 需要让“视觉粗线”和真实碰撞差异更易理解，避免误判。 |
| 16 | 搅拌机 / `color-shuffle` 全线色彩搅拌 | 保持颜色总量不变，重新随机分配所有剩余线颜色；重建家电路由但不改路径。 | `blender-energy-shards` 瞬时碎片；线缆颜色整体切换。无全屏。 | 无持久图标。 | cue；受影响线高亮；结算后新颜色立即生效。 | 缺少“全线搅拌过程”动画；颜色变化期间输入已锁定，需保持因果清楚。 |
| 17 | 打印机 / `printer-copy` 抽线动作复印 | 设置一次性 pending；下一次正确抽线事务消耗旧 pending，并按新局面自动抽出一根，不消费本次新获得机会。 | 无专属 3D 技能资产；打印机通电动画独立；pending 图标出现在 HUD 右侧。 | 非状态槽 pending 打印机图标，带数量标记。 | cue；HUD 图标 tooltip；下一次自动抽线后目标高亮/消失。 | 自动抽线需要更明显的“复制对象”和时序提示，避免玩家以为误操作。 |
| 18 | 扭蛋机 / `sakura-gacha` 樱花三选一 | 生成 2 张收益卡 + 1 张风险卡；玩家仅一次翻牌选择，选后立即结算。 | `gacha-card-frame` 瞬时卡框；CSS 三卡翻转、未选卡淡出。 | 不占 BUFF/DEBUFF 槽；选中卡内容临时展示。 | cue“扭蛋技能选定”；全屏卡牌面板；卡牌正面显示家电/技能/说明。 | 卡牌信息层级和风险识别可增强；当前 `presentation.assetIds` 未使用。 |
| 19 | 唱片机 / `soothing-record` 安心旋律 | 立即恢复 1 格生命并生成无回合期限 BUFF；抵挡一次受阻点击后消耗。 | 旧 `record-note-orb-ring` 已废弃；首次音波盾与唱片机动画同步约 `5.2s` 并播放约 4 轮球面扩散环，等待期间约每 `8.5s` 播放一次约 `3.45s`、完整包含 3 轮扩散环的更淡提醒，其余时间隐藏。 | BUFF `soothing-record`，计数 1。 | cue；生命 HUD 变化；常驻 BUFF 图标；低频球面环提醒；受阻时定向音波冲击与保护 toast。 | “恢复生命”和“抵挡一次”分段反馈，但无期限保护不得常驻遮挡线组。 |
| 20 | 闹钟 / `time-fast-forward` 时间快进 | 将所有仍存在的限回合 BUFF/DEBUFF 额外推进 1 回合。 | 只播放闹钟本体的铃铛、锤击和指针快转；不再生成蓝色 `alarm-time-ring` 模型。无全屏。 | 不占槽；现有状态图标保持可见，数字立即减少。 | cue；状态计数同时变化。 | 可能导致多个状态同时过期，需增加到期顺序/结果提示。 |
| 21 | 爆米花机 / `popcorn-meal` 爆米花加餐与出口提示 | 最大生命 +1（上限 6），并从当前可用出口随机标记 1 根。 | `popcorn-target-marker` 在可抽插头附近显示三颗爆米花、断续目标环和短射线；触发时局部爆裂，不再高亮整根线。 | 不占槽；生命 HUD 上限变化并播放爆米花颗粒与新增生命格弹入。 | cue；生命上限变化；目标插头局部标记。 | 已拆成“爆裂加餐”与“局部出口提示”两个连续视觉节拍，旧桃心王冠方案废弃。 |
| 22 | 厨师机 / `normalize-statuses` 搅拌均匀 | 将仍存在的限回合状态统一设为 2 回合；可能缩短 BUFF 或延长 DEBUFF。 | `stand-mixer-status-token` 瞬时状态 token。无全屏。 | 不占槽；现有状态数字统一为 2。 | cue；状态数字统一变化。 | 风险/收益取决于当前状态，需要在 cue 中显示“延长/缩短”结果。 |
| 23 | 游戏机 / `continue-game` 继续游戏 | 获取一次复活 BUFF；重复触发提升恢复量，复活后 BUFF 消耗。 | 不生成独立三维 token；生命栏使用逐格扫亮、短时能量扫过和低强度复活待命回路。 | BUFF `continue`，显示 `1/恢复量`；生命栏显示“复活待命／归零恢复 N 格”。 | cue；状态 tooltip；失败时 HUD toast“CONTINUE 已复活”。 | 已区分“获得复活”的生命栏待命反馈；实际复活仍沿用生命恢复结算反馈。 |
| 24 | 微波炉 / `timed-meal` 限时取餐 | 无 DEBUFF 时随机标记 1 根真实出口，生成 2 回合 DEBUFF；抽错/非目标会推进倒计时，过期扣 1 生命。 | `microwave-double-heat-ring` 持久附着目标线；瞬时环；无全屏常驻。 | DEBUFF `overheated-plug`，2 回合。 | cue；目标线高亮；状态倒计时；过期/扣血 toast。 | 目标线、剩余次数和“抽错会扣血”必须同时可读。 |
| 25 | 台式电脑 / `blue-screen` 蓝屏崩溃 | 有 BUFF 时移除 BUFF；无 BUFF 时扣 1 格生命。 | 无 `ASSET_BY_APPLIANCE` 技能资产；瞬时全屏 `television-glitch` 目前只对电视设置，电脑技能没有专属蓝屏后处理。 | 不占槽；被移除 BUFF 消失或生命减少。 | cue；生命/状态变化由 HUD 和 toast 表示。 | 这是明显表现缺口：技能名是蓝屏，但当前没有电脑专属屏幕故障效果。 |
| 26 | 电磁炉 / `induction-reveal` 感应显线 | 生成 3 回合 BUFF，持续标记全部真实可抽出口。 | `induction-heat-ring` 持久附着每个可抽出口；目标线高亮。无全屏。 | BUFF `induction-reveal`，3 回合。 | cue；所有真实出口同时高亮；tooltip。 | 全部出口高亮可能压过普通 hover，需要区分“技能显线”和“鼠标选中”。 |
| 27 | 便携音箱 / `bass-spacing` 节拍扩距 | 全部剩余线逐拍拉开，最终只把线材外轮廓之间的原始净空增加一份并保持 3 回合；真实拓扑和可抽规则不变。 | 线组整体位置偏移跟随音箱低音节拍，不生成额外技能模型或全屏效果。 | `buff-bass-spacing`，显示剩余 3～1 回合。 | cue；逐拍压缩／膨胀；净空约 `2×`；状态结束平滑回落。 | 不得把线组中心距离、线长度或每根线相对中心的位置乘以 `2`。 |
| 28 | 智能垃圾桶 / `recycle-cable` 指定回收 | 触发后进入一次 `select-recycle-target`；玩家点任意剩余线，立即永久回收。 | 无专属 3D 技能资产；选中线 burst/petal 后隐藏。 | 不占槽；无状态图标。 | cue；底部 `#skill-recycle-prompt` 提示“选择一根线回收”；输入锁定但允许旋转/点击。 | 这是第二个明确选取例外，需保持目标可选范围、确认文案和回收动画清楚。 |
| 29 | 智能手机 / `fake-double-plug` 双头伪装 | 无 DEBUFF 时随机最多 3 根普通尾端生成永久假插头；真实假插头可导致错误点击扣血；目标线全部移除后 DEBUFF 清除。 | 无专属 3D 技能资产；`setFakeTailPlug(true)` 显示尾端假插头；目标线高亮。无全屏。 | DEBUFF `fake-double-plug`，计数为受影响线数，永久到目标耗尽。 | cue；假尾插头直接可见；错误点击走生命损失/保护反馈。 | 假插头与真实插头的视觉差异、错误点击原因和永久状态说明必须加强。 |

## 图标与提醒总表

### HUD 图标

- 11 个状态图标已改为纯 DOM/CSS Low Poly 图标：5 个 BUFF、6 个 DEBUFF；不再加载图片 atlas。
- BUFF 槽顺序：`dry-shield`、`iridescent-bubble`、`soothing-record`、`continue`、`induction-reveal`。
- DEBUFF 槽顺序：`bathroom-steam`、`frozen-plug`、`coffee-lock`、`rice-thick-cable`、`overheated-plug`、`fake-double-plug`。
- 每个图标只使用一个主题符号、CSS 多边形外轮廓、两块纯色面和深色投影；做法与生命心形、提示感叹号一致，不使用 img2threejs。
- 图标右下角显示回合/目标数量；悬停、聚焦显示名称、效果说明和剩余时间。
- 打印机 pending 是独立 HUD 图标，不占 BUFF/DEBUFF 槽，也使用同一套 CSS Low Poly 方式。

### 屏幕提醒

- 技能触发：顶部居中 `#skill-cue`，显示来源家电、技能标题、描述和阶段。
- 技能生效：220ms 后阶段标签变为“效果生效”。
- 结算完成：普通效果 650ms、拓扑变化 900ms 后变为“结算完成”，随后隐藏。
- 目标提醒：目标线使用黄色 `setSkillTint`；台灯、爆米花、冰箱、微波炉、电磁炉还会使用目标位置的 3D 特效/高亮。
- 状态提醒：状态槽出现动画；回合数字随每次正确抽线同步更新。
- 错误提醒：泡泡/唱片机保护时 toast；否则扣生命、失败面板或 CONTINUE toast。
- 特殊输入提醒：扭蛋机使用全屏三卡面板；智能垃圾桶使用底部回收提示并锁定普通输入。

## 已发现的结构性缺口

1. `SkillResolution.presentation.assetIds` 虽然定义了表现契约，但每个技能都填空数组；真实资产绑定分散在 `Game.ts` 和 `SkillEffectModelKit.ts`。
2. 20 个 3D 资产只映射了部分 29 技能；洗衣机、电视、收音机以外的若干拓扑/自动效果没有专属模型表现。现有 `controller-impact-star` 也未在家电映射表中使用。
3. 全屏后处理只有 5 个常驻/瞬时模式：浴室蒸汽、咖啡封技、电视故障、打印扫描、虹膜泡泡；蓝屏崩溃没有独立模式。
4. 许多技能共用同一套 cue 文案结构，分支技能（吹风机、除湿机、厨师机、电脑、微波炉）没有把实际结果差异完全说出来。
5. 目标线高亮是统一黄色 tint，多个技能的“目标”“可用出口”“冻结出口”“假插头”视觉语义还没有完全分层。
6. 技能状态图标的唯一权威来源现为 `SkillChallengeUi.ts` 的语义符号和 `styles.css` 的主题色；GPT atlas、坐标表和运行时图片引用已删除。

## 建议逐一修改顺序

1. 先改表现缺口最大、会改变玩家判断的技能：`blue-screen`、`spin-remove`、`snapshot-sweep`、`swap-ends`、`fake-double-plug`。
2. 再改分支和倒计时的提醒：`hair-dryer-branch`、`dehumidify`、`normalize-statuses`、`timed-meal`、`continue-game`。
3. 再改纯提示/拓扑可读性：`lamp-hint`、`route-broadcast`、`induction-reveal`、`bass-spacing`、`printer-copy`。
4. 最后统一资产契约、atlas 图标来源、cue 文案和测试覆盖。
