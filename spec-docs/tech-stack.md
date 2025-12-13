# **Karasu-Express：技术架构决策备忘录**

## **1\. 核心应用框架：PayloadCMS v3**

### **选型决策**

采用 **PayloadCMS v3**（Next.js App Router Native）。

### **决策依据**

1. **Headless \+ Admin UI 一体化:** 我们需要一个现成的、高质量的后台管理界面（Admin Panel）来管理 Prompt、Users 和 Assets，但又需要极高的定制能力（如复杂的“提示词裂变”表单）。Payload 提供了开箱即用的 CMS 功能，同时允许完全替换 React 组件。  
2. **Server Components (RSC) 支持:** v3 版本基于 Next.js App Router。在构建“任务详情页”时，我们可以直接在 Server Component 中查询数据库并渲染 HTML，无需编写繁琐的 API 序列化逻辑，极大提升首屏加载速度。  
3. **Code-First 配置:** 所有的 Collection（集合）和 Field（字段）定义都是 TypeScript 代码。这意味着我们的业务逻辑（如提示词模板结构）可以被 Git 版本控制，利于团队协作和回滚。

## **2\. 数据库：MongoDB**

### **选型决策**

采用 **MongoDB** (配合 Mongoose Adapter)。

### **决策依据**

1. **处理异构元数据 (Schema Flexibility):**  
   * **核心痛点:** AI 模型迭代极快，且参数各异。Flux 模型需要 guidance\_scale，DALL-E 3 需要 quality，Veo 视频模型需要 duration。  
   * **解决方案:** MongoDB 的文档模型允许我们在 api\_payload 字段中存储任意结构的 JSON 对象，无需为每个新模型的参数修改数据库表结构（Schema Migration）。  
2. **原生原子操作 (Atomic Operations):**  
   * 利用 findOneAndUpdate 实现 **Database-as-a-Queue** 模式。我们可以原子性地锁定一条 pending 状态的子任务并将其标记为 processing，从而在不引入 Redis/RabbitMQ 的情况下实现高可靠的异步任务分发。  
3. **高并发写入:** 批量生成任务会瞬间产生大量写入请求（日志、状态更新），MongoDB 在写入性能上表现优异。

## **3\. 样式系统：TailwindCSS**

### **选型决策**

采用 **TailwindCSS** (Scoped)。

### **决策依据**

1. **开发效率:** 原子化 CSS 极大加速了自定义 Admin 组件（如进度条、配置卡片）的开发。  
2. **样式隔离 (关键策略):** Payload Admin 自带基于 Material/SCSS 的样式。为了避免冲突，我们将使用 **CSS Scoping** 策略（如 .twp 类名包裹），确保 Tailwind 样式仅在自定义组件内部生效，不破坏 CMS 原生布局。