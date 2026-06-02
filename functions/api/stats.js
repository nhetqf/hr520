export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const showDetails = url.searchParams.get('details') === 'true';
  const acceptHeader = request.headers.get('accept') || '';

  if (!env.VISITS_KV) {
    return new Response(JSON.stringify({ error: "KV 未配置" }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: 500
    });
  }

  try {
    const totalVisits = await env.VISITS_KV.get("total_visits", "text") || "0";
    const todayKey = new Date().toLocaleString("en-US", { timeZone: "Asia/Shanghai" }).split(",")[0].split("/").reverse().join("-");
    const todayVisits = await env.VISITS_KV.get(`visits_${todayKey}`, "text") || "0";
    const deviceStats = await env.VISITS_KV.get("device_stats", "json") || {};
    const recentVisits = await env.VISITS_KV.get("recent_visits", "json") || [];

    const responseData = {
      totalVisits: parseInt(totalVisits),
      todayVisits: parseInt(todayVisits),
      deviceStats,
      lastUpdated: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
    };

    if (showDetails) {
      responseData.recentVisits = recentVisits;
    }

    // 如果是浏览器请求，返回 HTML 页面
    if (acceptHeader.includes('text/html') || url.searchParams.get('html') === 'true') {
      // 读取 HTML 模板文件
      const htmlTemplate = await context.env.ASSETS.fetch(new URL('/functions/api/stats.html', request.url));
      let htmlContent = await htmlTemplate.text();

      // 替换模板中的数据占位符
      htmlContent = htmlContent
        .replace('"{{totalVisits}}"', responseData.totalVisits)
        .replace('"{{todayVisits}}"', responseData.todayVisits)
        .replace('"{{lastUpdated}}"', responseData.lastUpdated)
        .replace('"{{deviceStats}}"', JSON.stringify(responseData.deviceStats))
        .replace('"{{recentVisits}}"', JSON.stringify(responseData.recentVisits));

      return new Response(htmlContent, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 默认返回 JSON
    return new Response(JSON.stringify(responseData), {
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
