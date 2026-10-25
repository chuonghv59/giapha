import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            {
              name: 'firebase-vendor',
              test: /node_modules[\\/](firebase|@firebase|@grpc|protobufjs)[\\/]/,
              priority: 20,
              maxSize: 450 * 1024,
            },
            {
              name: 'antd-vendor',
              test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[^\\/]+)[\\/]/,
              priority: 20,
              maxSize: 450 * 1024,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              maxSize: 450 * 1024,
            },
          ],
        },
      },
    },
  },
})
