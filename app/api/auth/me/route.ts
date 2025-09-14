import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    // 获取当前用户信息
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 返回用户信息
    return Response.json({
      success: true,
      user: {
        username: user.username,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return Response.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}