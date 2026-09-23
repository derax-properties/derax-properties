/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // Default is 60 seconds, which would have undercut the longer-lived
    // signed URLs above — the optimized/cached copy of a photo would still
    // have been thrown away and rebuilt from scratch a minute after it was
    // first viewed. Matches the 7-day signed-URL expiry so a photo, once
    // opened, stays fast to reopen for as long as its link is valid.
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

module.exports = nextConfig;
