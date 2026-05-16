# Cognitive Crunch

一款集健身追踪与学习管理于一体的个人数据管理应用，帮助你同时保持身体健康和学业进步。

## 功能特性

- **概览仪表盘** — 一目了然查看今日体重、饮食热量、运动时长、学习进度、饮水量、睡眠及连续打卡天数
- **体重记录** — 记录每日体重与身体围度（腰围、臀围、胸围、臂围、腿围），Chart.js 趋势图可视化
- **饮食管理** — 按餐次（早餐/午餐/晚餐/加餐）记录食物，追踪热量、蛋白质、碳水、脂肪摄入，支持食物搜索
- **运动打卡** — 记录跑步、骑行、游泳、力量训练、HIIT、瑜伽等多种运动类型及消耗热量
- **学习追踪** — 按科目记录学习时长，内置番茄钟计时器，支持考试成绩记录与目标管理
- **饮水追踪** — 快捷记录每日饮水量（200/300/500ml 按钮），进度条可视化，可自定义目标
- **睡眠记录** — 记录入睡/起床时间与睡眠质量（5 级评价），自动计算时长与周均睡眠
- **统计报告** — 多维度数据图表分析，本周 vs 上周对比（热量、运动、学习），回顾健身与学习趋势
- **里程碑提醒** — 达成连续打卡等成就时自动通知
- **数据管理** — 支持数据导入/导出（JSON），一键清空
- **暗色模式** — 支持亮色/暗色主题切换
- **响应式设计** — 移动端底部导航栏 + 桌面端侧边栏，自适应布局

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式**: Tailwind CSS 3 + tailwindcss-animate
- **图表**: Chart.js 4
- **图标**: Lucide React
- **路由**: React Router DOM v7
- **数据存储**: localStorage（前端本地存储，无需后端）

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/hang-meng/Cognitive-Crunch.git
cd Cognitive-Crunch

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```
src/
├── components/          # 通用组件
│   ├── ui/              # 基础 UI 组件（Button, Card）
│   ├── DataManager.tsx   # 数据导入/导出/清空弹窗
│   ├── FoodSearch.tsx    # 食物搜索组件
│   ├── MilestoneNotification.tsx  # 里程碑通知
│   ├── Modal.tsx         # 通用弹窗
│   ├── PomodoroTimer.tsx # 番茄钟计时器
│   └── Toast.tsx         # 轻提示组件
├── lib/
│   ├── store.ts          # 数据模型、localStorage 存取与业务逻辑
│   └── utils.ts          # 工具函数
├── pages/
│   ├── DashboardPage.tsx # 概览页
│   ├── WeightPage.tsx    # 体重记录页
│   ├── DietPage.tsx      # 饮食管理页
│   ├── ExercisePage.tsx  # 运动打卡页
│   ├── StudyPage.tsx     # 学习追踪页
│   ├── ReportPage.tsx    # 统计报告页
│   └── SettingsPage.tsx  # 设置页
├── App.tsx               # 应用主入口与布局
├── index.css             # 全局样式与 Tailwind 指令
├── main.tsx              # 渲染入口
└── vite-env.d.ts         # Vite 类型声明
```

## 数据说明

所有数据存储在浏览器 localStorage 中，不上传至任何服务器。支持通过 JSON 文件进行数据备份与迁移，确保你的数据始终掌握在自己手中。

## License

MIT
