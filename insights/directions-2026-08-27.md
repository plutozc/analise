# 技术洞察方向发掘 — 2026-08-27

数据范围：最近 14 天 | 论文 202 篇 | 新闻 100 条 | 候选 246 条

---

## 🔴 Nokia Agentic运维向光网络延伸推动自动驾驶光网范式演进

**优先级:** 1/5 | **置信度:** high

Nokia发布光网络Agentic运维方案，将AI Agent引入光传输网络闭环控制。继Cisco AgenticOps聚焦路由交换遥测驱动后，Nokia将Agentic范式延伸至光层，涉及光路径优化、故障预测与自愈。这标志着设备商在光网络自治运维赛道加速布局，对光网络控制面软件架构和Agent编排框架提出新要求。

- **网络对象:** 光传输网络、DWDM光路径、光网络控制面
- **AI 方法:** Agentic AI、闭环自治决策
- **软件技术栈:** 光网络控制器、网络编排软件
- **欧洲连接:** Nokia（芬兰），欧洲光网络运营商生态
- **华为关联:** 直接对标iMaster NCE光网络控制器、自动驾驶网络L4/L5光层闭环、华为光网络智能运维方案

**支撑证据:**
- [Bringing agentic operations to optical networks - Nokia](https://news.google.com/rss/articles/CBMiogFBVV95cUxOS2hLQW1MQWw1czF0SDdHeTgya2lab01MODQtdkhEWkRfVlM3TUJFR0Vyd01abU40N2k1YVpTRWFfOE1zV1NRckttMXc5QWppR082LVhMY0wyTDRxRml0QllnREtsZkZoMHZPbWN5RDBmeVZzUjBnaHR2aGFhWERZYnJFZlJKdkJPMzVpc2N1b3REUGcxenVUOUptYlpoVmNmb3c?oc=5)

---

## 🔴 🔄 LLM推理Attention-FFN并行解耦与Prefill压力调度协同演进

**优先级:** 2/5 | **置信度:** high | **更新**

Q-First提出Attention与FFN并行执行架构，打破传统decoder block串行依赖，使解耦部署下两类硬件可并行工作；P-PAS提出Prefill压力自适应调度，针对长上下文RAG/Agent场景优化端到端延迟；AFD分析配置论文给出随机负载下解耦部署容量规划数学模型。三篇论文从架构、调度、容量三层推进解耦推理，对AI集群网络通信模式和带宽规划产生直接影响。

- **网络对象:** AI集群互联网络、RoCE/RDMA通信、解耦推理节点间数据面
- **AI 方法:** LLM推理架构优化、解耦式serving
- **软件技术栈:** vLLM推理框架、解耦式LLM serving系统、GPU kernel调度
- **欧洲连接:** P-PAS关键词标注BT（疑似英国电信相关机构）
- **华为关联:** CloudEngine AI集群交换机流量模型优化、AI推理服务网络带宽规划、华为昇腾推理集群通信架构
- **🔄 更新原因:** 相比8月26日推荐新增Q-First（Attention-FFN并行执行）和P-PAS（Prefill压力自适应调度）两篇新论文，从架构并行性和长上下文调度两个新角度深化解耦推理方向

**支撑证据:**
- [Q-First: Attention and Feed-Forward Concurrency at the Smallest Change to the Block](https://arxiv.org/abs/2608.15473)
- [P-PAS: Prefill-Pressure Adaptive Scheduling for Long-Context LLM Serving](https://arxiv.org/abs/2608.15171)
- [Analytical Provisioning for Attention-FFN Disaggregated LLM Serving under Stochastic Workloads](https://arxiv.org/abs/2601.21351)

---

## 🟡 LLM引导KV Cache策略自动进化与多类缓存公平反馈控制

**优先级:** 3/5 | **置信度:** medium

CacheCraft用LLM引导程序进化自动发现KV Cache淘汰策略，突破手工启发式设计瓶颈，在不同模型/上下文长度/压缩率下泛化；生物反馈控制器论文提出多类Cache公平性控制机制，解决多租户LLM serving中系统提示、用户文档、代码上下文、对话历史共享淘汰池时的公平性问题。两者结合揭示推理服务缓存管理从静态规则向自适应进化+反馈控制范式迁移。

- **网络对象:** 推理服务集群内存资源、多租户推理服务数据面
- **AI 方法:** LLM引导程序进化、生物启发反馈控制、自适应淘汰策略
- **软件技术栈:** LLM推理框架（KV Cache管理层）、多租户serving调度
- **欧洲连接:** 无直接连接
- **华为关联:** 昇腾推理服务多租户资源管理、网络大模型推理效率优化、MindSpore推理引擎缓存策略

**支撑证据:**
- [Discovering KV Cache Eviction Policies via LLM-Guided Program Evolution](https://arxiv.org/abs/2608.14555)
- Paper 31: A Biophysically-Inspired Feedback Controller for Multi-Class Cache Fairness

---

## 剔除方向

- Paper 6/17/37/41/50: quantum/物理学neural network，非通信网络，剔除
- Paper 10: 音乐视频生成Agent，纯应用层无网络机制，剔除
- Paper 21: 遥感城市地图，非网络领域，剔除
- Paper 22: 职业路径推荐，非网络领域，剔除
- Paper 40: 系外行星探测，天文学，剔除
- Paper 43: 蛋白质分类，生物信息学，剔除
- Paper 2(FlashQuant): 与8月26日'稀疏稠密融合离群值感知量化'完全重叠，无新角度
- Paper 9(Belayer): 与8月26日'有状态Agentic RL训练容错快照'完全重叠
- Paper 28(LTL-RL): 与8月24日'LTL时序逻辑结构化RL零样本指令泛化'完全重叠
- News 8(Ericsson/SoftBank): 与8月22日'爱立信联合软银5G实网AI调度器'完全重叠，同一事件
- Paper 3(Agentic Kernel): GPU kernel生成，无网络对象
- Paper 7/13/14/20/24/25: LLM Agent通用能力论文，缺乏明确网络对象
- Paper 11(CyberFactory): LLM安全能力扩展，与网络安全运维有弱关联但缺乏网络机制细节
- Paper 15/18/44/47: 网络关键词为false positive（RAN匹配random/range等），实际无通信网络内容
- Paper 16/23/32/33/34/35/36/38/42/44/46/48/49: 纯AI/ML方法论文，网络关键词均为误匹配

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | - | P-PAS: Prefill-Pressure Adaptive Scheduling for... | ✅ | 18 |
| paper | - | FlashQuant: Sparse-Dense Fusion for Memory-Effi... | ✅ | 16 |
| paper | - | Agentic Kernel Optimization: Generating State-o... | ✅ | 14 |
| paper | - | Q-First: Attention and Feed-Forward Concurrency... | ✅ | 14 |
| paper | - | Analytical Provisioning for Attention-FFN Disag... | ✅ | 14 |
| paper | - | Experimentally Extending Quantum Kernel Learnin... | ❌ | 13 |
| paper | - | PolyWorkBench: Benchmarking LLM Agents for Cros... | ✅ | 13 |
| news | Ericsson | SoftBank and Ericsson test AI scheduler on live... | ❌ | 13 |
| paper | - | Belayer: Efficient Fault Tolerance for LLM Agen... | ✅ | 12 |
| paper | - | AgentMV: A State-Guided Multi-Agent Framework f... | ✅ | 12 |
| paper | - | CyberFactory: Scaling Cyber Security Capabiliti... | ✅ | 12 |
| paper | - | Discovering KV Cache Eviction Policies via LLM-... | ✅ | 11 |
| paper | - | LatentSkill: From In-Context Textual Skills to ... | ✅ | 11 |
| paper | - | Speculative Rollback Correction for Quality-Div... | ✅ | 11 |
| paper | - | Learning with Local Search MCMC Layers | ✅ | 11 |
