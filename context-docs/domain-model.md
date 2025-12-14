# **Karasu-Express：领域模型与数据结构设计**

## **1\. 核心实体关系图 (ERD Concept)**

Code snippet

erDiagram  
    Project |

|--|{ Task : "包含"  
    Task |

|--|{ SubTask : "拆解为"  
    SubTask |

|--|{ Asset : "产出"  
    Task }|--|{ StyleTemplate : "应用"  
    SubTask }|--|

| ModelConfig : "使用"

## **2\. 集合定义 (Collections Definition)**

### **2.1 Tasks (父任务/聚合根)**

Slug: tasks  
描述: 记录用户的一次“命题”及其裂变配置。

| 字段名 | 类型 | 描述 | 示例值 |
| :---- | :---- | :---- | :---- |
| id | UUID | 主键 |  |
| subject | Text | 用户输入的原始主题 | "一只赛博朋克风格的猫" |
| expanded\_prompts | Array | LLM 优化后的提示词列表 | \[{ "subject": "cat", "prompt": "Cyberpunk cat...", "style":"comics", "final_prompt": "Cyberpunk cat of comics style..." }\] |
| styles | Array | 选用的风格模板 (多选) | \['ghibli-style', 'noir-style'\] |
| models | Array | 选用的模型 (多选) | \['flux-pro', 'dalle-3'\] |
| batch\_config | Group | 批次配置 | { "count\_per\_prompt": 4, "total\_expected": 240 } |
| status | Select | 聚合状态 | queued, processing, completed, partial\_failed |
| progress | Number | 完成百分比 (0-100) | 45 |

### **2.2 SubTasks (原子执行单元)**

Slug: sub-tasks  
描述: 实际发送给 AI 供应商的单次 API 请求任务。这是 Queue 的核心实体。

| 字段名 | 类型 | 描述 | 关键设计说明 |
| :---- | :---- | :---- | :---- |
| id | UUID | 主键 |  |
| parent\_task | Relationship | 关联父任务 |  |
| status | Select | 执行状态 | pending, processing, success, failed |
| locked\_by | Text | **锁机制**：当前 Worker ID | 用于原子锁，防止重复执行 |
| lock\_expires\_at | Date | **锁机制**：锁过期时间 | 用于僵尸任务复活 |
| style | Text | 选用的风格模板 | ghibli-style |
| model | Text | 选用的模型 | flux-pro |
| expanded\_prompt | Object | LLM 优化后的提示词 | \{ "subject": "cat", "prompt": "Cyberpunk cat...", "style":"comics", "final_prompt": "Cyberpunk cat of comics style..."|
| final\_prompt | Text | 最终拼接好的提示词 | "Cyberpunk cat, neon lights, 8k..." |
| request\_payload | **JSON** | **发送给 API 的完整 Body** | 见下方详细定义 (Schema-less) |
| response\_data | **JSON** | **API 返回的原始数据** | 见下方详细定义 |
| error\_log | Text | 错误堆栈/原因 | "429 Too Many Requests" |

### **2.3 Assets (数字资产)**

Slug: media (Payload Upload Collection)  
描述: 存储最终生成的图片/视频文件。

| 字段名 | 类型 | 描述 |
| :---- | :---- | :---- |
| url | Text | OSS 地址 |
| related\_subtask | Relationship | 来源子任务 |
| width | Number | 物理宽度 |
| height | Number | 物理高度 |
| file\_size | Number | 文件大小 |
| generation\_meta | JSON | 生成时的关键参数快照 |

## ---

**3\. 异构 API 数据结构标准 (Polymorphic Payload Design)**

为了兼容不同供应商，request\_payload 和 response\_data 字段在 MongoDB 中存储为 Mixed/JSON 类型。以下是针对各核心模型的**真实 API Schema 定义**。

### **3.1 Flux (Black Forest Labs / Fal.ai)**

**Provider ID:** flux-pro  
**Request Payload (存入 sub\_tasks.request\_payload)**

JSON

{  
  "prompt": "A cinematic shot of a cyberpunk cat...",  
  "image\_size": {  
    "width": 1024,  
    "height": 768  
  },  
  "num\_inference\_steps": 25,  
  "guidance\_scale": 3.5,  
  "seed": 89201384, // 可选，若为空则随机  
  "num\_images": 1,  
  "safety\_tolerance": "2"  
}

**Response Data (存入 sub\_tasks.response\_data)**

JSON

{  
  "images": \[  
    {  
      "url": "https://fal.media/files/monkey/123.png",  
      "width": 1024,  
      "height": 768,  
      "content\_type": "image/png"  
    }  
  \],  
  "timings": {  
    "inference": 1.25  
  },  
  "seed": 89201384, // 记录实际使用的 Seed  
  "has\_nsfw\_concepts": \[false\]  
}

### **3.2 DALL-E 3 (OpenAI)**

**Provider ID:** dalle-3  
**Request Payload**

JSON

{  
  "model": "dall-e-3",  
  "prompt": "A cyberpunk cat sitting on a neon roof",  
  "n": 1,  
  "size": "1024x1024",  
  "quality": "hd", // standard 或 hd  
  "style": "vivid", // vivid 或 natural  
  "response\_format": "b64\_json" // 推荐使用 b64 以避免 URL 过期问题，或者由后端转存 OSS  
}

**Response Data**

JSON

{  
  "created": 1700000000,  
  "data":  
}

### **3.3 Nano Banana (Google Imagen 3 via Vertex AI)**

**Provider ID:** imagen-3  
**Request Payload**

JSON

{  
  "instances": \[  
    {  
      "prompt": "A cyberpunk cat..."  
    }  
  \],  
  "parameters": {  
    "sampleCount": 1,  
    "aspectRatio": "16:9",  
    "safetySetting": "block\_some" // block\_few, block\_some, block\_most  
  }  
}

**Response Data**

JSON

{  
  "predictions":  
}

### **3.4 Veo (Google Veo via Vertex AI \- 视频生成)**

Provider ID: veo  
注意：视频生成通常是异步长任务，SubTask 需要额外的状态 polling。  
**Request Payload (Initial Request)**

JSON

{  
  "instances": \[  
    {  
      "prompt": "Cinematic drone shot of a cyberpunk city, 4k",  
      "image": { "gcsUri": "gs://..." } // 可选：图生视频  
    }  
  \],  
  "parameters": {  
    "storageUri": "gs://my-bucket/videos/", // 必须指定 GCS 输出路径  
    "negativePrompt": "blurry, low quality"  
  }  
}

**Response Data (Initial Response \- Operation Object)**

JSON

{  
  "name": "projects/123/locations/us-central1/publishers/google/models/veo/operations/987654321",  
  "metadata": {  
    "@type": "type.googleapis.com/google.cloud.aiplatform.v1.GenericOperationMetadata",  
    "state": "RUNNING",  
    "createTime": "2023-10-27T10:00:00Z"  
  }  
}

*Worker 需要轮询此 Operation 直到 state 变为 SUCCEEDED。*

## **4\. 数据库索引策略 (Indexing Strategy)**

为了支撑高并发的任务轮询（Polling），必须在 MongoDB 中建立以下索引：

1. **任务分发索引:**  
   * sub\_tasks 集合: { status: 1, created\_at: 1 }  
   * **用途:** Worker 查找最旧的 pending 任务。  
2. **僵尸任务检测索引:**  
   * sub\_tasks 集合: { status: 1, lock\_expires\_at: 1 }  
   * **用途:** Janitor 进程查找状态为 processing 但 lock\_expires\_at 已过期的任务，将其重置。  
3. **用户查询索引:**  
   * tasks 集合: { user\_id: 1, created\_at: \-1 }  
   * **用途:** 用户查看自己的任务历史。