# 加湿器体积天气质量约束与参考

## 现实结构参考

- [Levoit Dual 150 Ultrasonic Cool Mist Humidifier](https://levoit.com/products/dual-150-ultrasonic-cool-mist-humidifier)：官方产品页明确标为超声波冷雾加湿器，具有顶部加水和 360° 可定向喷嘴。模型因此保留独立储水箱、顶端旋转喷口和真实 mist socket；没有虚构可见加热管。
- [US EPA - Use and Care of Home Humidifiers](https://www.epa.gov/indoor-air-quality-iaq/use-and-care-home-humidifiers)：说明 ultrasonic / impeller cool-mist humidifier 会从水箱把水和其中物质扩散到室内空气。动画因果链采用“水箱工作 → 顶部喷出大量冷雾 → 湿气持续聚集”。
- [Poly Pizza Explore](https://poly.pizza/explore/Cloud)：只作为可爱低模资产的轮廓和面数密度参考，不下载或复制外部模型。云采用少量大体块、不规则多面体瓣片和深浅两级腹部配色。

## 质量约束

1. 雾必须从 `humidifier-mist-outlet-socket` 发出，不能从机身中心或屏幕空间生成。
2. 雾由至少 16 组闭合体积组件组成，持续上升到云底；不能使用 Plane、Sprite 或一眼可见的单球粒子。
3. 完整乌云约 `4.1 × 2.5 × 2.05`，正投影视觉面积相对 `2.34 × 2.93` 本体约 1.5 倍。
4. 云是带真实 Z 厚度的多瓣 Low Poly 体，不是正面成立、侧面坍缩的 2.5D 卡片。
5. 闪电至少包含一个内部发光体和一个闭合立体结构；闪烁必须短促且发生在云成形之后。
6. 下雨至少保留 30 个可见槽位，水滴使用 LatheGeometry 的尖顶/圆腹轮廓；不能用 Cylinder 细线或竖直 Plane。
7. 雨滴落点必须同时覆盖机顶与附近地面，形成“加湿过头”的高潮因果。
8. 游戏与图鉴只能由 `AppliancePerformanceSystem` 驱动同一 `HumidifierPerformance`；共享 spectacle 不得再生成第二套湿气、云、闪电或雨。

## 模型映射

- 高雾：`humidifier-volumetric-mist-rig`，18 个 pivot × 4 个不规则 `IcosahedronGeometry` 瓣。
- 乌云：`humidifier-volumetric-weather-cloud-rig`，9 个独立不规则体积瓣，深色腹部有独立材质。
- 内闪：`humidifier-cloud-internal-light-pivot` 的 3 个亮体。
- 立体闪电：`humidifier-cloud-volumetric-lightning-bolt`，`TubeGeometry`。
- 下雨：`humidifier-volumetric-rain-rig`，36 个 `LatheGeometry` 水滴。

## 近似与限制

- 暴雨云是游戏夸张表现，不是现实加湿器可产生的真实天气尺度。
- 旧三视参考路径在当前工作区不可用；本轮保持既有主体重建不动，只重做用户点名的体积天气 rig。
- 雨滴与机器使用解析落点，不启用刚体碰撞或地面积水；这轮重点是清楚的体积、轨迹和高潮可读性。
