-- 模型目录同步：DeepSeek Flash + MiMo V2.6；退役 deepseek-v4-flash / MiMo V2.5 下拉
-- 与 seed-models.ts 保持一致
INSERT INTO "models" ("id", "label", "icon", "supports_images", "supports_thinking", "supports_web_search", "enabled", "sort_order", "created_at", "updated_at")
VALUES
  ('deepseek-flash', 'DeepSeek Flash', 'i-simple-icons-deepseek', true, true, false, true, 10, NOW(), NOW()),
  ('deepseek-v4-pro', 'DeepSeek V4 Pro', 'i-simple-icons-deepseek', false, true, false, true, 20, NOW(), NOW()),
  ('mimo-v2.6-pro', 'MiMo V2.6 Pro', 'i-simple-icons-xiaomi', true, true, true, true, 30, NOW(), NOW()),
  ('mimo-v2.6-flash', 'MiMo V2.6 Flash', 'i-simple-icons-xiaomi', true, true, true, true, 40, NOW(), NOW()),
  ('deepseek-v4-flash', 'DeepSeek V4 Flash', 'i-simple-icons-deepseek', true, true, false, false, 100, NOW(), NOW()),
  ('mimo-v2.5-pro', 'MiMo V2.5 Pro', 'i-simple-icons-xiaomi', false, true, true, false, 110, NOW(), NOW()),
  ('mimo-v2.5', 'MiMo V2.5', 'i-simple-icons-xiaomi', true, true, true, false, 120, NOW(), NOW()),
  ('mimo-v2.5-flash', 'MiMo V2.5 Flash', 'i-simple-icons-xiaomi', false, false, false, false, 130, NOW(), NOW()),
  ('mimo-v2.5-asr', 'MiMo V2.5 ASR', 'i-simple-icons-xiaomi', false, false, false, false, 140, NOW(), NOW()),
  ('mimo-v2-omni', 'MiMo V2 Omni', 'i-simple-icons-xiaomi', true, false, false, false, 150, NOW(), NOW()),
  ('mimo-v2-omni-pro', 'MiMo V2 Omni Pro', 'i-simple-icons-xiaomi', false, false, false, false, 160, NOW(), NOW()),
  ('mimo-v2-omni-flash', 'MiMo V2 Omni Flash', 'i-simple-icons-xiaomi', false, false, false, false, 170, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "label" = EXCLUDED."label",
  "icon" = EXCLUDED."icon",
  "supports_images" = EXCLUDED."supports_images",
  "supports_thinking" = EXCLUDED."supports_thinking",
  "supports_web_search" = EXCLUDED."supports_web_search",
  "enabled" = EXCLUDED."enabled",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = NOW();--> statement-breakpoint
UPDATE "models" SET "enabled" = false, "updated_at" = NOW()
WHERE "id" NOT IN (
  'deepseek-flash',
  'deepseek-v4-pro',
  'mimo-v2.6-pro',
  'mimo-v2.6-flash',
  'deepseek-v4-flash',
  'mimo-v2.5-pro',
  'mimo-v2.5',
  'mimo-v2.5-flash',
  'mimo-v2.5-asr',
  'mimo-v2-omni',
  'mimo-v2-omni-pro',
  'mimo-v2-omni-flash'
);
