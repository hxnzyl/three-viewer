import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	output: 'export',
	// 关闭严格模式
	reactStrictMode: false,
	// 路径末尾加/
	trailingSlash: true,
	transpilePackages: ['lucide-react'],
	// webpack
	webpack(config: any) {
		config.module.rules.push({
			test: /\.(glsl|vs|fs|vert|frag)$/,
			use: ['raw-loader', 'glslify-loader']
		})
		return config
	}
}

export default nextConfig
