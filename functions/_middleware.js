function parseUserAgent(ua) {
  const result = {
    device: "Unknown",
    browser: "Unknown",
    os: "Unknown",
    isMobile: false
  };

  if (!ua) return result;

  const uaLower = ua.toLowerCase();

  if (uaLower.includes("iphone") || uaLower.includes("android") || uaLower.includes("mobile")) {
    result.isMobile = true;
  }

  if (uaLower.includes("iphone")) result.device = "iPhone";
  else if (uaLower.includes("ipad")) result.device = "iPad";
  else if (uaLower.includes("android")) result.device = "Android";
  else if (uaLower.includes("mac")) result.device = "Mac";
  else if (uaLower.includes("windows")) result.device = "Windows";
  else if (uaLower.includes("linux")) result.device = "Linux";

  if (uaLower.includes("chrome") && !uaLower.includes("edg")) result.browser = "Chrome";
  else if (uaLower.includes("firefox")) result.browser = "Firefox";
  else if (uaLower.includes("safari") && !uaLower.includes("chrome")) result.browser = "Safari";
  else if (uaLower.includes("edg")) result.browser = "Edge";

  if (uaLower.includes("windows nt 10")) result.os = "Windows 10/11";
  else if (uaLower.includes("mac os x")) result.os = "macOS";
  else if (uaLower.includes("android")) result.os = "Android";
  else if (uaLower.includes("iphone") || uaLower.includes("ipad")) result.os = "iOS";
  else if (uaLower.includes("linux")) result.os = "Linux";

  return result;
}

function getTodayKey() {
  const now = new Date();
  const shanghai = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" }));
  return shanghai.toISOString().split("T")[0];
}

export async function onRequest(context) {
  const { request, env } = context;
  const userAgent = request.headers.get("user-agent") || "Unknown";
  const ip = request.headers.get("cf-connecting-ip") || "Unknown";
  const country = request.headers.get("cf-ipcountry") || "Unknown";
  const time = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  const uaInfo = parseUserAgent(userAgent);
  const todayKey = getTodayKey();

  const visitRecord = {
    time,
    ip,
    country,
    device: uaInfo.device,
    browser: uaInfo.browser,
    os: uaInfo.os,
    isMobile: uaInfo.isMobile,
    userAgent: userAgent.substring(0, 200)
  };

  console.log(`[访问记录] 时间: ${time} | IP: ${ip} | 国家: ${country} | 设备: ${uaInfo.device} | 浏览器: ${uaInfo.browser}`);

  try {
    if (env.VISITS_KV) {
      const totalKey = "total_visits";
      const todayVisitsKey = `visits_${todayKey}`;
      const deviceStatsKey = "device_stats";
      const recentVisitsKey = "recent_visits";

      let totalVisits = await env.VISITS_KV.get(totalKey, "text");
      totalVisits = totalVisits ? parseInt(totalVisits) + 1 : 1;
      await env.VISITS_KV.put(totalKey, totalVisits.toString());

      let todayVisits = await env.VISITS_KV.get(todayVisitsKey, "text");
      todayVisits = todayVisits ? parseInt(todayVisits) + 1 : 1;
      await env.VISITS_KV.put(todayVisitsKey, todayVisits.toString(), { expirationTtl: 86400 * 30 });

      let deviceStats = await env.VISITS_KV.get(deviceStatsKey, "json");
      if (!deviceStats) deviceStats = {};
      const deviceKey = uaInfo.device;
      deviceStats[deviceKey] = (deviceStats[deviceKey] || 0) + 1;
      await env.VISITS_KV.put(deviceStatsKey, JSON.stringify(deviceStats));

      let recentVisits = await env.VISITS_KV.get(recentVisitsKey, "json");
      if (!recentVisits) recentVisits = [];
      recentVisits.unshift(visitRecord);
      if (recentVisits.length > 100) recentVisits = recentVisits.slice(0, 100);
      await env.VISITS_KV.put(recentVisitsKey, JSON.stringify(recentVisits));
    }
  } catch (e) {
    console.error("存储访问记录失败:", e);
  }

  return await context.next();
}
