# **Karasu-Express：系统架构设计文档 (System Architecture)**

## **1\. 架构总览与设计哲学**

### **1.1 核心理念：Unified Architecture (统一架构)**

鉴于 Karasu-Express 需要处理长耗时、高并发的 AI 生成任务，传统的架构往往会引入 Redis 队列、Celery 甚至 Temporal 等外部编排引擎。然而，为了降低基础设施的维护成本，简化部署流程，并保持数据的强一致性，本系统采用 **MongoDB Native (原生)** 架构。  
**设计原则：**

* **去中间件化 (No External Queue):** 移除 Redis、RabbitMQ 等额外的消息队列组件。所有的业务数据、任务状态、锁机制全部统一存储在 MongoDB 中。  
* **单一事实来源 (Single Source of Truth):** 任务的“当前状态”与“业务数据”存储在同一个文档中，消除了队列状态与数据库状态不一致的风险。  
* **原子性保障:** 利用 MongoDB 强大的原子操作指令（Atomic Operators）来实现高可靠的任务分发。

## ---

**2\. 技术栈选型 (Technology Stack)**

### **2.1 核心应用框架：PayloadCMS v3**

* **选型：** PayloadCMS v3 (基于 Next.js App Router)。  
* **决策依据：**  
  * **Next.js 原生集成:** v3 版本彻底重构为 Next.js 原生应用。这意味着我们可以在 Admin Panel 中直接使用 **React Server Components (RSC)**，通过 Local API 直接在服务器端查询数据库并渲染 UI，无需经过 HTTP 层，极大提升了首屏加载性能。  
  * **Code-First 配置:** 所有的集合（Collections）和字段验证逻辑均通过 TypeScript 定义。这使得核心业务逻辑（如复杂的 Prompt 拼接规则）可以被 Git 版本控制，利于团队协作和回滚。  
  * **深度可扩展性:** Payload 允许通过 React 组件完全替换默认的 Dashboard 和 List View，这对于实现我们需要的“瀑布流画廊”和“实时进度监控”至关重要。

### **2.2 数据库：MongoDB**

* **选型：** MongoDB (配合 @payloadcms/db-mongodb 适配器)。  
* **决策依据：**  
  * **Schema Flexibility (无模式/弱模式):** AI 模型迭代极快，参数各异（如 Flux 需要 guidance\_scale，Veo 需要 duration）。MongoDB 的文档模型允许我们在 api\_payload 字段中存储任意结构的 JSON 对象，无需为每个新模型执行繁琐的数据库迁移 (Schema Migration)。  
  * **原生队列能力:** MongoDB 的 findOneAndUpdate 操作具有原子性，是实现“数据库即队列”模式的基石。  
  * **高并发写入:** 批量生成任务（如一次提交触发 500 个子任务）会瞬间产生大量写入请求，MongoDB 在处理高频日志式写入方面表现优异。

### **2.3 样式系统：TailwindCSS**

* **选型：** TailwindCSS (Scoped / 作用域隔离)。  
* **决策依据：**  
  * **开发效率:** 原子化 CSS 能够显著加速自定义 Admin 组件（如进度条、配置卡片）的开发。  
  * **样式隔离策略:** Payload Admin 自带一套基于 Material/SCSS 的样式体系。为了防止 Tailwind 的 Preflight（全局样式重置）破坏原生界面，我们将采用 **CSS Scoping** 策略。所有自定义组件将包裹在特有的类名（如 .twp）中，通过 PostCSS 配置确保 Tailwind 样式仅在作用域内生效。

## ---

**3\. 核心架构：基于 MongoDB 的原生异步编排**

本系统不依赖 Redis，而是构建了一个高可靠的 **"Database-as-a-Queue"** 引擎。

### **3.1 系统拓扑与服务分层**

后端服务在逻辑上分为两层，物理上共享同一个 MongoDB 集群：

1. **API 服务 (Producer / Next.js):**  
   * 负责处理用户 HTTP 请求、鉴权、Prompt 优化（同步调用 LLM）。  
   * **职责：** 计算裂变逻辑，将拆解后的 N 个子任务批量插入 MongoDB，初始状态设为 PENDING。  
2. **Worker 服务 (Consumer / Standalone Node.js):**  
   * 简单的队列服务，定时扫描，从数据库拿取任务，放进队列末尾。  
   * **职责：** 轮询数据库，领取任务，调用 AI 供应商 API，回写结果。

### **3.2 任务分发机制：原子锁 (Atomic Locking)**

Worker 通过“抢占”数据库记录来获取任务。  
**工作流程：**

1. **轮询 (Smart Polling):** Worker 每隔短时间（如 500ms）扫描 sub\_tasks 集合。  
2. **原子抢占:** 使用 findOneAndUpdate 指令查找并锁定任务。这个操作在 MongoDB 端是原子性的，确保即便有 50 个 Worker 同时请求，也只有一个能拿到同一个任务。  
   JavaScript  
   // 伪代码示例：寻找一个未处理的任务，并将其标记为"处理中"，同时打上当前 Worker 的标记  
   const task \= await db.collection('sub\_tasks').findOneAndUpdate(  
     {   
       status: 'PENDING',  
       // 确保任务没有被其他 Worker 锁定（或锁已过期）  
       $or:  
     },   
     {   
       $set: {   
         status: 'PROCESSING',   
         worker\_id: currentWorkerId,   
         started\_at: new Date(),  
         lock\_expires\_at: new Date(Date.now() \+ 5 \* 60 \* 1000\) // 5分钟锁过期  
       }   
     },  
     { sort: { priority: \-1, created\_at: 1 } } // 优先处理老任务  
   );

3. **执行与回写:** Worker 拿到任务后，执行耗时的 API 调用。完成后，将结果 URL 更新回该文档，并将状态置为 COMPLETED。

### **3.3 高可靠性与自愈机制 (Self-Healing)**

由于没有传统队列的 ACK 机制，我们需要在应用层实现可靠性保障。

* **僵尸任务复活 (Zombie Task Recovery):**  
  * **场景:** 如果一个 Worker 在处理任务途中崩溃（OOM 或断电），该任务的状态会一直停留在 PROCESSING，导致任务“丢失”。  
  * **对策:** lock\_expires\_at 字段起到了“死信队列”的作用。任何 Worker（或专门的 Janitor 进程）在轮询时，都可以“抢走”那些虽然状态是 PROCESSING 但锁时间已过期的任务，将其重置并重新执行。  
* **速率限制 (Rate Limiting) 的实现:**  
  * **场景:** 防止对 AI 供应商（如 Fal.ai）发起过多并发请求导致 429 错误。  
  * **对策:** 采用 **Worker 容量控制**。由于每个 Worker 是串行处理任务的（取一个 \-\> 做完 \-\> 再取下一个），我们只需控制 Worker 容器的总数量，即可物理地限制最大并发数。例如，部署 10 个 Worker 容器，则全系统对他方 API 的并发请求永远不会超过 10 个。

## ---

**4\. 扩展性与未来规划**

该架构通过**去中心化**和**依赖简化**，具备极强的水平扩展能力：

* **增加吞吐量:** 只需增加 Worker 容器的数量。  
* **多模型支持:** MongoDB 的 Schema-less 特性允许我们随时接入新的 AI 模型（如视频生成），只需在 request\_payload 中存入新的 JSON 结构，无需修改数据库表结构。