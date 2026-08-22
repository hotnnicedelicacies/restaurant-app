import type { NextConfig } from 'next';

// Derive the Supabase host from the configured URL so changing project /
// environment doesn't require touching this file.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // The menu-sheet PNG route reads the small logo from disk at runtime;
  // make sure it ships with the serverless bundle.
  outputFileTracingIncludes: {
    '/admin/menu/sheet/image': ['./assets/logo-sheet.png'],
  },
  images: {
    // 24h on Vercel's image cache. Menu images change infrequently, and
    // every Next/Image hit re-runs through Supabase Storage otherwise.
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      { protocol: 'https', hostname: 'fdrztvihocohjwmgiukn.supabase.co', pathname: '/**' },
      ...(supabaseHost
        ? [{ protocol: 'https' as const, hostname: supabaseHost, pathname: '/**' }]
        : []),
    ],
  },
};

export default nextConfig;
