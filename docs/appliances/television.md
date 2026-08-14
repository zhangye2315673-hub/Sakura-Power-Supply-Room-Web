# 电视机 / Television

模型入口：`createTelevisionModel(options)`
专属时间线：`applyTelevisionPerformance(root, time, power)`

## 模型结构

电视保留深箱体、凸面 CRT 玻璃、独立前框、后维修盖、散热槽和四只脚。正面右侧控制区已从“两只功能不明的同质圆钮”改成：

- `television-channel-selector-pivot`：三档频道旋钮，带指针与三枚外圈刻度。
- `television-channel-button-1/2/3-pivot`：青、黄、粉三枚有厚度的频道键。
- `television-power-button-pivot`：独立方形电源键。
- 下方五道扬声器槽。

## 屏幕内容

- 频道 1：樱花日出与丘陵。
- 频道 2：六色模拟彩条。
- 频道 3：月亮与彩色夜城。
- 换台：48 个立体雪花块与两条厚信号带快速闪烁。
- 关机：节目画面先纵向缩成水平荧光线，再横向缩成点，最后熄灭；玻璃和机壳不缩放。

## 5.2 秒时间线

- 0.02–0.34 秒：电源键下压，画面由点扩成线，再铺满屏幕。
- 0.94 秒：第二枚频道键下压，旋钮跳到中档，雪花闪烁后切到彩条。
- 1.84 秒：第三枚频道键下压，旋钮跳到右档，雪花闪烁后切到夜城。
- 2.72–4.12 秒：快速冲浪换台，六次档位跳转，弱信号与雪花断续闪烁。
- 4.42–5.14 秒：电源键再次下压，屏幕收成水平线、亮点并熄灭。

实体控制和屏幕状态由同一个 `TelevisionPerformance` 样本决定，诊断记录位于 `root.userData.televisionPerformanceDiagnostics`。共享层的接线要求见 `.planning/appliance_round_20260808/television-integration.md`。
