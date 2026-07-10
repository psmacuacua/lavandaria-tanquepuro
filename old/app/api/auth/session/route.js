const { NextResponse } = require("next/server");
const { getSessionFromRequest, COOKIE_NAME } = require("@/lib/auth");

async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: session });
}

async function DELETE(req) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}

module.exports = { GET, DELETE };
