# **Karasu-Express：企业级 AI 内容生成与资产管理系统深度产品设计报告 (PRD)**

## **1\. 执行摘要与战略愿景**

### **1.1 项目背景与核心价值**

随着生成式人工智能（Generative AI）技术的爆炸式增长，企业内容生产方式正在经历从“手工作坊”向“智能工厂”的范式转移。然而，当前市场上的工具大多聚焦于单点生成能力（如单张图片的精修），缺乏能够支撑大规模、标准化、流线型生产的后台管理系统。  
**Karasu-Express** 旨在填补这一空白。作为一个专为高通量内容生产设计的 AI-Native CMS（内容管理系统），它不仅是一个工具集合，更是一个**生成式资产工厂**。其核心价值主张在于解决“创意意图”与“工业化产出”之间的矛盾：通过大语言模型（LLM）将抽象的创意“命题”转化为精确的工程化提示词（Prompt Engineering），结合多模型（Multi-Model）并行调度能力，实现指数级的内容裂变。  
对于运营团队而言，Karasu-Express 将内容生产的边际成本降至极低，能够快速响应小红书、微博等社交媒体的视觉需求；对于产品与设计团队，它提供了一个可控的实验场，通过结构化的风格配置与批量化测试，快速验证视觉方向。

### **1.2 系统定位与用户画像**

本系统定位于**企业级后台管理平台**，主要服务于以下核心用户角色：

* **内容运营专家（Content Operator）：** 需要根据营销日历，快速生成数百张符合特定主题（如“赛博朋克风街头美食”）的插画或壁纸，用于多渠道分发。  
* **提示词工程师（Prompt Engineer）：** 负责维护系统的“风格库”与“提示词模板”，确保生成的资产符合品牌调性。  
* **产品经理/设计总监：** 利用系统的批量生成能力进行 A/B 测试，决策最终的视觉风格。

### **1.3 核心功能概览**

Karasu-Express 的核心逻辑链条为：**意图输入 \-\> 智能扩充 \-\> 组合裂变 \-\> 异步生产 \-\> 资产沉淀**。

* **基建层：** 集成全球顶尖的 LLM（Gemini, ChatGPT, Claude, DeepSeek）与生成模型（Nano Banana, DALL-E 3, Flux, Veo3）。  
* **逻辑层：** 独创的“组合裂变算法”，支持 提示词 x 风格 x 模型 x 批次 的四维乘法生成。  
* **表现层：** 标准化的 CMS 界面，左侧导航与右侧详情的经典布局，结合高性能的瀑布流资产管理。

## ---

**2\. 产品架构与功能矩阵**

### **2.1 系统架构设计原则**

本系统采用**微服务化**与**异步编排**相结合的架构设计，以应对生成式 AI 任务的长耗时与高并发特性。

* **控制平面（CMS Dashboard）：** 负责用户交互、任务配置、资产预览与权限管理。  
* **编排平面（Orchestration Engine）：** 负责处理复杂的任务分发、重试机制与状态管理 1。  
* **计算平面（Model Gateway）：** 统一的 API 网关，屏蔽不同供应商（OpenAI, Google, Fal.ai）的接口差异，实现模型的即插即用。

### **2.2 功能模块矩阵**

| 模块域 | 功能点 | 优先级 | 详细描述 | 关键技术引用 |
| :---- | :---- | :---- | :---- | :---- |
| **工作台 (Studio)** | 命题输入 | P0 | 支持多行文本输入，作为生成的种子意图。 |  |
|  | 智能提示词优化 | P0 | 利用 LLM 将简短命题转化为高质量 Prompt。支持 RAG 联网搜索增强。 | 3 |
|  | 风格配置器 | P0 | 可视化选择风格预设（JSON 模板），支持多选与“Base”基准风格。 | 5 |
|  | 模型矩阵选择 | P0 | 多选生成模型（Flux, Nano Banana 等），支持异构参数配置。 | 6 |
|  | 裂变计算器 | P0 | 实时计算 Prompt \* Style \* Model \* Batch 的总任务量。 |  |
| **任务引擎 (Task)** | 异步调度 | P0 | 处理大规模并发请求，管理 API 速率限制（Rate Limiting）。 | 8 |
|  | 资源命名规范 | P0 | 自动化 OSS 上传与命名：image\_{ts}\_{subject}\_{style}\_{model}\_{id}.ext。 |  |
| **资产管理 (Asset)** | 任务列表 | P0 | 分页展示父任务状态，支持状态过滤（进行中/已完成/失败）。 |  |
|  | 任务详情 | P0 | 透视子任务执行日志，展示生成参数快照。 |  |
|  | 画廊视图 | P0 | 高性能 Masonry 瀑布流布局，支持批量下载。 | 10 |
| **扩展能力** | 视频生成预埋 | P1 | 针对 Veo3 等视频模型的接口预留与 UI 适配。 | 12 |

## ---

**3\. 核心功能详解：智能生成工作台 (Studio)**

工作台是 Karasu-Express 的心脏，其设计目标是让复杂的参数配置变得直观且可控。我们摒弃了传统的“填表式”生成，转而采用**流程式（Pipeline）** 交互设计。

### **3.1 阶段一：意图解析与提示词工程**

用户的第一步操作是输入一个“主题（Subject）”。这往往是抽象的，例如“一只在雨中哭泣的猫”。系统需要通过 LLM 将其工程化。

#### **3.1.1 智能优化的逻辑**

系统将调用 LLM（如 GPT-4o 或 Claude 3.5 Sonnet）作为“提示词专家代理”。

* **元提示词（Meta-Prompting）策略：** 我们在后台预埋了一套复杂的 System Prompt 14，指示 LLM 不仅要翻译主题，还要从构图、光影、材质等维度进行扩充。  
* **用户可选项 \- 联网搜索增强（RAG）：**  
  * **场景：** 用户输入“黑神话悟空风格”。如果模型知识库较旧，可能无法理解。  
  * **机制：** 勾选“联网搜索”后，系统首先调用搜索引擎 API 获取该主题的最新视觉描述（如“暗黑神话”、“中式甲胄”、“高精细度毛发”），然后将这些上下文（Context）注入给 LLM 3。这确保了生成的提示词紧跟流行趋势（Trending）。  
* **输出规范：** LLM 必须返回严格的 JSON 格式，包含用户指定的 N 个版本的提示词（例如 3 个变体：写实版、抽象版、艺术版）。

#### **3.1.2 风格化矩阵（Style Matrix）**

除了 LLM 生成的文本描述，**风格（Style）** 是另一个维度的控制变量。

* **本地风格库架构：** 我们采用类似 SDXL Prompt Styler 的架构 5。每个风格本质上是一个 JSON 模板：  
  JSON  
  {  
      "style\_id": "anime\_ghibli",  
      "name": "吉卜力动画风",  
      "positive\_prompt": "{prompt}, studio ghibli style, cel shaded, vibrant colors, hayao miyazaki",  
      "negative\_prompt": "3d render, realistic, photorealistic, low quality"  
  }

* **组合逻辑：** 用户在界面上多选风格（例如选择了“吉卜力”和“赛博朋克”）。系统会强制包含一个 Base 风格（即不做任何修饰的原 Prompt），确保用户能看到 LLM 原始理解的效果。

### **3.2 阶段二：生产参数配置**

在确定了“画什么”（Prompt）和“什么风格”（Style）后，用户需要定义“怎么画”。

#### **3.2.1 模型选择与异构参数**

系统支持多模型并行生成。由于不同供应商的 API 参数存在差异，前端需要动态适配：

* **Nano Banana (Google Imagen):** 擅长语义理解与文字渲染 7。参数侧重于 aspectRatio (16:9, 9:16) 17。  
* **Flux (Fal.ai/Replicate):** 当前开源界的画质巅峰，擅长光影与构图。参数侧重于 num\_inference\_steps 和 guidance\_scale 6。  
* **DALL-E 3 (OpenAI):** 擅长遵循复杂指令。参数较少，主要是 size 和 quality 19。

配置 UI： 用户可以勾选多个模型。例如，同时勾选 Nano Banana 和 Flux，以此对比不同基座模型的表现力。  
分辨率与比例： 提供通用选项（1:1, 16:9, 9:16, 4:3），后台根据模型能力自动映射到具体的像素值（如 Flux 支持非标分辨率，而 DALL-E 3 仅支持标准分辨率）。

#### **3.2.2 裂变算法与批次控制**

这是 Karasu-Express 最具核心竞争力的逻辑——乘法裂变。  
传统的生成工具是一次生成一张或一组。Karasu-Express 是一次生成一个矩阵。  
最终数量计算公式：

$$Total\\\_Tasks \= (N\_{prompts}) \\times (N\_{styles}) \\times (N\_{models}) \\times (Size\_{batch})$$  
**案例推演：**

1. **用户输入主题：** "赛博朋克猫"。  
2. **LLM 优化：** 用户要求生成 **3** 个版本的提示词（V1: 街头流浪猫; V2: 高科技宠物猫; V3: 机甲战士猫）。 \-\> $N\_{prompts} \= 3$  
3. **风格选择：** 用户选择了 **4** 个风格（Base, 胶片感, 3D 渲染, 浮世绘）。 \-\> $N\_{styles} \= 4$  
4. **模型选择：** 用户勾选了 **2** 个模型（Nano Banana, Flux）。 \-\> $N\_{models} \= 2$  
5. **生成批次（Batch Size）：** 用户希望每个组合生成 **10** 张图以供筛选。 \-\> $Size\_{batch} \= 10$

计算结果：

$$3 \\times 4 \\times 2 \\times 10 \= 240 \\text{ 张图片}$$  
系统界面必须实时显示这个计算结果，并在数字过大（如超过 500）时给予成本预警。

### **3.3 阶段三：工作流执行与 OSS 归档**

用户点击“提交任务”后，前端并不等待结果，而是将一个巨大的任务包发送给后端。

#### **3.3.1 子任务（Sub-task）定义**

为了系统的健壮性，我们将庞大的父任务拆解为原子化的**子任务**。

* **原子定义：** 1 个最终提示词（由 LLM Prompt \+ Style Template 组合而成） \+ 1 个模型调用 \= 1 个子任务。  
* **Batch Size 处理：** 如果模型 API 支持原生 Batch（如 OpenAI 的 n 参数），则该子任务一次请求生成 N 张；如果不支持（如某些 Flux API），则后端需要循环调用 N 次。

#### **3.3.2 统一命名与存储规范**

为了方便后续的数据治理，所有生成的资源必须遵循严格的命名约定并上传至对象存储（OSS，如 AWS S3 或 Aliyun OSS）。  
命名格式：  
image\_{timestamp}\_{subject\_slug}\_{style\_id}\_{model\_id}\_{index}.{ext}

* timestamp: 精确到秒，保证排序。  
* subject\_slug: 主题的英文缩写（由 LLM 顺便生成），如 cyberpunk-cat，便于文件系统检索。  
* style\_id: 如 ghibli，便于识别风格。  
* model\_id: 如 flux-pro，便于识别来源模型。  
* index: 批次序号（01-10）。

这种命名方式使得即使脱离了 CMS 数据库，运营人员直接在 OSS Bucket 中也能通过文件名快速定位资源 20。

## ---

**4\. 详细页面结构与交互设计 (UI/UX)**

系统采用标准的 CMS 布局，旨在提供沉浸式的操作体验与高效的信息获取。

### **4.1 全局导航设计 (Navbar)**

左侧导航栏宽度固定（240px），深色背景以突显专业感。

* **Dashboard（概览）：** 展示今日生成量、消耗 Token 数、最新热门风格。  
* **Studio（创作）：** 核心生成入口，包含“图片生成”与“视频生成（灰度）”子菜单。  
* **Task Manager（任务管理）：** 任务队列与历史记录。  
* **Asset Library（资源库）：** 全局资产检索与管理。  
* **Config Center（配置中心）：** 模型 API Key 管理、风格模板编辑、费率设置。

### **4.2 任务管理界面设计**

由于任务是异步执行的，任务管理界面是用户回溯工作的核心。

#### **4.2.1 任务列表页 (Task List)**

* **展示项：** 任务 ID、项目名（Subject）、创建时间、总进度条（例如：200/240 \[83%\]）、状态标签（进行中/已完成/部分失败）。  
* **操作：** 查看详情、重新运行（Retry）、删除。  
* **交互细节：** 进度条应通过 WebSocket 或轮询实时更新，给予用户掌控感。

#### **4.2.2 任务详情页 (Task Detail)**

这是一个分栏设计的复杂页面：

* **顶部信息栏：** 展示该任务的“配置快照”——使用了哪些 Prompt、哪些风格、哪个模型、分辨率设置等。这是为了方便用户复盘“什么样的参数配置产出了好图” 22。  
* **子任务列表区（左下）：** 一个紧凑的表格，列出所有拆解后的原子任务。  
  * 列：风格 | 模型 | 耗时 | 状态 | 日志。  
  * **日志功能：** 点击某个子任务，可查看 API 的原始响应。如果失败，显示具体的错误码（如 Rate Limit Exceeded 或 NSFW Content）。这对于排查模型供应商的不稳定性至关重要。  
* **结果画廊区（右下）：** 占据主要视觉区域，展示该任务下生成的所有图片。

### **4.3 资产画廊与查看器 (Gallery & Viewer)**

当一个任务生成了 240 张图片时，如何展示是一个巨大的 UX 挑战。我们不能简单地堆叠 \<img\> 标签。

#### **4.3.1 Masonry 瀑布流布局**

由于支持多种长宽比（16:9 和 9:16 混排），普通的网格布局会产生大量的空白间隙。必须采用 **Masonry（砌体/瀑布流）** 布局 10。

* **实现库：** 推荐使用 react-responsive-masonry 或 Masonic。  
* **虚拟滚动（Virtualization）：** 为了保证浏览器在加载上千张图片时不卡顿，必须引入虚拟滚动技术 24。仅渲染视口可见区域内的 DOM 节点，随着滚动动态回收和创建节点。

#### **4.3.2 图片详情灯箱 (Lightbox)**

点击缩略图进入大图查看模式：

* **元数据侧边栏：** 在大图旁显示该图生成的完整元数据 22：  
  * **Final Prompt:** LLM 优化后的完整提示词。  
  * **Negative Prompt:** 风格模板注入的负向词。  
  * **Seed:** 随机种子（用于复现）。  
  * **Guidance Scale / CFG:** 模型参数。  
* **操作：** “下载原图”、“一键发布到社交媒体（Mockup）”、“查看同批次其他图”。

## ---

**5\. 模型集成与供应商策略**

### **5.1 大语言模型 (LLM) 选型**

* **Prompt 优化主力：** 推荐使用 **Claude 3.5 Sonnet** 或 **GPT-4o**。它们在理解复杂指令和遵循 JSON 输出格式方面表现最佳 14。  
* **成本控制：** 对于简单的扩写，可切换至 **DeepSeek-V3** 或 **Gemini Flash**，成本极低且速度快 27。  
* **联网搜索能力：** 集成 Google Search API 或 Bing Search API，作为 Tool Use 挂载给 LLM，实现 RAG 流程 3。

### **5.2 图片生成模型选型与 API 分析**

* **Flux (via Fal.ai / Replicate):**  
  * **特点：** 目前最强的开源模型，指令遵循能力极强，支持文字渲染。  
  * **API 特性：** Fal.ai 提供了极速的推理接口，支持 sync 和 queue 两种模式。对于批量任务，建议使用 queue 模式配合 Webhook 回调，避免长连接超时 18。  
  * **计费：** 按 MegaPixel 或推理时间计费，需在后端做成本预估 18。  
* **Nano Banana (Google Imagen 3):**  
  * **特点：** Google 生态原生，速度极快（Flash 版本），擅长照片级真实感与文字嵌入 7。  
  * **API 特性：** 通过 Vertex AI 调用，返回结构通常包含 Base64 编码的图片数据，需要后端自行解码并上传 OSS 17。  
* **DALL-E 3 (OpenAI):**  
  * **特点：** 语义理解最强，但画质细节（尤其是皮肤纹理）略逊于 Flux，且有人物生成的严格审查。  
  * **API 特性：** 接口简单，但价格较贵，且速率限制（RPM）较严，必须配合速率限制器使用 19。

### **5.3 视频生成模型 (扩展性预研)**

尽管当前版本主要针对图片，但架构必须为 **Veo3** 做好准备。

* **Google Veo3:** 这是一个视频生成模型，API 响应结构与图片完全不同。  
* **交互差异：** 视频生成是长耗时操作（Long-Running Operation）。API 会立即返回一个 operation\_id，而不是视频内容。  
* **JSON 结构分析：** 根据 GitHub 上的非官方文档与 Vertex AI 文档 13，Veo3 的请求体包含 video 对象（用于视频生视频）或 prompt（文生视频），且响应需要轮询 projects/.../operations/{id} 接口。  
* **系统适配：** 我们的异步工作流引擎天然支持这种“发起请求 \-\> 休眠 \-\> 轮询状态”的模式，因此接入视频生成只需新增一种 Activity 类型即可。

## ---

**6\. 扩展性与未来规划**

### **6.1 从图片到视频的平滑过渡**

在数据库 assets 表中，我们将 asset\_type 设为枚举（IMAGE, VIDEO）。  
在前端 Studio 页面，当用户切换到“视频模式”时：

* **配置项变更：** 隐藏“生成批次”（视频通常单次生成），新增“时长（Duration）”选项（如 4s, 8s）12。  
* **预览变更：** 画廊中的 \<img /\> 标签替换为 \<video /\> 标签，并支持鼠标悬停预览。

### **6.2 社区化与风格市场**

未来可以将“风格配置”开放给用户 UGC。用户可以上传自己的 LoRA（Low-Rank Adaptation）或 Prompt 模板，形成企业内部的“风格市场”。这需要数据库支持更复杂的 styles 权限管理与版本控制。

### **6.3 数据闭环**

引入“点赞/评分”机制。用户在画廊中对满意的图片进行标记，系统将这些高质量图片及其 Prompt 回流（Feedback Loop），用于微调（Fine-tuning）企业专属的小模型，进一步提升生成的良率。

## ---

**7\. 总结**

Karasu-Express 的设计核心在于将 AI 的“随机性”关进“工程化”的笼子。通过结构化的 Prompt 工程、矩阵化的生成策略以及高可靠的异步编排架构，它能够帮助企业用户从繁琐的单点操作中解放出来，真正实现内容资产的规模化生产。本 PRD 文档涵盖了从用户交互到业务逻辑的完整设计，为开发团队提供了清晰的实施蓝图。

#### **Works cited**

1. Of course you can build dynamic AI agents with Temporal, accessed December 13, 2025, [https://temporal.io/blog/of-course-you-can-build-dynamic-ai-agents-with-temporal](https://temporal.io/blog/of-course-you-can-build-dynamic-ai-agents-with-temporal)  
2. Managing very long-running Workflows with Temporal, accessed December 13, 2025, [https://temporal.io/blog/very-long-running-workflows](https://temporal.io/blog/very-long-running-workflows)  
3. A Practical Guide to AI-Generated UI Design \- Magic Patterns, accessed December 13, 2025, [https://www.magicpatterns.com/blog/magic-patterns-a-practical-guide-to-ai-generated-ui-design](https://www.magicpatterns.com/blog/magic-patterns-a-practical-guide-to-ai-generated-ui-design)  
4. Prompt Design and Engineering: Introduction and Advanced Methods \- arXiv, accessed December 13, 2025, [https://arxiv.org/html/2401.14423v4](https://arxiv.org/html/2401.14423v4)  
5. twri/sdxl\_prompt\_styler: Custom prompt styler node for SDXL in ComfyUI \- GitHub, accessed December 13, 2025, [https://github.com/twri/sdxl\_prompt\_styler](https://github.com/twri/sdxl_prompt_styler)  
6. Pricing \- Replicate, accessed December 13, 2025, [https://replicate.com/pricing](https://replicate.com/pricing)  
7. Image generation with Gemini (aka Nano Banana & Nano Banana Pro) | Gemini API | Google AI for Developers, accessed December 13, 2025, [https://ai.google.dev/gemini-api/docs/image-generation](https://ai.google.dev/gemini-api/docs/image-generation)  
8. How to Design a Scalable Rate Limiting Algorithm with Kong API, accessed December 13, 2025, [https://konghq.com/blog/engineering/how-to-design-a-scalable-rate-limiting-algorithm](https://konghq.com/blog/engineering/how-to-design-a-scalable-rate-limiting-algorithm)  
9. Managing Actions per Second (APS) Limits in Temporal Cloud, accessed December 13, 2025, [https://docs.temporal.io/best-practices/managing-aps-limits](https://docs.temporal.io/best-practices/managing-aps-limits)  
10. Masonry, accessed December 13, 2025, [https://masonry.desandro.com/](https://masonry.desandro.com/)  
11. jaredLunde/masonic: High-performance masonry layouts for React \- GitHub, accessed December 13, 2025, [https://github.com/jaredLunde/masonic](https://github.com/jaredLunde/masonic)  
12. Veo on Vertex AI video generation API \- Google Cloud Documentation, accessed December 13, 2025, [https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation)  
13. How to correctly structure the 'video' object for Veo 3.1 endpoint? \- Stack Overflow, accessed December 13, 2025, [https://stackoverflow.com/questions/79796261/how-to-correctly-structure-the-video-object-for-veo-3-1-endpoint](https://stackoverflow.com/questions/79796261/how-to-correctly-structure-the-video-object-for-veo-3-1-endpoint)  
14. Prompt generation | OpenAI API, accessed December 13, 2025, [https://platform.openai.com/docs/guides/prompt-generation](https://platform.openai.com/docs/guides/prompt-generation)  
15. Enhance your prompts with meta prompting | OpenAI Cookbook, accessed December 13, 2025, [https://cookbook.openai.com/examples/enhance\_your\_prompts\_with\_meta\_prompting](https://cookbook.openai.com/examples/enhance_your_prompts_with_meta_prompting)  
16. SDXL Prompt Styler detailed guide | ComfyUI \- RunComfy, accessed December 13, 2025, [https://www.runcomfy.com/comfyui-nodes/sdxl\_prompt\_styler](https://www.runcomfy.com/comfyui-nodes/sdxl_prompt_styler)  
17. Gemini 2.5 Flash Image (Nano Banana) \- Google AI Studio, accessed December 13, 2025, [https://aistudio.google.com/models/gemini-2-5-flash-image](https://aistudio.google.com/models/gemini-2-5-flash-image)  
18. GenAI API Pricing: Haliuo, Vidu, Pixverse | Pay-Per-Use | fal.ai, accessed December 13, 2025, [https://fal.ai/pricing](https://fal.ai/pricing)  
19. DALL·E 3 Model | OpenAI API, accessed December 13, 2025, [https://platform.openai.com/docs/models/dall-e-3](https://platform.openai.com/docs/models/dall-e-3)  
20. How to Build Scalable Metadata Management for AI Object Storage \- CockroachDB, accessed December 13, 2025, [https://www.cockroachlabs.com/blog/scalable-metadata-management-ai-object-storage/](https://www.cockroachlabs.com/blog/scalable-metadata-management-ai-object-storage/)  
21. Database design for storing image metadata \- Reddit, accessed December 13, 2025, [https://www.reddit.com/r/Database/comments/1e961mb/database\_design\_for\_storing\_image\_metadata/](https://www.reddit.com/r/Database/comments/1e961mb/database_design_for_storing_image_metadata/)  
22. I made a simple image viewer that displays AI metadata (MaPic) : r/civitai \- Reddit, accessed December 13, 2025, [https://www.reddit.com/r/civitai/comments/1nk7lxu/i\_made\_a\_simple\_image\_viewer\_that\_displays\_ai/](https://www.reddit.com/r/civitai/comments/1nk7lxu/i_made_a_simple_image_viewer_that_displays_ai/)  
23. React Masonry component \- Material UI, accessed December 13, 2025, [https://mui.com/material-ui/react-masonry/](https://mui.com/material-ui/react-masonry/)  
24. Enhancing User Interfaces with AI Image Generation | by Bola Olaniyan \- Medium, accessed December 13, 2025, [https://medium.com/@bola.fig/enhancing-user-interfaces-with-ai-image-generation-a9c86b4b8896](https://medium.com/@bola.fig/enhancing-user-interfaces-with-ai-image-generation-a9c86b4b8896)  
25. UI virtualization | The Aurelia 2 Docs, accessed December 13, 2025, [https://docs.aurelia.io/developer-guides/ui-virtualization](https://docs.aurelia.io/developer-guides/ui-virtualization)  
26. Prompt Engineering Techniques | IBM, accessed December 13, 2025, [https://www.ibm.com/think/topics/prompt-engineering-techniques](https://www.ibm.com/think/topics/prompt-engineering-techniques)  
27. DeepSeek-R1 Release, accessed December 13, 2025, [https://api-docs.deepseek.com/news/news250120](https://api-docs.deepseek.com/news/news250120)  
28. DeepSeek Pricing: Models, How It Works, And Saving Tips \- CloudZero, accessed December 13, 2025, [https://www.cloudzero.com/blog/deepseek-pricing/](https://www.cloudzero.com/blog/deepseek-pricing/)  
29. Generative AI APIs | Run Img, 3D, Video AI Models 4x Faster | fal.ai, accessed December 13, 2025, [https://fal.ai/](https://fal.ai/)  
30. Introducing Nano Banana Pro \- Google Blog, accessed December 13, 2025, [https://blog.google/technology/ai/nano-banana-pro/](https://blog.google/technology/ai/nano-banana-pro/)  
31. Azure OpenAI Service \- Pricing, accessed December 13, 2025, [https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)  
32. snubroot/Veo-JSON \- GitHub, accessed December 13, 2025, [https://github.com/snubroot/Veo-JSON](https://github.com/snubroot/Veo-JSON)  
33. Generate videos with Veo 3.1 in Gemini API content\_copy \- Google AI for Developers, accessed December 13, 2025, [https://ai.google.dev/gemini-api/docs/video](https://ai.google.dev/gemini-api/docs/video)