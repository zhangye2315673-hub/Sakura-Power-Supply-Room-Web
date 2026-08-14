# 29 台家电动画所有权与迁移清单（v2）

更新时间：2026-08-06

## 所有权判定

- 旧模型动作：当前 `src/appliances/models/*.ts` 传给 `kit.finish(..., animation)` 的机械动作闭包。
- 旧模型特效：模型工厂内创建并由该闭包更新的蒸汽、气泡、纸张、音符、光束、雾、雨、食材等节点。
- 新版特效：当前 `ApplianceSpectacleSystem` 的池化/跨屏实现；迁移后只允许由 `AppliancePerformanceSystem` 内部调用。
- 迁移完成条件：模型工厂只建本体、命名部件和 socket；游戏与图鉴均不再直接调用模型动画或 spectacle；同一时刻只有一个 performance session。

## 逐台清单

| # | 家电 | 旧模型动作 | 旧模型特效 | 当前新版特效 | 重复/冲突 | 保留 pivot / socket | 删除或迁出模型的内容 |
|---:|---|---|---|---|---|---|---|
| 1 | 台灯 | 灯头四向注视、顶钮、灯体弹性 | `lamp-flashlight-beam-cone`、地面光池、模型 PointLight/SpotLight | 池化立体锥形光束与真实 SpotLight | 两套光束/光源形态 | `lamp-head-hinge-pivot`、`lamp-shade-top-button-pivot`、`lamp-light-socket` | 模型 update/stop/signal；本地 beam/light-pool 更新，光源统一交给 performance slot |
| 2 | 风扇 | 转子加速、摆头、俯仰、调速旋钮 | `fan-cherry-petal-*`、`fan-rotor-afterimage-*` | 池化立体樱花 + PetalField 定向风场 | 两批花瓣且方向/生命周期分离 | `fan-oscillation-pivot`、`fan-head-hinge`、`fan-rotor-pivot`、`fan-front-air-socket` | 本地花瓣和 afterimage 节点；机械公式迁入统一定义 |
| 3 | 收音机 | 天线立起、指针扫描锁定、振膜/机身压缩 | `radio-spatial-sound-wave-*` | 三圈池化立体空间声波 | 两套声波 | `radio-antenna-hinge-pivot`、`radio-frequency-pointer-pivot`、`radio-speaker-diaphragm-pivot`、`radio-speaker-socket` | 本地声波节点与动画闭包 |
| 4 | 电视机 | 白点→横线→画面、跳台、CRT 鼓起、关机收束 | 无独立跨屏粒子；模型屏幕闭包自成时间线 | 立体像素碎片/屏幕高潮 | 游戏/图鉴由两个调用者控制结束边界 | `television-crt-screen-pivot`、`television-scanline-pivot`、`television-power-button-pivot`、`television-screen-socket` | 屏幕/根节点动画闭包迁入统一定义 |
| 5 | 加湿器 | 出雾口/旋钮、水面反馈 | `humidifier-mist-particle-*`、`humidifier-storm-cloud-*`、本地闪电和雨滴 | 高雾、云团、闪电、雨池 | 雾、云、闪电、雨四类全部重复 | `humidifier-outlet-cap-pivot`、`humidifier-mist-outlet-socket`、`humidifier-control-dial-pivot` | 本地 mist/cloud/lightning/rain 节点与材质更新；保留 outlet socket |
| 6 | 烤面包机 | 压杆、烘烤旋钮、槽内面包升降 | `toaster-toast-single-*` 绑定本地 carriage | 按初速度/重力飞出的立体 toast | 槽内面包和飞出面包并存 | `toaster-toast-carriage`、`toaster-carriage-socket`、`toaster-external-toast-launch-socket`、`toaster-lever-pivot` | 槽内旧面包网格和本地飞升闭包；统一系统只从 launch socket 生成一片面包 |
| 7 | 冰箱 | 上下门先后甩开、内饰显隐、回弹关门 | `refrigerator-cold-mist-*` | 冷雾、冰块/食物抛出回吸 | 冷雾双源；食物可能同时留在内饰和飞出 | `refrigerator-upper/lower-door-pivot`、两个 interior-content pivot、`refrigerator-cold-mist-socket` | 本地雾节点；门/内饰时序迁出，静态内饰食物保留但高潮由池化道具负责 |
| 8 | 洗衣机 | 滚筒/衣物加速、侧倾“走一步”、刹停回正 | `washer-squeezed-foam-bubble-*` | 从门内挤出的池化立体泡泡 | 泡泡双源 | `washer-drum-rotor`、`washer-drum-axis-socket`、`washer-door-assembly`、`washer-door-handle-socket` | 本地泡泡池；滚筒/衣物/整机重心公式迁出 |
| 9 | 微波炉 | 转盘、食物膨胀跳动、按钮、门缝顶开 | 模型材质蒸汽/内压表现 | 池化立体蒸汽 | 蒸汽和压力时序分属两处 | `microwave-tray-rotor-pivot`、`microwave-food-pivot`、`microwave-door-hinge-pivot`、`microwave-food-socket` | 模型动画闭包；蒸汽只由统一池生成 |
| 10 | 咖啡机 | 水箱、拨盘、冲煮头、咖啡流、杯液位 | 水箱气泡、`coffee-maker-steam-particle-*`、foam cap/bubble/drip | 大体积蒸汽与杯沿泡泡 | 蒸汽/泡沫双源 | `coffee-maker-brew-head-pivot`、`coffee-maker-liquid-outlet-socket`、`coffee-maker-cup-socket`、`coffee-maker-steam-socket`、水箱 pivot | 本地 steam/foam/bubble/drip 节点；咖啡流和液位机械迁入统一定义 |
| 11 | 电热水壶 | 开关扣下、整壶跳动/后仰、壶盖双轴急跳、水体翻滚、红灯 | `kettle-water-bubble-*`、`kettle-steam-particle-*` | 壶嘴池化立体蒸汽 | 已由红色回归证明同一 1.6s 有两个蒸汽 owner | `kettle-body-pivot`、`kettle-lid-hinge-pivot`、`kettle-power-switch-pivot`、`kettle-spout-steam-socket` | 本地水泡/蒸汽节点和整个动画闭包；首个架构样板 |
| 12 | 电饭煲 | 按钮下压上提、阀/盖抖动、锅体反馈 | `rice-cooker-rice-grain-*`、`rice-cooker-steam-particle-*` | 米粒爆起回落 + 粗立体蒸汽柱 | 米粒与蒸汽双源 | `rice-cooker-lid-hinge-pivot`、`rice-cooker-inner-pot-pivot`、`rice-cooker-cook-switch-pivot`、`rice-cooker-steam-socket` | 本地飞米/蒸汽节点；白米表面与内锅作为本体保留 |
| 13 | 手机 | 电量分段、升空、高频震动、落地回弹 | 模型通知/电量，局部震动线表现 | 左右池化立体漫画波浪线 | 震动视觉来源分裂 | `phone-handset-pivot`、`phone-battery-bar-pivot`、`phone-charging-ui-pivot`、`phone-body-socket` | 模型动画闭包；波浪线只由统一立体 rig 生成 |
| 14 | 扫地机器人 | LiDAR/刷头/轮子加速、真实小圆轨迹、准确归位 | 无独立池，碎屑逻辑缺少统一所有权 | 曲线回吸立体碎屑 | 机械轨迹与碎屑时钟分开 | `robot-vacuum-motion-pivot`、LiDAR/双轮/主刷/边刷 pivots 与 sockets | 运动积分和全部机械闭包迁出；碎屑只由统一池生成 |
| 15 | 泡泡机 | 泡泡轮/后风扇/旋钮加速 | `bubble-machine-powered-bubble-*` 与 glint | 大中小泡泡池 + 超大高潮泡泡 | 泡泡双池 | `bubble-machine-bubble-wheel-pivot`、`bubble-machine-rear-fan-rotor-pivot`、`bubble-machine-bubble-emitter-socket` | 本地 42 泡泡/glint 节点和更新；统一池负责碰撞/合并/高潮爆花 |
| 16 | 扭蛋机 | 摇柄蓄力旋转、仓内塌落、扭蛋出轨、壳体打开 | 模型内多颗 capsule/prize pivots | 池化立体 capsule 抛射/弹跳 | 出口扭蛋可能双份，壳体展开时序不统一 | `gumball-machine-front/side-crank-pivot`、`dispense-socket`、`capsule-drop-entry-socket` | 本地“飞出”动画迁出；仓内静态球保留，高潮只激活一个统一 capsule 道具 |
| 17 | 爆米花机 | 锅内玉米/爆米花跳动、转子、顶盖撞击 | `popcorn-machine-dispensed-popcorn-*` | 池化立体爆米花跨屏喷出 | 喷出爆米花双源/出生点不一致 | `popcorn-machine-popper-pivot`、`popcorn-machine-dispense-socket`、delivery assembly | 本地 dispensed popcorn 节点；内部静态/锅内道具保留，统一几何工厂供内外同形态使用 |
| 18 | 闹钟 | 双铃交替、锤击、手柄/机身跳起、指针高速转 | 无专属立体线池 | 池化冲击线 | 机械与冲击线分开且 stop 不同 | bell/hammer/hand/carry-handle pivots、`alarm-clock-hands-center-socket` | 模型动画闭包迁出；冲击线改为立体 tapered tube rig |
| 19 | 智能垃圾桶 | 感应光、开关盖、末次撞盖回弹 | 模型内 paper/bottle/carton waste 三件套 | 跨屏池化 trash 抛物线/二段 ricochet | 三件本地垃圾与统一垃圾同时飞 | `smart-bin-lid-hinge-pivot`、`smart-bin-sensor-trigger-socket` | 本地 waste pivots/mesh 和飞行闭包；统一池保留三种可读立体垃圾造型 |
| 20 | 唱片机 | 盖板、唱盘、唱臂、控制钮 | `record-player-sound-wave-*`、`record-player-music-note-*` | 池化唱片纹波与立体音符 | 声波/音符双源 | lid/platter/tonearm pivots、`record-player-platter-axis-socket`、speaker/audio sockets | 本地 wave/note 节点和动画闭包；盖板净空运动迁入统一定义 |
| 21 | 厨师机 | 搅拌、公转、自转、杯体反相摆动、超速 | `stand-mixer-splash-effects-pivot` 下 droplet/splat slots | 池化立体液滴和有厚度液体薄片 | 液滴/薄片双源 | head/planetary/beater/bowl/mixture pivots、`stand-mixer-liquid-effect-socket`/bowl-seat socket | 本地 splash slots；机械和液体表面公式迁入统一定义 |
| 22 | 打印机 | 进纸架、滚轮、打印头、控制键、托盘 | `printer-printed-paper-*-feed-pivot` 三张模型纸 | 连续池化厚纸过山车轨迹 | 本地三张纸与跨屏纸池双源 | support/input/roller/carriage/tray pivots、`printer-paper-exit-socket` | 本地 printed-paper 节点和喷纸闭包；统一池从 exit socket 发射 |
| 23 | 电磁炉 | 锅落下回弹、加热环、液体沸腾、抛锅 | `hotpot-boil-bubble-*`、`powered-steam-puff-*` | 池化液滴/蒸汽沸腾补强 | 沸腾与蒸汽双源 | enclosure/heating/cookware pivots、`induction-cooktop-pan-seat-socket` | 本地 boil/steam 节点；锅、食材与加热环机械迁入统一定义 |
| 24 | 搅拌机 | 刀片、旋涡、液体混色、盖子顶起回扣 | `blender-powered-ingredient-chunk-*`、模型 vortex/foam | 池化有厚度液滴和液体薄片 | 飞溅双源，模型块状食材仍由旧时钟 | blade/vortex/lid/jar/dial pivots、`blender-liquid-effect-socket` | 本地飞溅/ingredient 更新迁出；静态刀片/杯/液体载体保留 |
| 25 | 除湿机 | 风扇、控制、液位上升、整机整体膨胀 | `dehumidifier-airborne-moisture-droplet-*` | 180° 大范围水滴/雾曲线回吸 | 水滴双源 | main-body/tank/fan/control pivots、`dehumidifier-dry-air-output-socket`、moisture anchor | 本地 airborne droplets；所有机械、液位和整机膨胀迁入统一定义 |
| 26 | 便携音箱 | 左右振膜不同步重击、机身离地、整体压缩膨胀 | `portable-speaker-sound-wave-*` | 池化声波与立体音符、PetalField 推开/回流 | 声波双源，音符只在新层 | cabinet/driver pulse pivots、`portable-speaker-sound-wave-socket` | 本地 sound-wave 节点；双振膜和整机弹跳迁入统一定义 |
| 27 | 吹风机 | 叶轮、机身反冲、开关、五根长丝带传播/释放/下落 | `hair-dryer-warm-airflow-line-*`、`hair-dryer-blown-mint-strand-*` 与 Spectacle `dryer-ribbons` 均已删除 | 5 根 30 段矩形实体截面动态丝带；每根独立 amplitude/frequency/phase/twist/bend/turbulence；4.18s 解除 anchor 后余风飞行并重力下落 | 无叠加；只有模型 rig 内一个 ribbon field owner | body/nozzle/fan/ribbon pivots、`hair-dryer-airflow-emitter-socket` | `AppliancePerformanceSystem -> HairDryerPerformance` 唯一时间轴；游戏/图鉴同 geometry 与同时间采样 |
| 28 | 台式电脑 | 屏幕多界面/蓝屏、键盘、鼠标、双风扇、按钮 | 模型 UI/风扇；外部另有顶部烟雾 | 池化立体深色烟云 | 机械与烟雾时钟分开 | screen-state/blue-screen/keyboard/mouse/side-fan pivots、`desktop-computer-top-vent-socket` | 所有模型动画闭包迁出；烟雾只由统一池从 top vent 发射 |
| 29 | 游戏手柄 | 摇杆画圈、组合按键、定向后坐、翻起落下 | 无专属跨屏道具 | 当前错误复用了 note 作为“火花” | 特效语义错误且与机械分时钟 | motion/dpad/face-button/stick/trigger pivots、`game-controller-centre-socket` | 模型动画闭包迁出；把 note 替换为有方向的立体冲击星/弹道冲击环 |

## 统一迁移批次

1. 水壶样板：证明模型不再创建本地蒸汽，游戏/图鉴均只有一个 performance session。
2. 重复特效高风险批：加湿器、咖啡机、电饭煲、洗衣机、泡泡机、唱片机、打印机、电磁炉、除湿机。
3. 道具轨迹批：烤面包机、冰箱、扭蛋机、爆米花机、垃圾桶、搅拌机、厨师机。
4. 机械表演批：台灯、风扇、收音机、电视、微波炉、手机、扫地机器人、闹钟、音箱、吹风机、电脑、手柄。

## 回归信号

- 命令：`npx playwright test tests/appliance-performance.spec.ts --project=desktop-chrome --reporter=line`
- 修复前结果：稳定失败，水壶在 `elapsed=1.6s` 的 `activeSteamOwners` 为 `2`，预期 `1`。
- 通过条件：模型树不存在旧蒸汽节点；统一 performance 摘要显示一个 session、一个 timeline owner、一个活动蒸汽 rig。

## 最终迁移结果

- 29/29 已迁移。模型构建结果不再包含 `animation` 字段，模型工厂不再持有可更新动画闭包。
- 游戏、图鉴、模型审阅页共用 `AppliancePerformanceSystem`、`poweredAnimationState` 时间轴和 `ApplianceMechanics` 动画形态。
- `ApplianceSpectacleSystem` 只被 `AppliancePerformanceSystem` 引用；游戏与图鉴不存在直接调用。
- 旧特效节点和更新逻辑已物理删除，不采用隐藏旧节点或新旧叠加。
- 图鉴 `OrbitControls.autoRotate` 保留；knead 期间暂停统一时间轴并冻结当前姿态，松手后恢复。
- 立体道具使用挤出体、圆角厚纸、TubeGeometry、合并低模结构等可读 3D 形态，替换通用平面粒子表达。

## 最终验证

| 证据 | 结果 |
|---|---|
| TypeScript + Vite production build | passed |
| 水壶重复蒸汽 + 29 台迁移专项 | 2 passed |
| 图鉴 29 台三轮切换 | 87 次选择，pool capacity 第一轮后不增长 |
| 游戏固定 4.2 秒 | 水壶、风扇、洗衣机、打印机、除湿机均为 1 session / 1 timeline owner |
| 图鉴固定 4.2 秒 | 五台均为 1 session / 1 timeline owner，自动旋转方位角持续变化 |
| catalog | 23 passed |
| visual | 1 passed |
| transitions | 8 passed |
| levels | 6 passed |
| console/page errors | 五台游戏与图鉴证据均为 0 |
| WebGL context losses | 五台游戏证据均为 0 |

运行时和视觉证据位于 `artifacts/appliance-performance-comparison/`：

- `runtime-diagnostics.json`
- `kettle-game-gallery-4.2.png`
- `fan-game-gallery-4.2.png`
- `washer-game-gallery-4.2.png`
- `printer-game-gallery-4.2.png`
- `dehumidifier-game-gallery-4.2.png`
