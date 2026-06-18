// 文件路径: functions/api/login.ts
import jwt from '@tsndr/cloudflare-worker-jwt';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. 获取前端传过来的用户名和密码
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "用户名或密码不能为空" }), { status: 400 });
    }

    // 2. 去 D1 数据库查询有没有这个用户
    const db = env.DB; // 你的数据库绑定
    const user = await db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
      .bind(username, password)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "账号或密码错误" }), { status: 401 });
    }

    // 3. 密码正确，生成一个 JWT 令牌给前端
    // JWT_SECRET 是用来加密令牌的钥匙，我们需要去后台配置
    const secret = env.JWT_SECRET || "default_secret_key"; 
    const token = await jwt.sign({ 
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + (24 * (60 * 60)) // 令牌 24 小时后过期
    }, secret);

    return new Response(JSON.stringify({ 
      success: true, 
      token: token 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
