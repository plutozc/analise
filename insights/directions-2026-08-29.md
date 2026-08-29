# 技术洞察方向发掘 — 2026-08-29

数据范围：最近 14 天 | 论文 200 篇 | 新闻 100 条 | 候选 244 条

---

## 🔴 🔄 LLM长上下文Prefill压力感知调度对AI集群网络流量整形启示

**优先级:** 2/5 | **置信度:** medium | **更新**

P-PAS提出以最大批处理令牌数(MBT)为核心调度信号,针对RAG/Agentic等长上下文场景Prefill阶段压力进行自适应调度。相比此前AFD解耦架构的随机负载建模,P-PAS聚焦Prefill突发流量特征,提出压力感知的请求准入与批处理策略。该调度粒度直接影响AI集群RoCE网络中KV Cache传输的突发流量模式,为网络侧流量整形与拥塞控制提供新协同设计维度。

- **网络对象:** AI集群RoCE网络、KV Cache传输链路、推理服务间通信
- **AI 方法:** LLM推理调度、Prefill压力建模、自适应批处理策略
- **软件技术栈:** vLLM推理框架、LLM serving系统、GPU kernel调度
- **欧洲连接:** BT(英国电信)关联
- **华为关联:** CloudEngine AI集群交换、iMaster NCE AI Fabric流量调度、AI推理服务部署
- **🔄 更新原因:** 新增P-PAS论文提出MBT指标与Prefill压力感知调度机制,相比此前AFD随机负载建模新增长上下文场景专用调度策略,补充vLLM实现层细节

**支撑证据:**
- [P-PAS: Prefill-Pressure Adaptive Scheduling for Long-Context LLM Serving](https://arxiv.org/abs/2608.15171)
- [Analytical Provisioning for Attention-FFN Disaggregated LLM Serving under Stochastic Workloads](https://arxiv.org/abs/2601.21351)
- [Q-First: Attention and Feed-Forward Concurrency at the Smallest Change to the Block](https://arxiv.org/abs/2608.15473)

---

## 🟡 Agentic AI链式推理驱动边缘计算网络联合资源调度新范式

**优先级:** 3/5 | **置信度:** medium

研究将LLM Agent与链式推理(CoT)应用于移动边缘计算(MEC)场景联合调度,在UAV辅助边缘网络中同时优化物理路由与计算任务卸载。框架将物流调度与MEC计算调度耦合为混合优化问题,利用Agentic AI多步推理替代传统强化学习单步决策。代表Agentic AI从云端运维向网络边缘调度延伸新趋势,对5G MEC与边缘AI部署具有参考价值。

- **网络对象:** 移动边缘计算(MEC)、UAV通信网络、计算卸载路由
- **AI 方法:** LLM Agent、链式推理(CoT)、强化学习
- **软件技术栈:** 边缘编排系统、MEC调度框架
- **欧洲连接:** 无直接连接
- **华为关联:** iMaster NCE边缘编排、5G MEC协同调度、自动驾驶网络边缘智能决策

**支撑证据:**
- Paper 39: An Agentic AI Framework with Large Language Models and Chain-of-Thought for UAV-Assisted Logistics Scheduling with Mobile Edge Computing

---

## ⚪ 开源安全大模型规模化生产对网络威胁检测自动化体系启示

**优先级:** 4/5 | **置信度:** low

CyberFactory提出从真实野外安全实例规模化构建训练数据与开源安全LLM方法论,突破闭源模型能力壁垒。将LLM安全能力从单点漏洞分析扩展到工厂化批量生产,实现检测能力规模化复制。对网络领域,开源安全LLM可嵌入网络入侵检测、流量异常分析、漏洞扫描等环节,推动网络安全运维从规则驱动向AI驱动体系化转型,与前期LLM安全测试误报演化学习形成互补。

- **网络对象:** 网络入侵检测、流量异常分析、网络漏洞扫描
- **AI 方法:** 安全领域LLM、大规模合成数据生成、能力蒸馏
- **软件技术栈:** 开源安全LLM框架、安全能力流水线
- **欧洲连接:** EU关联
- **华为关联:** 华为网络安全产品线、iMaster NCE安全策略联动、网络威胁智能分析

**支撑证据:**
- [CyberFactory: Scaling Cyber Security Capabilities with Instances from the Wild](https://arxiv.org/abs/2608.23181)

---

## 剔除方向

- Paper 2 FlashQuant: 已在8/26推荐'稀疏稠密融合离群值感知量化',本批无新实验数据
- Paper 4 Agentic Kernel: 已在8/28推荐'Agentic算子自动生成',本批同论文无新角度
- Paper 7 Quantum Kernel Learning: 量子计算非通信网络,剔除
- News 8 Ericsson AI scheduler: 已在8/28推荐'Ericsson AI调度器5G实网验证',同一新闻无增量
- Paper 9 AgentMV: 音乐视频生成,纯应用层,降权剔除
- Paper 10 Belayer: 已在8/26推荐'有状态Agentic RL训练容错',无新证据
- Paper 12 CacheCraft: 已在8/28推荐'KV Cache进化搜索',同论文无增量
- Paper 13 LatentSkill: LLM Agent技能压缩,无网络机制,降权剔除
- Paper 14 Machine Unlearning: 偏好对齐,无网络对象,降权剔除
- Paper 15 Speculative Rollback: Web Agent训练,非网络系统,降权剔除
- Paper 19 Decentralized FL: 联邦学习隐私保护,网络机制较弱,单一证据支撑不足
- Paper 20 Career Recommendation: 纯应用层,剔除
- News 30 Nokia optical: 已在8/27推荐'Nokia Agentic运维光网络',同一新闻无增量
- Paper 35 Multi-class Cache Fairness: 已在8/27和8/28推荐,同论文无增量
- Papers 6/16/17/18/21-29/31-34/36-38/40-50: 关键词误匹配(RAN/RIC/RoCE出现在非通信语境),实际为NLP/CV/物理/天文/生物等领域,非通信网络剔除

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | - | P-PAS: Prefill-Pressure Adaptive Scheduling for... | ✅ | 18 |
| paper | - | FlashQuant: Sparse-Dense Fusion for Memory-Effi... | ✅ | 16 |
| paper | - | Q-First: Attention and Feed-Forward Concurrency... | ✅ | 14 |
| paper | - | Agentic Kernel Optimization: Generating State-o... | ✅ | 14 |
| paper | - | Analytical Provisioning for Attention-FFN Disag... | ✅ | 14 |
| paper | - | PolyWorkBench: Benchmarking LLM Agents for Cros... | ✅ | 13 |
| paper | - | Experimentally Extending Quantum Kernel Learnin... | ❌ | 13 |
| news | Ericsson | SoftBank and Ericsson test AI scheduler on live... | ❌ | 13 |
| paper | - | AgentMV: A State-Guided Multi-Agent Framework f... | ✅ | 12 |
| paper | - | Belayer: Efficient Fault Tolerance for LLM Agen... | ✅ | 12 |
| paper | - | CyberFactory: Scaling Cyber Security Capabiliti... | ✅ | 12 |
| paper | - | Discovering KV Cache Eviction Policies via LLM-... | ✅ | 11 |
| paper | - | LatentSkill: From In-Context Textual Skills to ... | ✅ | 11 |
| paper | - | Leveraging Machine Unlearning for Cost-Efficien... | ✅ | 11 |
| paper | - | Speculative Rollback Correction for Quality-Div... | ✅ | 11 |
