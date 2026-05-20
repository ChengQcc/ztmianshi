# 花颜美妆 · Multi-Agent 客服系统 Demo

> 面试展示用：基于 OpenClaw 三 Agent 协同架构的客服系统可视化演示

## 在线预览

部署到 GitHub Pages 后访问：`https://<你的用户名>.github.io/beauty-agent-demo/`

## 项目结构

```
beauty-agent-demo/
├── index.html      ← 单页应用入口（首页 + 二级演示页）
├── styles.css      ← 全部样式
├── data.js         ← 三个 Agent 的人设和 4 个演示场景脚本
├── app.js          ← SPA 路由 / 流式对话 / 流程图联动
└── README.md       ← 本文件
```

## 本地预览

```bash
cd beauty-agent-demo
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765
```

或者直接双击 `index.html` 也可以（无依赖任何后端）。

## 功能亮点

### 1. 首页

- 品牌 Hero 区
- **三 Agent 架构图**（一眼看清主从关系）
- 三张 Agent 卡片（小美 / Lily / 安安）
- 系统亮点四宫格（置信度路由 / 上下文交接 / 安全红线 / 数据轻量化）

### 2. 二级演示页（核心）

**左侧 · 对话区**
- 4 个场景一键切换
- 流式打字机输出，速度可调（1x / 2x / 4x）
- 三种特殊气泡：
  - 🧠 `confidence_check` 置信度自检
  - 🔧 `read` / `refund_order` 等工具调用
  - 🚀 `sessions_spawn` 任务分发
  - ⚠️ `escalate_to_human` 人工兜底

**右侧 · 实时调用链路图（最大亮点）**
- 6 个节点：用户 / 小美 / 数据 / Lily / 安安 / 人工
- 节点状态：活跃（高亮+脉冲）/ 已触发（暗色）/ 风险（红色）
- 连线动画：流光虚线 → 已触发实线
- 工具调用日志：实时滚动

### 3. 4 个演示场景（对应 simplified_data_access.md 实战示例）

| # | 场景 | 用户输入 | 关键路由 |
|---|------|----------|----------|
| 1 | 画像追问 → 转销售 | "我想买面霜" | 70% 意图 → 追问 → sessions_spawn → Lily |
| 2 | 过敏 → 转售后 | "脸有点红，有点痒" | 90% 意图 → 直接 sessions_spawn → 安安 |
| 3 | 风险触发 → 转人工 | "假货！投诉12315！" | 15% 意图 → escalate_to_human |
| 4 | 老用户复购 → 直接转销售 | "油痘肌、预算150、想买控油洁面" | 95% 意图 → 无缝转 Lily |

## 部署到 GitHub Pages

### 1. 创建仓库并推送代码

```bash
cd /Users/anan/Desktop/beauty-agent-demo

# 初始化 git
git init
git add .
git commit -m "init: beauty multi-agent demo"

# 在 GitHub 网页上创建一个新仓库，比如叫 beauty-agent-demo
# 然后推送：
git branch -M main
git remote add origin https://github.com/<你的用户名>/beauty-agent-demo.git
git push -u origin main
```

### 2. 启用 GitHub Pages

1. 打开仓库页面
2. Settings → Pages
3. 在 "Build and deployment" 下：
   - Source: **Deploy from a branch**
   - Branch: **main** / `(root)`
   - 点 **Save**
4. 等 1-2 分钟，刷新页面会出现公开地址：
   `https://<你的用户名>.github.io/beauty-agent-demo/`

### 3. 把链接发给面试官

可以直接发以下两个链接：

- 首页：`https://<你的用户名>.github.io/beauty-agent-demo/`
- 直接进入演示场景 1：`https://<你的用户名>.github.io/beauty-agent-demo/#scene1`

## 当场演示建议

1. **先打开首页**，介绍三 Agent 架构（看架构图 + 三张卡片即可讲清主从关系）
2. **点 "进入演示" 或场景 1 卡片**，直接进入二级页
3. **场景顺序建议**：1 → 4 → 2 → 3（清晰度从中到高再到风险，节奏感好）
4. **演示要点（边演示边说）**：
   - 看左侧：每次回复前的 `confidence_check`，这是路由的依据
   - 看右侧：sessions_spawn 那条连线流光，是任务分发的瞬间
   - 场景 3：故意演 escalate_to_human，证明系统知道自己的边界
5. 演示速度选 **2x**（默认就是 2x），太慢会打断节奏，太快讲不清

## 修改场景内容

所有对话脚本都在 `data.js` 的 `SCENARIOS` 数组里，每条 step 的 type：

- `user`: 用户消息
- `agent`: Agent 回复（owner 指定哪个 agent）
- `check`: 置信度自检（黄色虚线框）
- `tool`: 工具调用（read / refund_order 等）
- `spawn`: sessions_spawn 任务分发（粉色渐变框）
- `escalate`: escalate_to_human（红色框）

直接改 `data.js` 即可，无需打包构建。

## 自定义视觉

`styles.css` 顶部的 `:root` 变量是设计系统的核心：

```css
--primary: #B85C8E;     /* 花颜主色 */
--accent: #E8B4B8;      /* 接待粉 */
--sales: #B85C8E;       /* 销售紫红 */
--after: #7AB5A8;       /* 售后青 */
--human: #C97A7A;       /* 人工警示 */
```

改这里就能整体换色。
