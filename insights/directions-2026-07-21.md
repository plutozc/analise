# 技术洞察方向发掘 — 2026-07-21

数据范围：最近 14 天 | 论文 201 篇 | 新闻 100 条 | 候选 253 条

---

## 🟡 🔄 CXL内存互联扩展AI推理集群KV缓存多级存储调度架构

**优先级:** 3/5 | **置信度:** medium | **更新**

HyMCache提出利用CXL异构内存（GPU HBM-主机DRAM-CXL扩展内存）构建集群级KV缓存三级存储层次，解决多轮/Agent工作负载下可复用KV状态的容量瓶颈。CXL作为新型内存互联协议，为推理集群引入成本可控的大容量近内存存储层，改变了KV缓存从请求内GPU显存到跨节点分布式存储的架构路径。

- **网络对象:** AI推理集群CXL/PCIe内存互联, 跨节点KV缓存通信
- **AI 方法:** LLM多轮推理KV缓存复用优化
- **软件技术栈:** LLM推理服务框架, CXL内存管理层
- **欧洲连接:** 无直接连接
- **华为关联:** AI集群网络架构与内存互联设计, CloudEngine数据中心交换, 推理集群存储分层与iMaster NCE算力编排
- **🔄 更新原因:** 相比2026-07-21『KV缓存从请求级张量到集群级分布式存储的架构演进』，新增CXL异构内存互联作为第三级存储层的具体框架设计（HyMCache），从纯软件缓存管理扩展到硬件互联协议层面

**支撑证据:**
- [HyMCache: A KV Cache Framework for Multi-Turn LLM Serving with CXL-Hybrid Memory](http://arxiv.org/abs/2607.18141v1)

---

## ⚪ 🔄 Agentic工作流驱动LLM推理集群从请求级到会话级调度范式迁移

**优先级:** 4/5 | **置信度:** low | **更新**

Talaria针对工具调用Agent场景，将推理调度单元从单次请求提升为跨工具间隙的完整会话。利用Agent会话中KV前缀高度可复用特性，在无服务器多模型GPU池上实现会话感知全局调度。该范式迁移反映Agent工作负载对推理集群网络编排层的新要求：会话亲和性路由、前缀感知放置、短间隙资源保持策略。

- **网络对象:** AI推理集群GPU池间网络, 无服务器推理路由层
- **AI 方法:** LLM Agent多轮推理, 会话级KV前缀复用调度
- **软件技术栈:** 无服务器推理调度框架, 多模型服务编排
- **欧洲连接:** 无直接连接
- **华为关联:** AI推理服务架构演进, iMaster NCE算力调度, AI集群网络会话级编排
- **🔄 更新原因:** 相比2026-07-14推理调度方向和2026-07-19 Agent工作流能耗方向，Talaria提供了会话级调度在百B参数多模型无服务器场景的完整系统设计，聚焦Agent工作负载的调度原语而非能耗特征

**支撑证据:**
- [Talaria: Session-Aware Serverless Serving of Hundred-Billion-Parameter LLMs](http://arxiv.org/abs/2607.17181v1)

---

## ⚪ 🔄 MoE大模型专家级全分离推理系统自适应持久化内核架构

**优先级:** 4/5 | **置信度:** low | **更新**

ExpertPlex将MoE推理分离粒度从实例级prefill-decode推进到专家级：当MoE权重增长到单实例需跨数十GPU时，按专家而非按阶段分配计算资源。提出自适应持久化CUDA内核处理MoE动态负载不均衡，减少跨节点专家通信开销。该架构对AI集群网络拓扑设计和专家间互联带宽规划提出新要求。

- **网络对象:** AI推理集群GPU间互联网络, 专家级跨节点通信拓扑
- **AI 方法:** MoE稀疏激活推理, 自适应持久化CUDA内核
- **软件技术栈:** 分离式推理服务框架, 持久化GPU内核调度
- **欧洲连接:** 无直接连接
- **华为关联:** AI集群网络拓扑设计, MoE推理集群互联带宽规划, CloudEngine AI fabric
- **🔄 更新原因:** 相比2026-07-15 MoE通信感知方向（裁剪+分组优化）和2026-07-14分离式推理方向（prefill-decode级），ExpertPlex将分离粒度推进到专家级并提出持久化内核方案

**支撑证据:**
- [ExpertPlex: A High-Goodput Disaggregated Serving System for MoE LLMs with Adaptive Persistent Kernels](http://arxiv.org/abs/2607.18002v1)

---

## 剔除方向

- Paper 2 (SAGA): 合成图基准生成工具，与通信网络无关，属纯AI数据工程
- Paper 3: 卡车运输投标决策，物流运筹学非通信网络，routing为误匹配
- Paper 5 (LaT): 车辆路径问题求解器，routing为物流路由非网络路由
- Paper 6: LLM问答顺序效应审计，纯AI行为研究无网络对象
- Paper 7: 线性注意力核化方法，纯AI架构无网络对象
- Paper 8: LLM驱动GPU内核生成(NVIDIA)，AI工程软件但无网络维度且非欧洲
- Paper 10: POMDP路由为Agent工作流路由非网络路由，纯AI Agent框架
- Paper 11: RAG向量检索隐私(OpenAI)，企业AI应用层无网络机制
- Paper 12: 儿童骨龄深度学习预测，医学影像完全无关
- Paper 13: 显式世界模型本体论，纯AI知识表示无网络对象
- News 14: Ericsson 5G用户数报告，行业统计无技术深度无AI方法
- News 15: AT&T/Ericsson 5G感知演示，缺技术论文支撑且摘要无量化细节
- Paper 16: Agent轨迹评估指标，纯AI评估方法论无网络对象
- Paper 17: 推荐系统统一模型(WHALE)，非网络领域
- Paper 18: AI材料科学Agent，非网络领域
- Paper 19: LLM集成多样性量化，纯AI理论无网络对象
- Paper 20: 稀疏自编码器可解释性，纯AI可解释性研究
- Paper 21: 电商推荐后排序Agent，非网络领域
- Paper 22: 3D高斯渲染(KTH)，虽有欧洲背景但属图形渲染非网络
- Paper 23: 自然语言领域元数据查询，纯AI应用无网络对象
- Paper 24: POMDP自由能理论，纯AI理论研究
- Paper 25: 脑MRI基础模型，医学影像完全无关
- Paper 26: 双曲空间专家AI(UCL)，纯AI几何方法论
- Paper 27: 业务流程监控可解释性，非网络领域
- Paper 28: 强化学习综述，综述类无具体网络应用
- Paper 29: 少样本逆强化学习，机器人操作领域
- Paper 30: 多Agent取送货调度，物流仓储非通信网络
- 【批次总评】本批30条候选中无一条具有真实通信网络/电信对象。RIC/RAN/RoCE等网络关键词均为误匹配（论文实际内容为物流/医学/推荐系统等）。仅Paper 1/4/9涉及AI推理集群基础设施，但均为已推荐方向增量更新且无欧洲连接。建议检查数据采集管道网络关键词过滤精度——当前批次误报率超90%。

## 候选数据摘要（Top 15）

| # | 类型 | 标题 | Network AI | 分数 |
|---|------|------|-----------|------|
| paper | arXiv | Talaria: Session-Aware Serverless Serving of Hu... | ✅ | 18 |
| paper | arXiv | SAGA: Synthetic Agentic Graph Architecture for ... | ✅ | 18 |
| paper | arXiv | Certified-Gap Dual-Price Policies for Real-Time... | ✅ | 17 |
| paper | arXiv | HyMCache: A KV Cache Framework for Multi-Turn L... | ✅ | 17 |
| paper | arXiv | LaT: LLM-as-Trainer for Multi-Task Vehicle Rout... | ✅ | 17 |
| paper | arXiv | Auditing Question-Order Effects in Large Langua... | ✅ | 14 |
| paper | arXiv | Kernelized Linear Attention: Breaking the Capac... | ✅ | 14 |
| paper | arXiv | Harness Engineering for LLM-Driven GPU Kernel G... | ✅ | 14 |
| paper | arXiv | ExpertPlex: A High-Goodput Disaggregated Servin... | ✅ | 14 |
| paper | arXiv | Reward-Driven LLM Agent Workflows: Synthesizing... | ✅ | 13 |
| paper | arXiv | TurboVec: A Case Study in Cost-Efficient Privat... | ✅ | 13 |
| paper | arXiv | Pediatric Bone Age Prediction Using Deep Learning | ✅ | 13 |
| paper | arXiv | An Explicit World Model Based on Data-First Ont... | ✅ | 13 |
| news | Ericsson | Ericsson Mobility Report: 5G subscriptions top ... | ❌ | 13 |
| news | Ericsson | AT&T, Ericsson demo 5G network sensing - teleco... | ❌ | 13 |
