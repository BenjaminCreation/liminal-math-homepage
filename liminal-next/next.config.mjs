/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // the page logic classes own timers/DOM listeners; avoid double-mount in dev
}
export default nextConfig
