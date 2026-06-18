export async function onRequestGet(context) {
  const { env } = context;

  const db = env.DB;

  try {
    await db.prepare("ALTER TABLE users ADD COLUMN salt TEXT").run();
    return new Response(JSON.stringify({ success: true, message: "salt 列添加成功" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
