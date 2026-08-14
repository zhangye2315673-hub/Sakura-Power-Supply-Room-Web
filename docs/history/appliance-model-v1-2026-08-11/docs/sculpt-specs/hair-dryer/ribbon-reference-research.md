# 吹风机长丝带参考研究（2026-08-07）

## 检索范围

已按任务要求检索并交叉核对以下关键词：

- `long ribbon streamers blowing in the wind`
- `silk ribbon wind`
- `ribbon cloth simulation`
- `streamer wind physics`
- `long ribbons fluttering`
- `soft body`
- `festival ribbons wind`

本轮不是把某一张图片复制成贴片，而是从真实长丝带的运动规律中提取可执行的 3D 约束。

## 可访问来源

1. Blender Manual — Cloth Physical Properties  
   https://docs.blender.org/manual/en/latest/physics/cloth/settings/physical_properties.html  
   访问结果：HTTP 200。弯曲刚度、阻尼、内部弹簧和压力是相互独立的；长窄布带不会像一根刚性杆整体同步摆动。
2. Blender Manual — Wind Force Field  
   https://docs.blender.org/manual/en/latest/physics/forces/force_fields/types/wind.html  
   访问结果：HTTP 200。风场沿局部轴向作用，并具有噪声、衰减和流动参数；同一风向下不同条带仍会因位置、质量和扰动出现不同响应。
3. Bridson, Marino, Fedkiw — Simulation of Clothing with Folds and Wrinkles  
   https://www.cs.ubc.ca/~rbridson/docs/cloth2002.pdf  
   访问结果：HTTP 200。布料的折叠/翻面来自局部弯曲和约束传播，不应由整个对象的单一正弦旋转替代。
4. Baraff & Witkin — Large Steps in Cloth Simulation  
   https://www.cs.cmu.edu/~baraff/papers/sig98.pdf  
   访问结果：HTTP 200。布料采用分布式自由度与约束，固定点和自由区段必须分开处理；解除约束时位置应连续，只改变后续受力。
5. Three.js BufferGeometry  
   https://threejs.org/docs/#api/en/core/BufferGeometry  
   访问结果：HTTP 200。可直接更新 position/normal attribute，适合在共享时间轴上确定性重建分段厚丝带，而不依赖 Plane、Line 或逐帧创建新对象。

## 真实运动观察转译

- 固定端几乎不移动，波峰从固定端向自由端传播；离固定点越远，横向摆幅越明显。
- 丝带不是只在一个平面内画正弦：它会形成 S Curve，并围绕自身长轴扭转，局部正反面交替朝向观察者。
- 同一阵风中的多根丝带共享主风向，但长度、摆幅、频率、初相位、弯曲刚度和湍流响应不同，因此不会同相位排队摆动。
- 自由端的卷曲和翻面比固定端更强；较长、较窄的条带响应更快，局部折返也更多。
- 松开固定端时，丝带的世界位置不应跳变。它会继承当时形状和余风速度，继续向前平移/翻卷，随后在失速与重力下整体下落。

## 对本项目的实现约束

- 使用 5 根 `HairDryerDynamicSolidRibbonGeometry`；每个截面有 4 个角点，连续生成正面、背面、两条侧边和端盖，明确具有厚度。
- 每根 30 段，共享主风向（喷口局部 `-X`），但 profile 中的 `length/width/thickness/amplitudeY/amplitudeZ/frequency/waveNumber/phase/twist/bend/turbulence/seed` 全部独立。
- 使用多频传播波与确定性 turbulence；不使用随机逐帧噪声，保证游戏与图鉴在同一时间点形态一致。
- 4.18 秒解除固定端；所有释放项在 `dt=0` 时为零，以保证世界位置连续。4.18–5.12 秒继续受余风、扭转和重力，5.12 秒到屏幕下方后回收。

## 限制

这是实时浏览器中的 stylized/low-poly 布带近似，不是高迭代布料求解器。单帧位置由确定性解析场重建，优势是游戏与图鉴严格同形态、可测试、无累计漂移；代价是不会模拟自碰撞和真实织物褶皱微结构。
