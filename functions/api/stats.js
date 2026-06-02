function getTodayKey() {
  const now = new Date();
  const shanghai = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  const year = shanghai.getFullYear();
  const month = String(shanghai.getMonth() + 1).padStart(2, '0');
  const day = String(shanghai.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 从 D1 数据库查询统计数据
async function getStatsFromD1(env, showDetails) {
  const todayKey = getTodayKey();

  // 并行查询所有统计数据
  const [totalResult, todayResult, deviceResult, recentResult] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM visits').first(),
    env.DB.prepare('SELECT COUNT(*) as count FROM visits WHERE visit_date = ?').bind(todayKey).first(),
    env.DB.prepare('SELECT device, COUNT(*) as count FROM visits GROUP BY device ORDER BY count DESC').all(),
    showDetails
      ? env.DB.prepare('SELECT ip, country, device, browser, os, is_mobile, user_agent, created_at FROM visits ORDER BY created_at DESC LIMIT 100').all()
      : Promise.resolve({ results: [] })
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
  if (showDetails && recentResult.results) {
    recentResult.results.forEach(row => {
      recentVisits.push({
        time: row.created_at,
        ip: row.ip,
        country: row.country,
        device: row.device,
        browser: row.browser,
        os: row.os,
        isMobile: row.is_mobile === 1,
        userAgent: row.user_agent
      });
    });
  }

  return {
    totalVisits: totalResult?.count || 0,
    todayVisits: todayResult?.count || 0,
    deviceStats,
    recentVisits: showDetails ? recentVisits : undefined
  };
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const showDetails = url.searchParams.get('details') === 'true';

  try {
    // 从 D1 数据库查询
    console.log('[API/D1] 从数据库查询统计');
    const stats = await getStatsFromD1(env, showDetails);

    const response = {
      ...stats,
      lastUpdated: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
      dataSource: 'D1'
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (e) {
    console.error("获取统计数据失败:", e);
    return new Response(JSON.stringify({ error: "获取数据失败", details: e.message }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: 500
    });
  }
}
