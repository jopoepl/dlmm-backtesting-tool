import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['@saros-finance/dlmm-sdk'],
  },
  // External packages for serverless functions
  // Note: Using webpack externals instead to avoid conflicts with transpilePackages
  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Fix routes manifest issue
  outputFileTracingRoot: process.cwd(),
  // Reduce bundle size
  webpack: (config, { isServer }) => {
    // Exclude blockchain SDKs and large dependencies from serverless functions
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        // Blockchain SDKs
        '@saros-finance/dlmm-sdk': 'commonjs @saros-finance/dlmm-sdk',
        'bn.js': 'commonjs bn.js',
        
        // Large utility libraries
        'lodash': 'commonjs lodash',
        '@babel/parser': 'commonjs @babel/parser',
        'axe-core': 'commonjs axe-core',
        
        // Crypto libraries
        '@noble/hashes': 'commonjs @noble/hashes',
        '@ethereumjs/tx': 'commonjs @ethereumjs/tx',
        'ripple-binary-codec': 'commonjs ripple-binary-codec',
        
        // Supabase (keep only essential parts)
        '@supabase/auth-js': 'commonjs @supabase/auth-js',
      });
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
      
      // Exclude React Native dependencies from web build
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
        '@react-native/assets-registry': false,
        '@react-native/codegen': false,
        '@react-native/community-cli-plugin': false,
        '@react-native/debugger-frontend': false,
        'react-native': false,
        'react-native-web': false,
      };
      
      // Exclude React Native modules
      config.externals = config.externals || [];
      config.externals.push({
        '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
        '@react-native/assets-registry': 'commonjs @react-native/assets-registry',
        '@react-native/codegen': 'commonjs @react-native/codegen',
        '@react-native/community-cli-plugin': 'commonjs @react-native/community-cli-plugin',
        '@react-native/debugger-frontend': 'commonjs @react-native/debugger-frontend',
        'react-native': 'commonjs react-native',
        'react-native-web': 'commonjs react-native-web',
      });
    }
    
    // Optimize for production
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 200000, // 200KB per chunk
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 200000,
              priority: 1,
            },
            solana: {
              test: /[\\/]node_modules[\\/]@solana[\\/]/,
              name: 'solana',
              chunks: 'all',
              priority: 20,
              maxSize: 200000,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 20,
              maxSize: 200000,
            },
            dlmm: {
              test: /[\\/]node_modules[\\/]@saros-finance[\\/]/,
              name: 'dlmm',
              chunks: 'all',
              priority: 20,
              maxSize: 200000,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 30,
              maxSize: 200000,
            },
            // Exclude large utility libraries from main bundle
            utils: {
              test: /[\\/]node_modules[\\/](lodash|moment|date-fns)[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 10,
              maxSize: 100000,
            },
          },
        },
        usedExports: true,
        sideEffects: false,
        // Enable tree shaking
        providedExports: true,
        concatenateModules: true,
      };
    }
    
    return config;
  },
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Reduce build output - remove standalone to avoid including node_modules
  // output: 'standalone',
};

export default withBundleAnalyzer(nextConfig);
