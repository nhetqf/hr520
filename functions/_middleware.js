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

  console.log(`[访问记录] 时间: ${time} | IP: ${ip} | 国家: ${country} | 设备: ${uaInfo.device} | 浏览器: ${uaInfo.browser}`);

  try {
    // 使用 D1 数据库存储（免费额度：500万次读取/天 + 10万次写入/天）
    await env.DB.prepare(`
      INSERT INTO visits (ip, country, device, browser, os, is_mobile, user_agent, visit_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ip,
      country,
      uaInfo.device,
      uaInfo.browser,
      uaInfo.os,
      uaInfo.isMobile ? 1 : 0,
      userAgent.substring(0, 200),
      todayKey
    ).run();

    console.log(`[D1] 记录已保存到数据库`);
  } catch (e) {
    console.error("存储访问记录失败:", e);
  }

  return await context.next();
}
