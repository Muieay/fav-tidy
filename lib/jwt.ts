import jwt from 'jsonwebtoken';

// 当前在用私钥
const CURRENT_KID = 'v2';
const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || '32_BYTE_CURRENT_SECRET';

// 密钥仓库
const KEY_STORE: Record<string, string> = {
    v2: PRIVATE_KEY,
};

/* 1. 生成 token ----------------------------------------------------------- */
export function signJwt(
    payload: Record<string, unknown>,
    expiresIn: number = 60 * 60 * 24 * 7
): string {
    return jwt.sign(
        { ...payload, kid: CURRENT_KID },
        PRIVATE_KEY,
        { algorithm: 'HS256', expiresIn }
    );
}

/* 2. 验证 token ----------------------------------------------------------- */
export function verifyJwt(token: string): Record<string, unknown> | null {
    try {
        const cleanToken = token.replace(/^Bearer\s+/i, '');

        // 先不验签，只解码，拿到 kid
        const decoded = jwt.decode(cleanToken) as Record<string, unknown> | null;
        if (!decoded) return null;
        const kid = decoded.kid as string;
        const secret = KEY_STORE[kid];
        if (!secret) return null;

        // 用对应密钥真正验签
        return jwt.verify(cleanToken, secret) as Record<string, unknown>;
    } catch {
        return null;
    }
}