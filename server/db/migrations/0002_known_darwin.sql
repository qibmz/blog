CREATE TABLE "models" (
	"id" text PRIMARY KEY NOT NULL,
	"supports_images" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
