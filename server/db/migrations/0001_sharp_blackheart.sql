ALTER TABLE "chats" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "chats_user_id_pinned_idx" ON "chats" USING btree ("user_id","pinned","created_at");