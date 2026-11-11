export function isMockTokenAllowed(nodeEnv: string, token: string): boolean {
  return token.startsWith('mock-token-') && (nodeEnv === 'development' || nodeEnv === 'test');
}
