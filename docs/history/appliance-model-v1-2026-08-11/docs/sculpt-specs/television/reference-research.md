# 复古 CRT 电视控制区与屏幕行为参考

检索日期：2026-08-08。

## 参考来源

- RCA Victor 630TS 服务资料：<https://www.manualslib.com/manual/4256735/Rca-Victor-630ts.html>
  - 用于确认老式电视的频道选择器是带档位的明确控制，而不是两个没有功能差异的装饰圆钮。
- Early Television Foundation，早期有线遥控资料：<https://www.earlytelevision.org/pdf/wired_television_remote_controls.pdf>
  - 用于确认复古电视的核心可操作项围绕开关、音量与频道切换，频道动作应有明确的机械反馈。
- Wikimedia Commons，`Retro CRT Television`：<https://commons.wikimedia.org/wiki/File:Retro_CRT_Television.jpg>
  - 用于核对深箱体、凸面屏、屏幕与窄控制区并置的真实外观关系。
- RepairFAQ，单条亮线故障说明：<https://www.repairfaq.org/samnew/tvfaq/tvsinghli.htm>
  - CRT 的扫描/偏转停止会把图像压缩成亮线；本项目把这一物理识别特征转译为“先纵向收成水平线，再横向收成点”的关机动画。
- RepairFAQ，电视故障 FAQ：<http://www.repairfaq.org/REPAIR/F_tvfaq5.html>
  - 用于交叉核对 CRT 偏转、亮线与荧光余辉的表现边界。

## 落地决定

- 保留一只带三档刻度的频道旋钮，删除第二只同质圆钮。
- 新增三枚有真实 Z 向厚度的青、黄、粉频道键；每次换台必须同步“按键下压、旋钮跳档、雪花闪烁、节目改变”。
- 三套节目分别为樱花日出、模拟彩条、夜间城市，全部由浅厚度实体几何组成。
- 换台噪声由 48 个立体雪花块和两条有厚度的信号带组成，不使用通用碎片、Sprite、Line 或 PlaneGeometry。
- 关机只收缩磷光画面，玻璃、边框和箱体保持实体不变。

