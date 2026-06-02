function getTodayKey() {
  const now = new Date();
  const shanghai = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  const year = shanghai.getFullYear();
  const month = String(shanghai.getMonth() + 1).padStart(2, '0');
  const day = String(shanghai.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const showDetails = url.searchParams.get('details') === 'true';

  if (!env.VISITS_KV) {
    return new Response(JSON.stringify({ error: "KV 未配置" }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: 500
    });
  }

  try {
    const totalVisits = await env.VISITS_KV.get("total_visits", "text") || "0";
    const todayKey = getTodayKey();
    const todayVisits = await env.VISITS_KV.get(`visits_${todayKey}`, "text") || "0";
    const deviceStats = await env.VISITS_KV.get("device_stats", "json") || {};
    const recentVisits = await env.VISITS_KV.get("recent_visits", "json") || [];

    const response = {
      totalVisits: parseInt(totalVisits),
      todayVisits: parseInt(todayVisits),
      deviceStats,
      lastUpdated: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    };

    if (showDetails) {
      response.recentVisits = recentVisits;
    }

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (e) {
    console.error("获取统计数据失败:", e);
    return new Response(JSON.stringify({ error: "获取数据失败" }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: 500
    });
  }
}
