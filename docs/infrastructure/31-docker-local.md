# 31 · 本地 Docker 环境与 Alembic 初始化

> 上级文档：[../MASTER_SPEC.md](../MASTER_SPEC.md) §1、§7
> Phase 0 终止条件：`docker-compose up -d` 成功 → `alembic upgrade head` 成功 → `localhost:8000/health` 返回 `{"status":"ok"}` → `localhost:3000` 可访问。

## 1. docker-compose.yml（infrastructure/docker/docker-compose.yml）

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16        # 必须使用带 pgvector 的镜像
    container_name: mirai-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-mirai}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-local_dev_pass}
      POSTGRES_DB: ${POSTGRES_DB:-mirai}
    ports:
      - "5432:5432"
    volumes:
      - mirai_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-mirai}"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: mirai-redis
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "6379:6379"
    volumes:
      - mirai_redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  adminer:
    image: adminer:4
    container_name: mirai-adminer
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  mirai_pgdata:
  mirai_redisdata:
```

要点：
- 镜像必须是 `pgvector/pgvector:*`（普通 postgres 镜像无 vector 扩展）；
- 本地密码统一 `local_dev_pass`，**禁止向用户询问数据库密码**；
- Adminer 仅本地使用，端口 8080。

## 2. 启动命令

```bash
# 1. 启动基础设施
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 2. 确认扩展（在 API 迁移中也会 CREATE EXTENSION vector）
docker exec -it mirai-postgres psql -U mirai -d mirai -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 3. 后端依赖与迁移（apps/api 内）
pip install -e .
alembic upgrade head        # 第一版迁移 create_tables

# 4. 启动后端
uvicorn src.main:app --reload --port 8000

# 5. 启动前端（apps/web 内）
pnpm install
pnpm dev                    # http://localhost:3000
```

## 3. Alembic 初始化约定

```bash
cd apps/api
alembic init -t async src/infrastructure/database/migrations   # 或 async template
```

- `alembic.ini` / `env.py` 从 `core.config.Settings` 读取数据库 URL（不硬编码密码）；
- 第一版迁移 `create_tables` 内容顺序：
  1. `CREATE EXTENSION vector`；
  2. users → characters → relationships → relationship_events → memories（含 ivfflat 索引）→ emotion_states → story_events → subscriptions → creator_earnings/earning_ledger → marketplace_items/purchases；
  3. 全部外键 `ON DELETE CASCADE`；
  4. 强制索引：`idx_memories_user_char`、`idx_memories_embedding (ivfflat, lists=100)`。
- ivfflat 索引在空表上即可创建（lists=100 固定）；数据导入后执行 `ANALYZE memories;`。

## 4. 健康检查

- `GET http://localhost:8000/health` → `200 {"status":"ok"}`
  - Phase 0 最简实现直接返回 ok；后续可扩展检查 DB/Redis。
- `http://localhost:3000` 返回 Next.js 页面，且 3D 区域已被 ErrorBoundary 包裹（占位 Canvas 亦可）。

## 5. 常见故障

| 现象 | 处理 |
| --- | --- |
| `type "vector" does not exist` | 镜像不是 pgvector 版，或未执行 `CREATE EXTENSION vector` |
| ivfflat 索引创建失败 | 确认扩展已装；embedding 列类型为 `VECTOR(1536)` |
| Redis 连接失败 | 检查 `REDIS_URL=redis://localhost:6379/0` 与容器健康状态 |
| 端口占用 | 修改 compose 端口映射或停掉本地旧服务 |
| 邮件发不出 | 检查 Resend 域名 DKIM 状态与 `RESEND_FROM_EMAIL` 域名一致性 |
