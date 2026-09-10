# World OS 原始DDL参考（S07）

9张表的字段、类型、默认值、主外键、索引原样提取。仅文档参考；尚未补齐租户/时间线约束，不是可直接执行的迁移。正式迁移要求见 [工程契约](26-world-os-engineering-contract.md)。

## worlds

```sql
CREATE TABLE worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(50) NOT NULL,
    theme VARCHAR(50),
    world_dna JSONB NOT NULL DEFAULT '{
        "civilization_level": "medieval",
        "technology_level": "low",
        "magic_system": null,
        "danger_level": 3,
        "romance_level": 3,
        "freedom_level": 4
    }',
    current_time JSONB NOT NULL DEFAULT '{"year": 1, "month": 1, "day": 1, "hour": 6, "minute": 0}',
    status VARCHAR(20) DEFAULT 'draft',
    is_public BOOLEAN DEFAULT false,
    view_count INT DEFAULT 0,
    play_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_worlds_owner ON worlds(owner_id);
CREATE INDEX idx_worlds_status ON worlds(status);
CREATE INDEX idx_worlds_public ON worlds(is_public) WHERE is_public = true;
```

## world_rules

```sql
CREATE TABLE world_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL,  -- physical/social/economic/political/power/magic/technology/cultural/narrative
    rule_name VARCHAR(100) NOT NULL,
    rule_data JSONB NOT NULL,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(world_id, rule_type, rule_name)
);

CREATE INDEX idx_world_rules_world ON world_rules(world_id);
CREATE INDEX idx_world_rules_type ON world_rules(rule_type);
```

## world_characters

```sql
CREATE TABLE world_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    identity VARCHAR(100),
    personality JSONB NOT NULL DEFAULT '{
        "openness": 0.5,
        "conscientiousness": 0.5,
        "extraversion": 0.5,
        "agreeableness": 0.5,
        "neuroticism": 0.5
    }',
    goals TEXT[],
    desires TEXT[],
    fears TEXT[],
    secrets TEXT[],
    current_state JSONB DEFAULT '{
        "location": null,
        "health": 100,
        "energy": 100,
        "hunger": 50,
        "mood": 50
    }',
    current_location_id UUID,
    schedule JSONB DEFAULT '[]',
    is_npc BOOLEAN DEFAULT true,
    is_player_controlled BOOLEAN DEFAULT false,
    importance_level INT DEFAULT 3,  -- 1=主角, 2=重要NPC, 3=普通NPC, 4=背景NPC
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_world_characters_world ON world_characters(world_id);
CREATE INDEX idx_world_characters_location ON world_characters(current_location_id);
CREATE INDEX idx_world_characters_importance ON world_characters(importance_level);
```

## story_bible

```sql
CREATE TABLE story_bible (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    timeline_id UUID,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(50)[],
    theme VARCHAR(50)[],
    logline TEXT,
    main_conflict TEXT,
    main_character_id UUID REFERENCES world_characters(id),
    antagonist_id UUID REFERENCES world_characters(id),
    status VARCHAR(20) DEFAULT 'draft',  -- draft/outline/writing/complete/published
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_story_bible_world ON story_bible(world_id);
CREATE INDEX idx_story_bible_status ON story_bible(status);
```

## chapters

```sql
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES story_bible(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title VARCHAR(255),
    outline TEXT,
    content TEXT,
    summary TEXT,
    hook TEXT,
    quality_score FLOAT DEFAULT 0,
    word_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(story_id, chapter_number)
);

CREATE INDEX idx_chapters_story ON chapters(story_id);
CREATE INDEX idx_chapters_status ON chapters(status);
```

## world_events

```sql
CREATE TABLE world_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,  -- global/regional/character/story/player/hidden
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location_id UUID,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    participants UUID[],
    cause JSONB,
    possible_outcomes JSONB,
    world_impact JSONB,
    story_importance FLOAT DEFAULT 0.5,
    status VARCHAR(20) DEFAULT 'pending',  -- pending/active/resolved/cancelled
    visibility VARCHAR(20) DEFAULT 'public',  -- public/hidden/secret
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_world_events_world ON world_events(world_id);
CREATE INDEX idx_world_events_status ON world_events(status);
CREATE INDEX idx_world_events_type ON world_events(event_type);
```

## timelines

```sql
CREATE TABLE timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    parent_timeline_id UUID REFERENCES timelines(id),
    divergence_event_id UUID REFERENCES world_events(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_state JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_timelines_world ON timelines(world_id);
CREATE INDEX idx_timelines_parent ON timelines(parent_timeline_id);
```

## player_actions

```sql
CREATE TABLE player_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    timeline_id UUID REFERENCES timelines(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES world_characters(id),
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    input_raw TEXT,
    parsed_intent JSONB,
    result JSONB,
    success_probability FLOAT,
    actual_result VARCHAR(50),  -- success/failure/partial
    immediate_impact JSONB,
    delayed_impact JSONB,
    hidden_impact JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_player_actions_world ON player_actions(world_id);
CREATE INDEX idx_player_actions_user ON player_actions(user_id);
CREATE INDEX idx_player_actions_character ON player_actions(character_id);
```

## content_reports

```sql
CREATE TABLE content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    target_type VARCHAR(20) NOT NULL,  -- world/character/story/chapter
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending/reviewed/resolved/rejected
    reviewer_id UUID REFERENCES users(id),
    review_note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_content_reports_target ON content_reports(target_type, target_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
```


