# Cloudflare Pages 部署指南

## 1. 创建 KV 命名空间

在 Cloudflare Dashboard 中：
1. 进入 **Workers & Pages** → **KV**
2. 点击 **Create namespace**
3. 命名为 `visits-kv`（或其他你喜欢的名字）
4. 复制 Namespace ID

## 2. 配置 wrangler.toml

编辑 `wrangler.toml` 文件，将：
- `your-kv-namespace-id` 替换为你的生产环境 KV ID
- `your-preview-kv-namespace-id` 替换为你的预览环境 KV ID（可以和生产环境相同）

## 3. 部署到 Cloudflare Pages

### 方法一：通过 Git 部署
1. 将代码推送到 GitHub/GitLab 仓库
2. 在 Cloudflare Pages 中创建新项目
3. 连接你的仓库
4. 在项目设置中添加 KV 绑定：
   - **设置** → **Functions** → **KV 命名空间绑定**
   - 变量名：`VISITS_KV`
   - 命名空间：选择你创建的 KV

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
