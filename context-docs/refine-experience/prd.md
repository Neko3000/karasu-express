基本项目已经完成构建，我们需要优化一下用户体验

现在已经支持的：
- 创建 Task
- 在创建 Task 时优化 Prompts
- 根据 Task 创建 Sub-Task
- 优化 Task 创建页面的体验，包括合理安排 Sections，生成 Image 数量计算

本次需求：
- 核心：优化 Media 页面的体验
- Media Collections 包括两部分：列表和详情
- 列表页面
    - 需要优化图片展示，将图片 Hover 时，显示 Preview
    - 添加 Switch 按钮，在 List 和 Gallery 中进行切换，Gallery 可以展示更多的图片，浏览起来更便捷
    - 可以参考构建：https://github.com/aaronksaunders/payload-custom-listview-1-2025
- 详情页面
    - 优化详情的展示，现在结构太凌乱了，用合理的结构和 Section 展示
    - 使用更优化的控件展示信息
