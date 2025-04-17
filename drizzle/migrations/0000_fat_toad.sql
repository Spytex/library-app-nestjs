CREATE TYPE "public"."book_status" AS ENUM('AVAILABLE', 'BOOKED', 'BORROWED');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('BOOKED', 'ACTIVE', 'RETURNED', 'OVERDUE');--> statement-breakpoint
CREATE TABLE "books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar NOT NULL,
	"author" varchar NOT NULL,
	"isbn" varchar NOT NULL,
	"description" text,
	"status" "book_status" DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_isbn_unique" UNIQUE("isbn")
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"booking_date" timestamp with time zone,
	"loan_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"return_date" timestamp with time zone,
	"status" "loan_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"loan_id" integer,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_user_book_unique" UNIQUE("user_id","book_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "books_title_idx" ON "books" USING btree ("title");--> statement-breakpoint
CREATE INDEX "books_author_idx" ON "books" USING btree ("author");--> statement-breakpoint
CREATE UNIQUE INDEX "books_isbn_idx" ON "books" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "books_status_idx" ON "books" USING btree ("status");--> statement-breakpoint
CREATE INDEX "loans_user_id_idx" ON "loans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "loans_book_id_idx" ON "loans" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "loans_due_date_idx" ON "loans" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "loans_status_idx" ON "loans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_book_id_idx" ON "reviews" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "reviews_loan_id_idx" ON "reviews" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");