# 搅拌机真实结构、运动与风格参考（2026-08-07）

本轮目标不是复刻某一品牌，而是把可验证的真实结构与流体运动规律转译成 SAKURA / Stylized Low Poly / img2threejs 的程序化立体模型。以下页面均已在实施前实际访问。

## 可访问参考与观察

1. [Blendtec FourSide Jar](https://www.blendtec.com/products/fourside-jar)
   - 页面把杯体明确描述为方形透明罐，并展示杯体、独立杯盖和底部厚钝刀片的层级关系。
   - 对本项目的转译：杯壁保留真实厚度与上宽下窄轮廓；刀片必须位于杯底轴承之上，所有水果和液体都限制在杯体内径中，喷溅只允许从杯口 socket 出现。
2. [Ninja Professional Plus Blender](https://www.ninjakitchen.com/products/ninja-professional-plus-blender-with-auto-iq-zidBN701)
   - 产品页列出独立 pitcher、lid、stacked blade assembly，并说明实际搅拌程序会组合 pulse、blend、pause。
   - 对本项目的转译：底座、杯体、刀片、杯盖使用独立 pivot；运行不是所有部件同步正弦，而是启动脉冲、持续搅拌、杯体惯性滞后、盖子后段释放/回落的分阶段时间轴。
3. [Splash (fluid mechanics)](https://en.wikipedia.org/wiki/Splash_(fluid_mechanics))
   - 页面记录液滴撞击液体或固体时会形成 corona/crown，并展示 back-jet 与慢动作水果入水；可见 splash 由液滴、拉长液柱、冠状薄片和落地铺展共同构成，不是统一小球。
   - 对本项目的转译：性能池拆成圆润大/小滴、拉长滴和有厚度的冠状/扁平 splash；飞行用抛物线，落地有短暂停留、压扁和淡出。
4. [Sketchfab Low-poly-fruit 3D models](https://sketchfab.com/tags/low-poly-fruit)
   - 聚合页提供多角度低多边形水果造型参考，核心识别来自轮廓、色块层级和小型特征（草莓萼片、香蕉弧形、苹果凹顶与果梗、蓝莓冠口），而不是纯色球。
   - 对本项目的转译：杯内使用草莓、香蕉、苹果、橙子、蓝莓等可识别多部件体积模型；每种至少有主体与第二识别层，避免相同球体换色。

## 运动结论

- 真实搅拌的力从刀片轴开始，杯内内容物先被切碎，再形成稳定旋涡；果汁液面从底部增长，不能一开机就突然整杯出现。
- 电机底座质量大，因此只做低幅横摆；杯体位于高处且有液体惯性，振幅更大、相位滞后，并叠加俯仰与回弹。
- 杯盖先随杯体摩擦摆动，后半段受液体高潮顶起，执行“左右晃动 → 两次上下弹跳 → 回落杯口”。
- 所有喷溅从 `blender-splash-mouth-socket` 发射；高潮放在 3.45 秒附近，保证游戏和图鉴的统一证据时刻都能看到盖子抬起、果汁接近满杯和多形态立体飞溅。

## 单视图与风格声明

杯内水果、果汁和喷溅是 powered-use 的风格化近似，不属于空机参考图的静态外观。隐藏的电机、密封圈内部和真实流体压力不可由现有三视图精确恢复；本轮承诺的是结构关系、体积感、运动因果和穿模边界，不声称工业级流体仿真或品牌级精确复刻。
