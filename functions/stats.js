function formatStatsHTML(stats) {
  const deviceStatsHTML = Object.entries(stats.deviceStats || {}).map(([device, count]) => {
    const icons = {
      'iPhone': '📱',
      'iPad': '📱',
      'Android': '📱',
      'Mac': '💻',
      'Windows': '💻',
      'Linux': '🐧',
      'Unknown': '❓'
    };
    const icon = icons[device] || '📱';
    return `<div class="stat-item"><span class="device-icon">${icon}</span><span class="device-name">${device}</span><span class="device-count">${count} 次</span></div>`;
  }).join('');

  const recentVisitsHTML = (stats.recentVisits || []).map(visit => {
    const deviceIcon = visit.isMobile ? '📱' : '💻';
    const countryFlag = visit.country !== 'Unknown' ? `🌍 ${visit.country}` : '🌍';
    return `<div class="visit-item">
      <div class="visit-time">${visit.time}</div>
      <div class="visit-details">
        <span class="detail">${deviceIcon} ${visit.device}</span>
        <span class="detail">${visit.browser}</span>
        <span class="detail">${countryFlag}</span>
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>访问统计</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      color: white;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .card {
      background: white;
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .card-title {
      font-size: 1.3em;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 15px;
      text-align: center;
    }
    .stat-number {
      font-size: 2.5em;
      font-weight: 700;
    }
    .stat-label {
      font-size: 0.9em;
      opacity: 0.9;
      margin-top: 5px;
    }
    .stat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .device-icon { font-size: 1.5em; margin-right: 15px; }
    .device-name { flex: 1; font-weight: 500; color: #333; }
    .device-count { font-weight: 600; color: #667eea; }
    .visit-item {
      padding: 15px;
      background: #f5f5f5;
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .visit-time {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 8px;
    }
    .visit-details {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
    .detail {
      background: #e0e0e0;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      color: #333;
    }
    .footer {
      text-align: center;
      color: white;
      opacity: 0.8;
      margin-top: 30px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 访问统计</h1>
      <p>最后更新: ${stats.lastUpdated}</p>
    </div>
    <div class="card">
      <div class="card-title">📈 访问概览</div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-number">${stats.totalVisits}</div>
          <div class="stat-label">总访问量</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${stats.todayVisits}</div>
          <div class="stat-label">今日访问</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">📱 设备分布</div>
      ${deviceStatsHTML}
    </div>
    ${stats.recentVisits ? `
    <div class="card">
      <div class="card-title">🕐 最近访问记录</div>
      ${recentVisitsHTML}
    </div>
    ` : ''}
    <div class="footer">
      <a href="/" style="color: white; text-decoration: underline;">← 返回首页</a>
    </div>
  </div>
</body>
</html>`;
}

function getTodayKey() {
  const now = new Date();
  const shanghai = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  return shanghai.toISOString().split("T")[0];
}

// 从 D1 数据库查询统计数据
async function getStatsFromD1(env) {
  const todayKey = getTodayKey();

  // 并行查询所有统计数据
  const [totalResult, todayResult, deviceResult, recentResult] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM visits').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM visits WHERE visit_date = ?').bind(todayKey).first(),
    env.DB.prepare('SELECT device, COUNT(*) as count FROM visits GROUP BY device ORDER BY count DESC').all(),
    env.DB.prepare('SELECT ip, country, device, browser, os, is_mobile, created_at FROM visits ORDER BY created_at DESC LIMIT 100').all()
  ]);

  // 转换设备统计格式
  const deviceStats = {};
  if (deviceResult.results) {
    deviceResult.results.forEach(row => {
      deviceStats[row.device] = row.count;
    });
  }

  // 转换最近访问记录格式
  const recentVisits = [];
  if (recentResult.results) {
    recentResult.results.forEach(row => {
      recentVisits.push({
        time: row.created_at,
        ip: row.ip,
        country: row.country,
        device: row.device,
        browser: row.browser,
        isMobile: row.is_mobile === 1
      });
    });
  }

  return {
    totalVisits: totalResult?.count || 0,
    todayVisits: todayResult?.count || 0,
    deviceStats,
    recentVisits
  };
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const showDetails = url.searchParams.get('details') !== 'false';
  const jsonOnly = url.searchParams.get('format') === 'json';

  try {
    // 从 D1 数据库查询
    console.log('[D1] 从数据库查询统计');
    const stats = await getStatsFromD1(env);

    const responseData = {
      ...stats,
      lastUpdated: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    };

    if (jsonOnly) {
      return new Response(JSON.stringify(responseData), {
        headers: { "Content-Type": "application/json; charset=utf-8" }
      });
    }

    return new Response(formatStatsHTML(responseData), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  } catch (e) {
    console.error("获取统计数据失败:", e);

    const errorStats = {
      totalVisits: 0,
      todayVisits: 0,
      deviceStats: {},
      lastUpdated: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    };

    return new Response(formatStatsHTML(errorStats), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}
