# **Karasu-Express：系统架构设计文档 (System Architecture)**

## **1\. 架构总览与设计哲学**

### **1.1 核心理念：Unified & Native (统一与原生)**

鉴于 Karasu-Express 需要处理长耗时、高并发的 AI 生成任务，传统的架构往往会引入 Redis 队列、Celery 等外部组件。然而，**PayloadCMS v3** 引入了原生的 **Jobs Queue** 系统，这使我们能够构建一个“零外部依赖”的异步架构。  
**设计原则：**

* **原生优先 (Payload Native):** 利用 Payload 内置的 Jobs 和 Workflows 模块来管理异步任务，避免重复造轮子（如手写 MongoDB 锁）。  
* **单一基础设施 (Infrastructure Minimalism):** 所有的业务数据、任务状态、执行日志全部统一存储在 MongoDB 中，无需维护 Redis 或消息中间件。  
* **声明式配置:** 任务的定义、重试策略、并发限制全部在 payload.config.ts 中声明，代码即文档。

## ---

**2\. 技术栈选型 (Technology Stack)**

### **2.1 核心应用框架：PayloadCMS v3**

* **选型：** PayloadCMS v3 (Next.js App Router Native)。  
* **决策依据：**  
  * **Native Jobs Queue (关键特性):** v3 版本内置了基于数据库的持久化队列。它支持任务重试、cron 调度、工作流编排，并且直接在 Admin 面板中提供了可视化的任务状态管理（Pending, Running, Failed）。  
  * **Server Components 集成:** 可以在 Server Action 中直接调用 payload.jobs.queue()，极大地简化了前后端交互逻辑。  
  * **深度可扩展性:** 允许通过 React 组件替换 Dashboard，实现自定义的“生成任务监控台”。

### **2.2 数据库：MongoDB**

* **选型：** MongoDB (配合 @payloadcms/db-mongodb 适配器)。  
* **决策依据：**  
  * **Native Jobs 后端:** Payload 的队列系统默认使用当前连接的数据库。MongoDB 的文档模型非常适合存储异构的任务 Payload（如不同 AI 模型的参数配置）。  
  * **高并发写入:** 批量生成任务（如一次提交触发 500 个子任务）会产生大量状态更新，MongoDB 的性能足以支撑。

### **2.3 样式系统：TailwindCSS**

* **选型：** TailwindCSS (Scoped / 作用域隔离)。  
* **决策依据：**  
  * **样式隔离策略:** 使用 .twp (Tailwind Payload) 类名包裹自定义组件，防止 Tailwind 的 Preflight 破坏 Payload Admin 的原生 Material 风格。

## ---

**3\. 核心架构：Payload Native Jobs 异步编排**

本架构利用 Payload 的 Jobs 功能实现任务的分发与执行，无需编写底层的轮询代码。

### **3.1 任务模型设计**

系统定义两种核心 Job 类型，对应业务的两个阶段：

#### **A. expand-prompt (任务类型: Task)**

* **职责:** 调用 LLM (Claude/GPT) 对用户输入的主题进行语义扩充。  
* **触发:** 用户在前端提交表单时触发。  
* **输出:** 生成 N 个语义描述，并触发后续的裂变逻辑。

#### **B. generate-image (任务类型: Task)**

* **职责:** 调用图像生成 API (Flux/Nano Banana)。  
* **触发:** 由 expand-prompt 完成后自动裂变生成，或用户手动点击“生成”触发。  
* **特性:** 这是一个**高并发、易失败**的任务，需要严格的并发控制和重试机制。

### **3.2 队列配置与并发控制 (Rate Limiting)**

为了防止对 AI 供应商（如 Fal.ai）发起过多请求导致 429 错误，我们在 payload.config.ts 中定义专用队列并设置 limit。

TypeScript

// payload.config.ts  
export default buildConfig({  
  jobs: {  
    // 自动运行配置 (The Runner)  
    autoRun:,  
    tasks:, // 强类型输入定义  
        handler: async ({ input, req }) \=\> {  
          // 调用 AI API...  
        },  
        retries: 3, // 原生支持：失败自动重试 3 次  
      }  
    \],  
  },  
})

### **3.3 任务流转全景图**

1. **提交 (Producer):**  
   * Next.js Server Action 调用 payload.jobs.queue({ task: 'expand-prompt',... })。  
   * 任务被写入 MongoDB 的 payload-jobs 集合，状态为 queued。  
2. **执行 (Consumer/Runner):**  
   * **开发环境:** Next.js 主进程中的 autoRun 自动轮询并执行任务。  
   * **生产环境:** 推荐启动一个独立的 Worker 进程（payload jobs:run），专门处理后台任务，避免阻塞 Web 请求。  
3. **裂变逻辑 (The Fan-out):**  
   * expand-prompt 任务执行成功后，其 Handler 内部会循环调用 payload.jobs.queue()，将拆解后的几十个 generate-image 任务推入 ai-generation 队列。  
4. **状态反馈:**  
   * Admin 面板可以直接查看 payload-jobs 集合（需配置 admin: { hidden: false }），实时监控任务进度、查看报错日志。

## ---

**4\. 生产环境部署建议**

为了保证稳定性，建议将 Web 服务与 Worker 服务分离：

| 服务组件 | 运行命令 | 职责 | 资源配置 |
| :---- | :---- | :---- | :---- |
| **Web Server** | next start | 处理 HTTP 请求，Admin 界面交互。 | CPU: 1核, RAM: 1GB |
| **Worker** | payload jobs:run | 专门运行 Jobs 队列，处理耗时的 AI 生成。 | CPU: 2核\+, RAM: 2GB |

* **优势:** 如果 AI 生成任务因处理大图导致内存溢出（OOM），只会导致 Worker 重启，不会影响前台用户的访问。  
* **扩容:** 如果生成任务积压，只需增加 **Worker** 容器的数量即可水平扩展处理能力。

## ---

**5\. 总结**

采用 **Payload Native Jobs** 是本项目的最优解。它在保持架构“简单”的同时（无需引入 Redis），提供了企业级所需的特性：

1. **可靠性:** 任务持久化存储，不丢失。  
2. **流控:** 通过配置 limit 轻松实现 API 速率限制。  
3. **可观测性:** 直接复用 CMS 后台查看任务日志。