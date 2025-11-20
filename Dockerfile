# Dockerfile for ShadowLlama Agent
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm install

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy any static assets if needed
COPY --from=builder /app/src/config ./dist/config 2>/dev/null || true

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/index.js"]
```

---

## 📝 **.dockerignore** (COMPLETE - Create if Missing)
```
node_modules
npm-debug.log
dist
.git
.gitignore
.env
.env.local
.env.*.local
*.db
*.db-journal
README.md
.vscode
.idea
*.log
coverage
.nyc_output
