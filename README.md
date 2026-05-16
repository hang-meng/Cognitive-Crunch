# 健身 & 学习记录

一站式追踪健身减肥和专升本学习进度的纯前端 SPA 应用。

## 功能

- **仪表盘** — 体重趋势、学习时长、卡路里概览、连续打卡天数
- **体重追踪** — 体重记录 + BMI 计算 + 身体围度（腰/臀/胸/臂/腿）
- **饮食记录** — 三餐+加餐热量记录、宏量营养素统计、60+ 食物热量库搜索
- **运动记录** — 跑步/游泳/力量/HIIT 等 8 种运动类型、卡路里消耗统计
- **学习记录** — 按科目记录学习时长、模考成绩追踪、内置番茄钟
- **周/月报告** — 热量缺口、学习时长、最佳成绩等综合统计
- **深色模式** — 支持亮色/深色切换
- **数据管理** — JSON 导入导出，数据存储在浏览器 localStorage

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 18 |
| 构建 | Vite 6 |
| 语言 | TypeScript 5.6 |
| 样式 | Tailwind CSS 3.4 |
| 图表 | Chart.js 4.4 |
| 路由 | React Router 7 |
| 图标 | Lucide Icons |

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`

## 构建 & 部署

```bash
npm run build     # 输出到 dist/
npm run preview   # 预览构建产物
```

### Cloudflare Pages

项目已配置 `public/_redirects` 支持 SPA 路由。在 Cloudflare Pages 中设置：

| 配置 | 值 |
|---|---|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

## 项目结构

```
src/
├── pages/           # 页面组件
│   ├── DashboardPage.tsx   # 仪表盘
│   ├── WeightPage.tsx      # 体重追踪
│   ├── DietPage.tsx        # 饮食记录
│   ├── ExercisePage.tsx    # 运动记录
│   ├── StudyPage.tsx       # 学习记录
│   ├── ReportPage.tsx      # 统计报告
│   └── SettingsPage.tsx    # 个人设置
├── components/      # 公共组件
├── lib/
│   ├── store.ts     # 数据层（localStorage 读写）
│   └── utils.ts     # 工具函数
└── main.tsx         # 入口
```
