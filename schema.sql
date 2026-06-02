-- HR 网站访问统计数据库 Schema
-- 使用 D1 (SQLite) 替代 KV，免费额度更大

-- 访问记录表
CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    country TEXT DEFAULT 'Unknown',
    device TEXT DEFAULT 'Unknown',
    browser TEXT DEFAULT 'Unknown',
    os TEXT DEFAULT 'Unknown',
    is_mobile INTEGER DEFAULT 0,
    user_agent TEXT,
    visit_date TEXT NOT NULL,  -- 格式: YYYY-MM-DD
    created_at TEXT DEFAULT (datetime('now', '+8 hours'))  -- 上海时区
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_device ON visits(device);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at DESC);

-- 统计缓存表（可选，用于快速查询）
CREATE TABLE IF NOT EXISTS stats_cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now', '+8 hours'))
);
