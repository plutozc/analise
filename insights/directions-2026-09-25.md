# 技术洞察方向发掘 — 2026-09-25

数据范围：最近 14 天 | 论文 208 篇 | 新闻 100 条 | 候选 255 条

---

## 🔴 🔄 执行溯源与策略约束双轨强化网络智能体可信治理闭环

**优先级:** 1/5 | **置信度:** high | **更新**

ActGov提出运行时策略约束验证框架，对LLM Agent每步动作进行权限校验与合规性检查；Agentic AI Security综述构建跨维度威胁分类体系；Agent Traces to Trust系统化梳理执行溯源与证据链技术。三者互补，形成从威胁建模、运行时策略执行到事后审计溯源的完整可信治理闭环，直接支撑网络自治场景下智能体行为可控性要求。

- **网络对象:** 网络自治智能体、自动驾驶网络编排系统
- **AI 方法:** LLM Agent、策略约束推理、执行溯源
- **软件技术栈:** Agent框架运行时策略引擎、执行日志审计系统
- **欧洲连接:** Paper 21/22均标注Horizon项目资助
- **华为关联:** 自动驾驶网络Agent可信执行、iMaster NCE智能体行为审计与合规
- **🔄 更新原因:** 相比09-24推荐新增Paper 28执行溯源维度与Paper 21运行时策略验证机制，从双轨扩展为威胁建模-策略执行-溯源审计三环闭合

**支撑证据:**
- [ActGov: Governing LLM Agent Actions via Policy-Constrained Validation](https://arxiv.org/abs/2609.24446)
- [Connecting the Dots in Agentic AI Security: A Cross-Dimensional Threat Taxonomy](https://arxiv.org/abs/2609.23894)
- [From Agent Traces to Trust: A Survey of Evidence Tracing and Execution Provenance in LLM Agents](https://arxiv.org/abs/2606.04990)

---

## 🔴 LLM驱动网络访问控制策略代码自动生成与形式化验证

**优先级:** 2/5 | **置信度:** medium

Structured Decomposition提出LLM端到端流水线，将自然语言访问控制策略自动翻译为OPA可执行Rego代码，包含策略检测、组件提取、模式验证、静态分析、编译和自动化测试六阶段。该方法论可直接迁移至SDN/网络编排场景的意图驱动策略生成，实现从自然语言网络意图到可执行网络策略的自动化闭环。

- **网络对象:** 网络访问控制策略、SDN策略、意图驱动网络策略
- **AI 方法:** LLM（自然语言到策略代码生成）
- **软件技术栈:** OPA/Rego策略引擎、策略即代码(Policy-as-Code)流水线
- **欧洲连接:** 无直接连接
- **华为关联:** iMaster NCE意图驱动网络策略自动生成、网络策略形式化验证与合规

**支撑证据:**
- Paper 35: Structured Decomposition for Reliable LLM-Generated Access Control Policies

---

## 🟡 信息论反馈编码揭示LLM智能体隐蔽信道安全新攻击面

**优先级:** 3/5 | **置信度:** medium

Feedback Coding论文将Shannon反馈编码理论应用于LLM Agent场景，实现黑盒条件下（无需模型权重）通过看似正常对话文本传递隐蔽信息。该方法仅利用推理时输出概率，接收方通过反馈信道迭代提升解码可靠性。这对网络监控与流量审计构成新型威胁：Agent间可在合法API调用中嵌入隐蔽指令，传统DPI及内容检测难以识别。

- **网络对象:** 网络流量监控、API通信安全、Agent间通信信道
- **AI 方法:** LLM推理时隐写术、Shannon反馈编码
- **欧洲连接:** 无直接连接
- **华为关联:** 网络安全监控与异常流量检测、自动驾驶网络Agent间通信安全审计

**支撑证据:**
- Paper 47: Feedback Coding Enables Inference-Time Covert Agentic Communication

---

## ⚪ 边缘AI加速器混淆代理攻击暴露网络推理部署安全盲区

**优先级:** 4/5 | **置信度:** medium

Speed Kills论文系统研究边缘AI加速器(TPU等)的Confused Deputy攻击面，揭示加速器共享资源管理中的权限隔离缺陷。攻击者可利用AI加速器驱动栈漏洞实现跨应用数据泄露或推理结果篡改。随着AI推理下沉到网络边缘（基站、网关、CPE），加速器安全直接影响网络边缘智能功能可靠性，需在硬件-驱动-运行时三层构建防护。

- **网络对象:** 网络边缘设备（基站/网关/CPE）中的AI加速器
- **AI 方法:** 边缘AI推理
- **软件技术栈:** AI加速器驱动栈、推理运行时隔离机制
- **欧洲连接:** 无直接连接
- **华为关联:** 昇腾Ascend加速器安全、边缘AI推理部署防护、CloudEngine边缘智能

**支撑证据:**
- [Speed Kills: Exploring Confused Deputy Attacks Through Edge AI Accelerators](https://arxiv.org/abs/2605.17707)

---

## 剔除方向

- Paper 2/3/34: 纯神经网络理论（损失景观/谱重尾），无通信网络对象
- Paper 4: GPU稀疏注意力优化用于视频扩散，非网络AI
- Paper 8/33: LLM注意力架构改进，纯AI模型层无网络对象
- Paper 10: SGD收敛理论，纯优化理论
- Paper 11: 无人机着陆强化学习，非通信网络
- Paper 12: 备件库存网络设计，supply chain非通信网络
- Paper 13: 学习率调度理论，纯训练优化
- Paper 14: LLM Agent做CTF密码学攻击，安全方向但非网络AI
- Paper 15/16/19/31: 地震/肌电/脑皮层/脑疾病，生物医学领域
- Paper 17: 机器人控制安全屏障函数，非网络
- Paper 18: LLM-as-Judge评估框架，纯AI评估方法论
- Paper 20: LLM训练数据中AI生成内容影响，纯AI数据质量
- Paper 23: 恶意软件家族识别，安全但非网络AI
- Paper 24-27/29-30/32: 神经过程/粒子系统/光学/化学/物理仿真/蛋白质，非通信网络
- Paper 36: LLM辅助JS引擎模糊测试，软件安全非网络
- Paper 37-39: 统计/金融/分子模拟，非通信网络
- Paper 41-46/48-50: 黑盒优化/EEG/鲁棒RL/氢能/特征流/金融/密码/音频/采样，非通信网络
- Paper 1/5/6/9/40: 近期已推荐且本批无显著新证据（PrefixBench/SDC纠错/SiliconBench/eBPF/华为3D DC）

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | arXiv | PrefixBench-H100: Characterizing Prefix Reuse a... | ✅ | 18 |
| paper | - | Benign Loss Landscapes Can Coexist with Worst-C... | ✅ | 17 |
| paper | - | Dimension-Corrected Hitting Times for Heavy-Tai... | ✅ | 17 |
| paper | arXiv | Decoupling Logical Masks from GPU Execution for... | ✅ | 17 |
| paper | arXiv | Syndrome Decoding for Silent Data Corruption in... | ✅ | 17 |
| paper | arXiv | SiliconBench: Speed, Memory, and Fidelity for L... | ✅ | 17 |
| paper | - | Speed Kills: Exploring Confused Deputy Attacks ... | ✅ | 14 |
| paper | - | Low-Rank Attention Residuals | ✅ | 14 |
| news | Google新闻-SDN交换机 | 记忆化技术发威！eBPF CPU 成本直降约 90% - blog.csdn.net | ❌ | 13 |
| paper | - | High-Probability Convergence of SGD via Batched... | ✅ | 12 |
| paper | - | Curriculum-Based Adversarial Heterogeneous Agen... | ✅ | 12 |
| paper | - | Learning-Augmented Optimization for Strategic T... | ✅ | 12 |
| paper | - | Optimal Learning Rate Schedules under Functiona... | ❌ | 12 |
| paper | - | KryptoPilot: An Open-World Knowledge-Augmented ... | ✅ | 12 |
| paper | - | Parameter-Efficient Adaptation of Pre-Trained V... | ✅ | 12 |
