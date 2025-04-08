/** @type {import('next').NextConfig} */

// Bundle Analyzer (activado sólo con ANALYZE=true)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('next-bundle-analyzer')({ enabled: true })
  : (config) => config;

const nextConfig = {
  // Configuraciones generales
  reactStrictMode: true,
  
  // Configuraciones para imágenes
  images: {
    domains: ['firebasestorage.googleapis.com', 'images.unsplash.com', 'wlfsjgrjliqlhwxjlbnb.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Encabezados HTTP
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Optimizaciones de compilación
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuraciones de webpack
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones solo para producción
    if (!dev) {
      // Optimizaciones para el cliente
      if (!isServer) {
        // Dividir chunks para optimizar carga
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: -10,
            },
          },
        };
      }
    }
    
    return config;
  },
  
  // Configuraciones experimentales
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'date-fns',
      '@tremor/react',
    ],
  },
  
  // External packages that should be transpiled by Next.js
  serverExternalPackages: [],
};

// Exportar configuración con analizador de bundle cuando está activado
module.exports = withBundleAnalyzer(nextConfig); 