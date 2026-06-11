/** Fine-grained technology keywords grouped by parent topic */
export const TECH_KEYWORDS: { topic: string; keyword: string; label: string }[] = [
  // DC Networking
  { topic: "dc-networking", keyword: "rdma", label: "RDMA" },
  { topic: "dc-networking", keyword: "roce", label: "RoCEv2" },
  { topic: "dc-networking", keyword: "lossless", label: "Lossless DC" },
  { topic: "dc-networking", keyword: "dcqcn|dctcp|timely", label: "DC Transport" },
  { topic: "dc-networking", keyword: "congestion.*(control|mgmt|management)", label: "Congestion Control" },
  { topic: "dc-networking", keyword: "load balancing|flow scheduling|coflow", label: "Load Balancing" },
  { topic: "dc-networking", keyword: "data center network|dcn|clos|fat.tree", label: "DC Architecture" },

  // Transport Protocols
  { topic: "transport-protocols", keyword: "quic", label: "QUIC" },
  { topic: "transport-protocols", keyword: "tcp", label: "TCP" },
  { topic: "transport-protocols", keyword: "mptcp|multipath tcp", label: "MPTCP" },
  { topic: "transport-protocols", keyword: "http3|http/3", label: "HTTP/3" },
  { topic: "transport-protocols", keyword: "packet loss|rtt|throughput", label: "Transport Performance" },

  // SDN/NFV
  { topic: "sdn-nfv", keyword: "sdn|software.defined", label: "SDN" },
  { topic: "sdn-nfv", keyword: "openflow|p4|programmable", label: "P4/OpenFlow" },
  { topic: "sdn-nfv", keyword: "nfv|network function virtualization", label: "NFV" },
  { topic: "sdn-nfv", keyword: "network slicing", label: "Network Slicing" },
  { topic: "sdn-nfv", keyword: "service mesh|istio", label: "Service Mesh" },

  // eBPF/XDP
  { topic: "ebpf-xdp", keyword: "ebpf", label: "eBPF" },
  { topic: "ebpf-xdp", keyword: "xdp", label: "XDP" },
  { topic: "ebpf-xdp", keyword: "bpf", label: "BPF" },

  // ML/AI
  { topic: "machine-learning", keyword: "llm|large language model", label: "LLM" },
  { topic: "machine-learning", keyword: "foundation model", label: "Foundation Model" },
  { topic: "machine-learning", keyword: "transformer", label: "Transformer" },
  { topic: "machine-learning", keyword: "reinforcement learning|rl", label: "Reinforcement Learning" },
  { topic: "machine-learning", keyword: "federated learning", label: "Federated Learning" },
  { topic: "machine-learning", keyword: "deep learning|dnn|neural network", label: "Deep Learning" },
  { topic: "machine-learning", keyword: "graph neural|gnn", label: "Graph Neural Net" },
  { topic: "machine-learning", keyword: "few.shot|zero.shot", label: "Few/Zero Shot" },
  { topic: "machine-learning", keyword: "fine.tuning|instruction tuning", label: "Fine-tuning" },

  // Network AI
  { topic: "network-ai", keyword: "rl.*network|network.*rl", label: "RL for Networks" },
  { topic: "network-ai", keyword: "ml.*network|network.*ml", label: "ML for Networks" },
  { topic: "network-ai", keyword: "ai.*ran|ai.*radio|ai.*access", label: "AI for RAN" },
  { topic: "network-ai", keyword: "intent.based|autonomous network|self.driving", label: "Autonomous Net" },

  // Security
  { topic: "ddos-defense", keyword: "ddos|dos attack", label: "DDoS" },
  { topic: "protocol-security", keyword: "tls|ssl|encrypt|vpn|ipsec", label: "Encryption/VPN" },
  { topic: "protocol-security", keyword: "zero trust", label: "Zero Trust" },
  { topic: "privacy-anonymity", keyword: "privacy.*(preserv|protect|enhanc)", label: "Privacy" },
  { topic: "privacy-anonymity", keyword: "differential privacy", label: "Differential Privacy" },
  { topic: "side-channels", keyword: "side channel|spectre|meltdown", label: "Side Channel" },
  { topic: "zero-trust", keyword: "zero trust|sase|sse", label: "Zero Trust/SASE" },

  // Edge
  { topic: "edge-computing", keyword: "mobile edge|mec|multi.access edge", label: "MEC" },
  { topic: "edge-computing", keyword: "fog computing", label: "Fog Computing" },
  { topic: "edge-computing", keyword: "edge.*inference|edge.*ai|edge.ai", label: "Edge AI" },

  // 5G/6G
  { topic: "5g-6g", keyword: "5g", label: "5G" },
  { topic: "5g-6g", keyword: "6g", label: "6G" },
  { topic: "5g-6g", keyword: "open ran|oran", label: "Open RAN" },
  { topic: "5g-6g", keyword: "massive mimo|beamforming", label: "Massive MIMO" },

  // Satellite
  { topic: "satellite-leo", keyword: "starlink|low.earth|leo", label: "LEO/Satellite" },
  { topic: "satellite-leo", keyword: "satellite.*network", label: "Satellite Net" },

  // Cloud
  { topic: "cloud-infra", keyword: "kubernetes|k8s|container", label: "Kubernetes" },
  { topic: "cloud-infra", keyword: "serverless", label: "Serverless" },
  { topic: "cloud-infra", keyword: "service mesh", label: "Service Mesh" },
  { topic: "cloud-infra", keyword: "cloud native", label: "Cloud Native" },

  // High Speed
  { topic: "high-speed-networking", keyword: "400g|800g|1.6t", label: "High-Speed Ethernet" },
  { topic: "high-speed-networking", keyword: "silicon photonics|optical", label: "Optical/SiPh" },
  { topic: "high-speed-networking", keyword: "dwdm|flex.grid", label: "Optical Transport" },

  // Programmable
  { topic: "programmable-net", keyword: "p4|programmable.*switch", label: "P4" },
  { topic: "programmable-net", keyword: "smartnic|dpu|ipu", label: "SmartNIC/DPU" },

  // Distributed
  { topic: "distributed-sys", keyword: "consensus|raft|paxos", label: "Consensus" },
  { topic: "distributed-sys", keyword: "blockchain", label: "Blockchain" },

  // Observability
  { topic: "network-observability", keyword: "opentelemetry|tracing", label: "Observability" },
  { topic: "network-monitoring", keyword: "telemetry", label: "Telemetry" },
  { topic: "internet-measure", keyword: "rtt.*measure|bandwidth.*estim|active probe", label: "Net Measurement" },

  // Automation
  { topic: "automation", keyword: "intent.based|closed.loop|automation", label: "Net Automation" },

  // DNS/BGP
  { topic: "dns-bgp", keyword: "bgp", label: "BGP" },
  { topic: "dns-bgp", keyword: "dns", label: "DNS" },
  { topic: "dns-bgp", keyword: "anycast", label: "Anycast" },
];
