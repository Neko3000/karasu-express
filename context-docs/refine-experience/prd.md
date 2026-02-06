# Karasu-Express: AI 内容生成与资产管理系统 - 产品需求文档 (PRD)

## 1. 执行摘要

### 1.1 项目背景与核心价值

**Karasu-Express** 是一个专为高通量内容生产设计的 AI-Native CMS（内容管理系统），旨在填补"创意意图"与"工业化产出"之间的空白。通过大语言模型（LLM）将抽象的创意主题转化为精确的工程化提示词，结合多模型（Multi-Model）并行调度能力，实现指数级的内容裂变。

**核心价值主张**：
- 将内容生产的边际成本降至极低
- 快速响应社交媒体的视觉需求
- 提供可控的实验场，通过结构化的风格配置与批量化测试，快速验证视觉方向

### 1.2 系统定位与用户画像

本系统定位于**企业级后台管理平台**，主要服务于以下核心用户角色：

| 角色 | 职责 | 核心需求 |
|------|------|----------|
| **内容运营专家** | 根据营销日历快速生成符合特定主题的插画/壁纸 | 批量生成、多渠道分发 |
| **提示词工程师** | 维护"风格库"与"提示词模板" | 风格管理、模板配置 |
| **产品经理/设计总监** | 利用批量生成能力进行 A/B 测试 | 多模型对比、质量筛选 |

### 1.3 技术栈

| 层级 | 技术选型 |
|------|----------|
| **框架** | PayloadCMS v3.68.3 + Next.js 15.4.9 (App Router) |
| **前端** | React 19.2.1 + TailwindCSS 4.1.18 (`.twp` 作用域前缀) |
| **UI 组件库** | shadcn/ui |
| **图标库** | Lucide React (via shadcn/ui) |
| **Gallery 组件** | LightGallery |
| **语言** | TypeScript 5.7.3 (严格模式) |
| **数据库** | MongoDB (via @payloadcms/db-mongodb) |
| **LLM 提示词优化** | Gemini 3 Flash Preview (主力) |
| **图像生成** | Flux (Fal.ai)、DALL-E 3 (OpenAI)、Nano Banana (Google AI) |

---

## 2. 已实现功能 (Phase 01-09)

以下功能已在 Phase 01-09 中完成开发和测试。

### 2.1 核心数据模型 (Phase 01-02)

#### Collections 集合

| 集合 | 描述 | 状态 |
|------|------|------|
| **Tasks** | 主任务集合，存储主题、扩展提示词、模型选择、风格选择、批量配置、状态和进度 | ✅ 已实现 |
| **SubTasks** | 子任务集合，每个子任务对应一次图像生成 API 调用 | ✅ 已实现 |
| **StyleTemplates** | 风格模板集合，支持 {prompt} 占位符替换 | ✅ 已实现 |
| **ModelConfigs** | AI 模型配置集合，包含速率限制和功能支持矩阵 | ✅ 已实现 |
| **Media** | 生成图像存储集合，PayloadCMS Upload 类型 | ✅ 已实现 |
| **Users** | 用户认证集合 | ✅ 已实现 |

#### 核心服务

| 服务 | 功能 | 状态 |
|------|------|------|
| **task-orchestrator** | 任务分裂算法：`N_prompts × N_styles × N_models × batch_size` | ✅ 已实现 |
| **style-merger** | 提示词与风格模板合并，支持 {prompt} 占位符替换 | ✅ 已实现 |
| **asset-manager** | 文件命名规范生成、Alt 文本生成 | ✅ 已实现 |
| **rate-limiter** | 按供应商的 API 速率限制 | ✅ 已实现 |
| **error-normalizer** | 错误分类与可重试标记 | ✅ 已实现 |

#### 图像生成适配器

| 适配器 | 供应商 | 模型变体 | 状态 |
|--------|--------|----------|------|
| **Flux** | Fal.ai | Pro, Dev, Schnell | ✅ 已实现 |
| **DALL-E 3** | OpenAI | Standard | ✅ 已实现 |
| **Nano Banana** | Google AI | Standard | ✅ 已实现 |

### 2.2 批量生成任务 (Phase 03 - US1)

**用户故事**: 管理员可以提交创意主题，系统自动在不同风格和 AI 模型下生成数百张图像。

#### 已实现功能

- [x] **任务创建页面** (`/admin/collections/tasks/create`)
  - 主题输入与验证
  - 风格多选（数据库驱动，180+ 风格模板）
  - 模型多选（支持 Flux、DALL-E 3、Nano Banana）
  - 长宽比配置（1:1, 16:9, 9:16, 4:3）
  - 批量配置（每组合生成图片数量）

- [x] **任务提交流程**
  - POST `/api/tasks/{id}/submit` 端点
  - 状态转换：Draft → Queued → Processing → Completed/Failed
  - 验证：至少选择一个风格和模型

- [x] **任务分裂算法**
  - 笛卡尔积计算：提示词 × 风格 × 模型 × 批次
  - 警告阈值：超过 1000 张图片时提醒用户

- [x] **子任务执行**
  - PayloadCMS Jobs Queue 自动处理
  - 重试逻辑（最多 3 次尝试，针对可重试错误）
  - 进度实时聚合到父任务

- [x] **图像存储**
  - 从 API 下载图像到 `public/generates/` 目录
  - 创建 Media 文档并上传到 PayloadCMS
  - 文件命名规范：`{subject_slug}_{style}_{model}_{index}.{ext}`

### 2.3 智能提示词优化 (Phase 04 - US2)

**用户故事**: 系统自动将简短的创意主题增强为详细的高质量提示词。

#### 已实现功能

- [x] **LLM 提示词扩展**
  - 主力模型：Gemini 3 Flash Preview (`gemini-3-flash-preview`)
  - 支持可配置思考级别（minimal/low/medium/high）
  - 可选联网搜索增强 (RAG)

- [x] **LLM 提供者抽象层**
  - `GeminiProvider` - 当前实现
  - `ChatGPTProvider` - 预留接口
  - `ClaudeProvider` - 预留接口

- [x] **提示词优化 UI 组件**
  - `SubjectInput` - 多行文本输入与字符计数
  - `VariantCountSelector` - 下拉选择 3/5/7 变体
  - `ExtendButton` - 触发提示词优化 API 调用
  - `PromptOptimizationSection` - 可折叠区域
  - `OptimizationProgressBar` - 三阶段进度：分析 → 增强 → 格式化
  - `PromptVariantsList` / `PromptVariantCard` - 显示生成的变体

- [x] **变体编辑与选择**
  - 复选框多选变体
  - 内联可编辑文本区
  - 负面提示词显示（可编辑）
  - 字符计数显示
  - 按变体类型的颜色编码边框

- [x] **错误处理**
  - `OptimizationErrorBanner` - 内联错误消息与重试按钮

### 2.4 任务创建页面优化 (Phase 05)

#### 已实现功能

- [x] **计算提示词预览**
  - `CalculatedPromptsSection` - 显示最终提示词组合
  - `CalculatedPromptCard` - 单个组合预览（变体 + 风格 + 合并后提示词）
  - 实时计算：变体 × 风格 = 最终提示词数量

- [x] **Overview 概览区域**
  - `TaskOverviewSection` - 摘要面板
  - `SelectedSettingsSummary` - 已选模型和长宽比
  - `PromptsCountSummary` - 提示词计数公式
  - `ImageCountSummary` - 图像总数计算
  - `TaskSummaryStats` - API 调用估算和警告

- [x] **提交按钮**
  - `SubmitTaskAction` - 文档头部的提交按钮
  - `SubmitConfirmationDialog` - 确认对话框（超过 500 张图片时警告）
  - 成功/错误 Toast 通知

- [x] **风格数据库迁移**
  - 风格从 TypeScript 文件迁移到 StyleTemplates 集合
  - Seed 脚本从 JSON 文件导入 180+ 风格
  - GET `/api/studio/styles` 端点从数据库获取

### 2.5 风格配置管理 (Phase 06 - US3)

**用户故事**: 管理员可以创建和管理可复用的风格模板。

#### 已实现功能

- [x] **风格模板集合**
  - 字段：styleId、name、description、positivePrompt、negativePrompt
  - 验证：positivePrompt 必须包含 {prompt} 占位符
  - 系统风格保护（不可删除）

- [x] **风格预览组件**
  - 显示合并后提示词示例

- [x] **预设风格**
  - 默认种子数据：Base、Ghibli、Cyberpunk、Film Noir、Watercolor 等
  - 完整导入：180+ SDXL 风格模板

### 2.6 任务监控管理 (Phase 07 - US4)

**用户故事**: 管理员可以查看所有生成任务的进度和状态，筛选/搜索任务，取消进行中的任务，重试失败的子任务。

#### 已实现功能

- [x] **Task Manager 自定义视图** (`/admin/custom/task-manager`)
  - 分栏设计：左侧任务列表，右侧详情
  - 实时进度监控（5 秒轮询间隔）
  - Visibility API 集成（标签页隐藏时暂停轮询）

- [x] **任务筛选**
  - 状态多选：In Progress、Completed、Failed、Cancelled
  - 日期范围：Today、Last 7 days、Last 30 days、Custom
  - 主题关键词搜索
  - 默认排序：最新优先

- [x] **任务详情**
  - 配置快照（提示词、风格、模型、参数）
  - 子任务分解与状态计数
  - 错误摘要

- [x] **任务操作**
  - POST `/api/tasks/{id}/cancel` - 取消任务
    - 更新任务状态为 cancelled
    - 取消所有 pending 子任务
    - 保留已完成的资产
  - POST `/api/tasks/{id}/retry-failed` - 重试所有失败子任务
  - POST `/api/sub-tasks/{id}/retry` - 重试单个子任务
    - 清除错误状态
    - 重置 retryCount
    - 重新入队

- [x] **图像存储服务**
  - `image-storage.ts` - 下载、保存、路径管理
  - 图像保留在 `public/generates/` 目录
  - PayloadCMS filePath 上传方式

### 2.7 任务创建页面与工作流优化 (Phase 08)

#### 已实现功能

- [x] **默认值优化**
  - 模型默认选择：nano-banana
  - 长宽比默认值：9:16（竖屏社交媒体格式）

- [x] **表单简化**
  - 移除 totalExpected 字段（Overview 区域已显示）
  - 隐藏 expandedPrompts 字段（由 Generated Variants 可视化显示）

- [x] **提交按钮状态**
  - 提交后保持可见但禁用
  - 显示 "Submitted!" 或 "Already Submitted"

- [x] **确认对话框焦点**
  - 正确的焦点陷阱
  - Confirm 按钮自动聚焦

- [x] **Generated Variants UI 优化**
  - 2 列网格布局（响应式）
  - 紧凑的卡片内边距
  - 固定高度区域：标签、扩展提示词、负面提示词
  - 负面提示词始终可见且可编辑
  - 字符计数显示
  - 按变体类型的颜色编码边框（Realistic=蓝、Artistic=紫、Cinematic=琥珀等）

### 2.8 资产画廊管理 (Phase 09 - US5)

**用户故事**: 管理员可以使用增强的预览和优化的显示设置浏览生成的图像。

#### 已实现功能

- [x] **分页配置**
  - 默认显示 100 项
  - 可选限制：25、50、100、200

- [x] **图像悬停预览**
  - `MediaThumbnailCell` 自定义组件
  - 悬停时显示放大预览（768x1024）
  - 平滑淡入/淡出过渡
  - 屏幕边缘定位处理

---

## 3. 当前需求：Media 页面体验优化

### 3.1 需求背景

基本项目已完成构建，需要进一步优化用户体验。Media Collections 包括列表和详情两部分页面，当前存在以下问题：
- 列表页面浏览效率低
- 详情页面结构混乱

### 3.2 列表页面优化

#### FR-001: Gallery/List 视图切换

**描述**: 添加 Switch 按钮，支持在 List 和 Gallery 视图之间切换。

**验收标准**:
- [ ] List 视图：当前默认的表格形式，显示完整元数据
- [ ] Gallery 视图：瀑布流/网格布局，专注于图片展示
- [ ] 切换按钮位于列表工具栏
- [ ] 用户偏好持久化（localStorage）
- [ ] 响应式布局适配

**技术参考**: 
- [LightGallery](https://github.com/sachinchoolur/lightGallery)

**优先级**: P0

#### FR-002: 图片悬停预览增强

**描述**: 优化现有悬停预览功能。

**验收标准**:
- [ ] 悬停时显示放大预览 (需要实现)
- [ ] 预览图包含基本元数据（尺寸、格式、生成模型）
- [ ] 预览定位智能化（避免超出视口）
- [ ] 支持键盘导航预览

**优先级**: P1

### 3.3 详情页面优化

#### FR-003: 详情页结构重组

**描述**: 使用合理的结构和 Section 重新组织详情展示。

**验收标准**:
- [ ] 主图展示区：大图居中，支持缩放和原图查看
- [ ] 基本信息区：文件名、尺寸、格式、创建时间
- [ ] 生成信息区：
  - 关联子任务 ID
  - 使用的模型和风格
  - 最终提示词（完整显示）
  - 负面提示词
  - 生成参数（seed、guidance_scale 等）
- [ ] 操作区：下载原图、复制提示词、重新生成（使用相同参数）

**优先级**: P0

#### FR-004: 元数据控件优化

**描述**: 使用更优化的控件展示信息。

**验收标准**:
- [ ] 长文本（提示词）使用可展开/收起的文本区域
- [ ] JSON 数据使用格式化的代码块展示
- [ ] 关联数据使用可点击的链接跳转
- [ ] 枚举值使用标签/徽章展示
- [ ] 时间戳使用相对时间显示（"2 小时前"）

**优先级**: P1

---

## 4. 系统架构

### 4.1 核心逻辑链条

```
意图输入 → 智能扩充 → 组合裂变 → 异步生产 → 资产沉淀
```

### 4.2 数据流生命周期

```
1. 用户创建任务 (Draft)
   ├─ 输入主题
   ├─ 选择风格和模型
   ├─ 设置批量大小和长宽比
   └─ 保存为草稿

2. 用户提交任务
   └─ POST /api/tasks/{id}/submit
      ├─ 验证：风格、模型、主题都存在
      ├─ 状态更新：Draft → Queued
      └─ 入队 expand-prompt 作业

3. expand-prompt 作业运行
   ├─ 调用 PromptOptimizer.expandPrompt()
   ├─ 通过 LLM 生成 N 个提示词变体
   ├─ 存储到 task.expandedPrompts
   └─ 状态更新：Queued → Processing

4. 任务分裂执行
   ├─ 对每个组合 (提示词 × 风格 × 模型 × 批次):
   │  └─ 创建 SubTask 记录
   └─ 总数 = N_prompts × N_styles × N_models × batch_size

5. generate-image 作业并行运行
   ├─ 获取 SubTask
   ├─ 合并：expandedPrompt + 风格模板
   ├─ 调用 adapter.generate() 生成图像
   ├─ 下载图像
   ├─ 创建 Media 文档
   ├─ 存储响应元数据
   └─ 更新 SubTask：Pending → Success/Failed

6. 父任务进度更新 (通过 SubTask hook)
   └─ 计算：completed/total → 进度百分比
   └─ 根据子任务状态更新任务状态
```

### 4.3 裂变算法

$$Total\_Tasks = (N_{prompts}) \times (N_{styles}) \times (N_{models}) \times (Size_{batch})$$

**案例推演**:
1. 用户输入主题："赛博朋克猫"
2. LLM 优化：生成 3 个版本的提示词 → $N_{prompts} = 3$
3. 风格选择：选择 4 个风格 → $N_{styles} = 4$
4. 模型选择：勾选 2 个模型 → $N_{models} = 2$
5. 生成批次：每个组合生成 10 张 → $Size_{batch} = 10$

**计算结果**: $3 \times 4 \times 2 \times 10 = 240$ 张图片

---

## 5. 主要入口路由

| 路由 | 用途 |
|------|------|
| `/admin/collections/tasks/create` | 创建新任务 |
| `/admin/collections/tasks` | 任务列表 |
| `/admin/collections/tasks/{id}` | 编辑任务 |
| `/admin/custom/task-manager` | 增强的任务监控 |
| `/admin/collections/media` | 媒体资源库 |
| `/admin/collections/style-templates` | 风格模板管理 |
| `/admin/collections/model-configs` | 模型配置管理 |
| `/admin/collections/sub-tasks` | 子任务列表 |

---

## 6. 未来规划 (Phase 10+)

### 6.1 多模型对比 (Phase 10 - US6)

- 支持同时生成并对比不同图像模型的输出
- 模型特定参数配置 UI
- 按模型筛选 Media 列表

### 6.2 Dashboard 概览 (Phase 11 - US7)

- 每日生成统计
- 最近活动
- 使用统计（热门风格、热门模型）
- 资源消耗监控

### 6.3 Studio 工作台 (Phase 12)

- 统一的生成工作流界面
- 整合任务创建、提示词优化、生成预览

### 6.4 视频生成 - Veo (Phase 14 - 延后)

- Google Veo 视频生成适配器
- 长时操作轮询机制
- 视频特定 UI 组件
- Media 集合视频支持

**注意**: 视频生成功能优先级最低，仅在所有图像生成功能完成后考虑实现。

---

## 7. 测试策略

按照 Constitution Principle VI (Testing Discipline) 执行测试策略：

| 模块 | 单元测试 | 集成测试 | 契约测试 |
|------|----------|----------|----------|
| Adapters | ✅ 必需 | N/A | ✅ 必需 |
| Lib utilities | ✅ 必需 | N/A | N/A |
| Services | ✅ 必需 | ✅ 必需 | N/A |
| Jobs | N/A | ✅ 必需 | N/A |
| API Endpoints | N/A | ✅ 必需 | N/A |
| Collections | N/A | ✅ 必需 | N/A |

**渐进式测试协议**:
1. Phase N 的测试必须在 Phase N 实现期间编写
2. 所有 Phase N 测试必须在 Phase N+1 开始前通过
3. 如果测试在实现期间失败，停止并修复后再继续

---

## 8. 参考资料

- [PayloadCMS v3 文档](https://payloadcms.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Google AI Gemini API](https://ai.google.dev/gemini-api/docs)
- [Fal.ai Flux API](https://fal.ai/)
- [OpenAI DALL-E 3 API](https://platform.openai.com/docs/guides/images)
- [SDXL Prompt Styler](https://github.com/twri/sdxl_prompt_styler)
- [LightGallery](https://github.com/sachinchoolur/lightGallery)
- [shadcn/ui](https://github.com/shadcn-ui/ui)
- [Lucide React](https://lucide.dev/)
