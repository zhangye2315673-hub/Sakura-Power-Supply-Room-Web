# 台式风扇结构参考与重建判断

## 参考来源

1. Honeywell 官方产品页：`Honeywell Turbo Force Fan, HT-900`
   - https://www.honeywellstore.com/store/products/honeywell-turboforce-air-circulator-fan-ht-900.htm
   - 官方主图直接显示：承重支架位于风道壳体两侧/后侧，俯仰轴穿过机头侧面；支架不应落入扇叶旋转平面。
2. Sketchfab：`80s Desk Fan Low Poly`
   - https://sketchfab.com/3d-models/none-612736f7659d451e811c967c8fea370b
   - 仅作 Low Poly 体块参考：底座、固定立柱、后置电机、前后护罩、叶片和前轮毂是分层的独立体块。
3. Sketchfab：`Low Poly Desk Fan`
   - https://sketchfab.com/3d-models/none-3440f8515a6042dba31d5b1711a10d65
   - 仅作轮廓参考：前护罩在叶片之前，叶片位于护罩形成的笼体中，支架从机头后下方承托，不占用叶片扫掠空间。
4. img2threejs 本地规格检索：`core_3d`
   - 查询：`desk fan front guard rear guard motor shaft blade clearance support yoke`
   - 命中 `TorusGeometry` 环形件、`ExtrudeGeometry` 自定义叶片轮廓以及 scene-graph relational triplets；据此继续使用低段数环体、挤压曲面叶片和明确父子关系，不下载外部模型。

## 图像观察（观察先于推断）

- 宏观：一个低而厚的底座承托圆形机头；机头与底座之间需要明确的承重路径。
- 中观：固定立柱在后，俯仰/摇头枢轴在电机轴附近；电机在叶片后方，叶片夹在前、后护罩之间。
- 微观：前护罩、后护罩由外圈和连接卡扣形成笼体；中心轴从电机前端穿过后护罩中心，再连接叶片轮毂和前饰盖。
- 材质：项目目标是可爱 Low Poly 游戏道具，不追求真实金属丝密度；护罩只保留粗外圈、少量同心圈和放射筋。
- 单视图盲区：真实参考没有给出电机内部轴承、护罩卡扣背面和底座内部摇头机构，这些仅做结构化推断，不声称精确复刻。

## 本轮结构结论

- 固定立柱不得作为 `fan-oscillation-pivot` 的子节点；否则摇头会带着整根立柱旋转，并使其扫入护罩/主体。
- 摇头枢轴放在立柱顶端、机头后下方；俯仰枢轴作为其子节点，只携带电机、转子和护罩。
- 深度顺序固定为：后置电机 → 后护罩 → 叶片/轮毂 → 前护罩 → 前饰盖。
- 叶片最大扫掠半径必须小于护罩外圈内半径，并在前后护罩之间保留可见间隙。
- 原有 `fan-front-air-socket` 与 `fan-sakura-gust` 元数据原样保留，樱花仍由统一 Spectacle 系统发射。
