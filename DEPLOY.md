# Cloudflare Pages 部署指南

## 1. 创建 KV 命名空间

在 Cloudflare Dashboard 中：
1. 进入 **Workers & Pages** → **KV**
2. 点击 **Create namespace**
3. 命名为 `visits-kv`（或其他你喜欢的名字）
4. 复制 Namespace ID（你的 ID 是：`aae7ae232db5401fbea3b01adaddf832`）

## 2. 在 Pages 项目中绑定 KV（关键步骤！）

如果项目已经部署：
1. 进入你的 Pages 项目
2. 点击 **设置** → **Functions**
3. 找到 **KV 命名空间绑定** 部分
4. 点击 **添加绑定**
5. 变量名填入：`VISITS_KV`（必须完全一致！）
6. KV 命名空间选择你创建的那个
7. 点击 **保存并部署**

## 3. 部署代码

### 方法一：通过 Git 部署
1. 将代码推送到 GitHub/GitLab 仓库
2. 在 Cloudflare Pages 中创建或更新项目
3. 连接你的仓库并部署

### 方法二：通过 Wrangler CLI 部署
```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=hr-website
```

## 4. 查看访问统计

### Cloudflare 内置 Analytics
- 进入 Cloudflare Pages 项目
- 点击 **Analytics** 标签页
- 可以查看访问量、设备类型、地理位置等

### 自定义统计 API
访问：`https://your-domain.pages.dev/api/stats`

获取详细记录（包括最近访问）：
`https://your-domain.pages.dev/api/stats?details=true`

## 5. 功能说明

- **总访问量**：累计所有访问次数
- **今日访问**：当日访问次数（保留30天）
- **设备统计**：按设备类型统计
- **最近访问**：最近100条访问记录（含IP、国家、设备等信息）

## 注意事项

1. KV 有读取限制，免费版每天 100,000 次读取
2. IP 信息仅用于统计，不会公开显示
3. 如需隐藏 API 接口，可以添加简单的密码验证
