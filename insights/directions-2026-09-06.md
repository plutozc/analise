# 技术洞察方向发掘 — 2026-09-06

数据范围：最近 14 天 | 论文 200 篇 | 新闻 100 条 | 候选 247 条

---

## 🔴 🔄 电信巨头Agentic运维从标准共识迈向实网双线验证

**优先级:** 1/5 | **置信度:** high | **更新**

Cisco联合伙伴凭共享AgenticOps架构赢得TM Forum Moonshot Catalyst大奖，Nokia持续将Agentic能力扩展至光网络。两条产业线并行推进标志自治网络从标准讨论走向实网落地，共享架构与治理透明性成为产业共识核心要素，加速L4自治网络路径收敛。

- **网络对象:** 自治网络、光传输网络
- **AI 方法:** AI Agent、Agentic AI
- **软件技术栈:** 网络编排平台
- **欧洲连接:** TM Forum（欧洲标准组织）、Nokia（芬兰）
- **华为关联:** 与iMaster NCE自动驾驶网络、光网络控制直接对标，Agentic运维是华为L4/L5自治网络核心路径
- **🔄 更新原因:** 相比9/5 TM Forum催化奖和9/3 Nokia/Cisco推荐，新增Cisco获Moonshot Catalyst大奖具体证据及共享架构设计细节

**支撑证据:**
- [The Power of Co-Innovation for AgenticOps and Autonomous Networks](https://blogs.cisco.com/sp/the-power-of-co-innovation-for-agenticops-and-autonomous-networks)
- [Bringing agentic operations to optical networks - Nokia](https://news.google.com/rss/articles/CBMiogFBVV95cUxOS2hLQW1MQWw1czF0SDdHeTgya2lab01MODQtdkhEWkRfVlM3TUJFR0Vyd01abU40N2k1YVpTRWFfOE1zV1NRckttMXc5QWppR082LVhMY0wyTDRxRml0QllnREtsZkZoMHZPbWN5RDBmeVZzUjBnaHR2aGFhWERZYnJFZlJKdkJPMzVpc2N1b3REUGcxenVUOUptYlpoVmNmb3c?oc=5)

---

## 🔴 🔄 LLM推理服务同时面临功率弹性与JIT安全双重架构挑战

**优先级:** 2/5 | **置信度:** medium | **更新**

PowerSlider利用LLM推理prefill/decode阶段功率不对称性实现需求响应下弹性调度，JITterFlip揭示JIT编译优化引入主机侧控制面故障注入攻击面。两项研究共同表明LLM serving在能效与安全两个维度同时面临架构级挑战，对AI集群DPU卸载和推理服务安全设计有直接影响。

- **网络对象:** AI推理集群、DPU
- **AI 方法:** LLM推理优化
- **软件技术栈:** LLM serving框架、JIT编译运行时
- **欧洲连接:** 无直接连接
- **华为关联:** 与华为AI集群网络、CloudEngine数据中心交换、昇腾推理服务架构直接相关
- **🔄 更新原因:** 将9/3功率调度和9/4 JIT安全两个独立方向合并为双重约束新视角，揭示LLM serving系统性架构张力

**支撑证据:**
- [PowerSlider: Exploiting Phase Asymmetry for LLM Serving under Demand Response](https://arxiv.org/abs/2608.21719)
- [JITterFlip: Uncovering Fault Attack Surfaces in JIT-Compiled LLM Serving](https://arxiv.org/abs/2608.29745)

---

## 🟡 长程AI Agent安全从提示注入到能力约束的纵深防护体系

**优先级:** 3/5 | **置信度:** medium

ECLIPSE揭示长程Agentic系统中自演化隐蔽提示注入可跨多轮工具调用持续渗透，Reachability-Based方法从能力可达性分析提出Agent权限约束形式化框架。结合JIT层故障注入，LLM Agent安全需从输入过滤、能力约束到运行时的多层纵深防护，对自治网络Agent部署安全架构有重要启示。

- **网络对象:** 自治网络AI Agent
- **AI 方法:** LLM Agent
- **软件技术栈:** AI Agent框架、LLM serving运行时
- **欧洲连接:** 无直接连接
- **华为关联:** 自动驾驶网络部署AI Agent需安全防护体系，与华为网络大模型部署安全策略直接相关

**支撑证据:**
- [ECLIPSE: Self-Evolving Stealthy Prompt Injection Attack against Long-Horizon Agentic Systems](https://arxiv.org/abs/2608.30441)
- Paper 49: Reachability-Based Capability Confinement for LLM Agents under Indirect Prompt Injection
- [JITterFlip: Uncovering Fault Attack Surfaces in JIT-Compiled LLM Serving](https://arxiv.org/abs/2608.29745)

---

## 🟡 🔄 跨组织多Agent可审计治理v4强化EU合规形式化闭环

**优先级:** 3/5 | **置信度:** medium | **更新**

JustAct框架更新至v4，以EU数据保护法规为场景为跨组织多Agent系统提供策略驱动可审计治理形式化方法，增强通用法律与组织特定策略组合验证能力。CatchBench提出Agent故障PRE/LIVE/POST三态审计方法，从治理到监控形成Agent可信运行完整闭环，对电信多域自治网络治理机制有参考价值。

- **网络对象:** 电信多域自治网络
- **AI 方法:** 多Agent系统、形式化验证
- **欧洲连接:** EU数据保护法规（GDPR）驱动
- **华为关联:** 与华为跨域网络编排、iMaster NCE多域协同、自动驾驶网络L4治理机制关联
- **🔄 更新原因:** 相比9/5推荐，JustAct更新至v4增强EU合规形式化验证，新增CatchBench三态审计作为运行时监控补充

**支撑证据:**
- [JustAct: A Framework for Auditable Multi-Agent Systems Regulated by Inter-Organisational Policies (v4)](https://arxiv.org/abs/2502.00138)
- Paper 34: CatchBench: When Can an Agent Failure Be Caught?

---

## 剔除方向

- Paper 3 (TrustZone内核监控): OS安全方向，非通信网络
- Paper 7 (BadPatches Vision MoE): routing指MoE路由非网络路由，降权
- Paper 10 (GTaP GPU任务并行): 无网络相关
- Paper 12 (CyberFactory LLM网络安全): 通用网络安全，无明确网络机制
- Paper 13 (Web-CLI浏览器工具): 无网络基础设施关联
- Paper 14 (UiAs无线人脸反欺骗): 应用层，非网络基础设施
- Papers 17-18,20,28,38,41,44,46: 物理/数学/天文neural network，非通信网络
- Paper 19 (共识协议验证): 区块链共识，非电信
- Papers 21-22,25-27,37,42-43,45,47,50: 纯AI/ML，无网络系统交叉
- Papers 32-33,36,48: 数学/HPC/金融，无网络AI交叉
- News 31 (OpenAI购Mac Mini): AI训练硬件采购，无网络技术内容
- Paper 2 (Agentic-Kube): 与9/3推荐完全重复无新版本
- Paper 4 (VeriNC): 与9/2推荐完全重复
- Paper 8 (PCI分配): 与9/2推荐完全重复
- Paper 9 (分割联邦微调): 与9/4推荐完全重复
- Paper 15 (GPU同步开销): 与9/2推荐完全重复
- Paper 40 (隐私LLM嵌入): 与9/5推荐完全重复

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | - | Zero-Knowledge Predicate Proofs Between AI Agen... | ✅ | 18 |
| paper | - | Agentic-Kube: A Graph-Enhanced Multi-Agent Rein... | ✅ | 16 |
| paper | - | Building the Truman Show: A TrustZone-Based Fra... | ✅ | 15 |
| paper | - | VeriNC: Finding Design Risks of In-Network Comp... | ❌ | 13 |
| paper | - | PowerSlider: Exploiting Phase Asymmetry for LLM... | ✅ | 13 |
| paper | - | JITterFlip: Uncovering Fault Attack Surfaces in... | ✅ | 13 |
| paper | - | BadPatches: Routing-Aware Backdoor Attacks on V... | ✅ | 13 |
| paper | - | Congruence Decomposition with Neural Block Solv... | ✅ | 12 |
| paper | - | Unveiling the Depth-Performance Dilemma in Spli... | ✅ | 12 |
| paper | - | GTaP: A GPU-Resident Fork-Join Task-Parallel Sy... | ❌ | 12 |
| paper | - | JustAct: A Framework for Auditable Multi-Agent ... | ✅ | 12 |
| paper | - | CyberFactory: Scaling Cyber Security Capabiliti... | ✅ | 12 |
| paper | - | The Web-CLI: Verifiable Privacy for Tools, Mode... | ✅ | 12 |
| paper | - | UiAs: User-Independent 3D Facial Anti-Spoofing ... | ✅ | 12 |
| paper | - | Understanding the Synchronization Tax in GPU Sc... | ❌ | 11 |
