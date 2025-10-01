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
  // Exclude large dependencies from serverless functions
  outputFileTracingExcludes: {
    '*': [
      './node_modules/@next/swc-linux-x64-gnu/**/*',
      './node_modules/@next/swc-linux-x64-musl/**/*',
      './node_modules/next/dist/**/*',
      './node_modules/typescript/lib/**/*',
      './node_modules/@img/sharp/**/*',
      './node_modules/@img/sharp-libvips-linuxmusl-x64/**/*',
      './node_modules/@img/sharp-libvips-linux-x64/**/*',
      './node_modules/@esbuild/linux-x64/**/*',
      './node_modules/esbuild/bin/**/*',
      './node_modules/@saros-finance/dlmm-sdk/**/*',
      './node_modules/@solana/**/*',
      './node_modules/@coral-xyz/**/*',
      './node_modules/bn.js/**/*',
      './node_modules/lodash/**/*',
      './node_modules/@babel/parser/**/*',
      './node_modules/axe-core/**/*',
      './node_modules/prettier/**/*',
      './node_modules/eslint-plugin-import/**/*',
      './node_modules/eslint-plugin-react/**/*',
      './node_modules/@noble/**/*',
      './node_modules/@ethereumjs/**/*',
      './node_modules/ripple-binary-codec/**/*',
      './node_modules/styled-jsx/**/*',
      './node_modules/rxjs/**/*',
      './node_modules/graphemer/**/*',
      './node_modules/@tybys/wasm-util/**/*',
    ],
  },
  // Reduce bundle size
  webpack: (config, { isServer }) => {
    // Exclude blockchain SDKs and large dependencies from serverless functions
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        // Next.js and build tools (should not be in serverless functions)
        '@next/swc-linux-x64-gnu': 'commonjs @next/swc-linux-x64-gnu',
        '@next/swc-linux-x64-musl': 'commonjs @next/swc-linux-x64-musl',
        'next/dist': 'commonjs next/dist',
        'typescript/lib': 'commonjs typescript/lib',
        '@img/sharp': 'commonjs @img/sharp',
        '@img/sharp-libvips-linuxmusl-x64': 'commonjs @img/sharp-libvips-linuxmusl-x64',
        '@img/sharp-libvips-linux-x64': 'commonjs @img/sharp-libvips-linux-x64',
        '@esbuild/linux-x64': 'commonjs @esbuild/linux-x64',
        'esbuild/bin': 'commonjs esbuild/bin',
        
        // Blockchain SDKs
        '@saros-finance/dlmm-sdk': 'commonjs @saros-finance/dlmm-sdk',
        '@solana/spl-token': 'commonjs @solana/spl-token',
        '@solana-program/token-2022': 'commonjs @solana-program/token-2022',
        '@coral-xyz/anchor': 'commonjs @coral-xyz/anchor',
        'bn.js': 'commonjs bn.js',
        
        // Large utility libraries
        'lodash': 'commonjs lodash',
        '@babel/parser': 'commonjs @babel/parser',
        'axe-core': 'commonjs axe-core',
        'prettier': 'commonjs prettier',
        
        // Development tools (shouldn't be in production)
        'eslint-plugin-import': 'commonjs eslint-plugin-import',
        'eslint-plugin-react': 'commonjs eslint-plugin-react',
        
        // Crypto libraries
        '@noble/hashes': 'commonjs @noble/hashes',
        '@noble/curves': 'commonjs @noble/curves',
        '@ethereumjs/tx': 'commonjs @ethereumjs/tx',
        'ripple-binary-codec': 'commonjs ripple-binary-codec',
        
        // Other large dependencies
        'styled-jsx': 'commonjs styled-jsx',
        'rxjs': 'commonjs rxjs',
        'graphemer': 'commonjs graphemer',
        '@tybys/wasm-util': 'commonjs @tybys/wasm-util',
        
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
      
      // Exclude large packages from client-side bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'axe-core': false,
        'prettier': false,
        'eslint-plugin-import': false,
        'eslint-plugin-react': false,
        'styled-jsx': false,
        'rxjs': false,
        'graphemer': false,
        '@tybys/wasm-util': false,
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
