import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  text,
  pgEnum,
  uniqueIndex,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const bookStatusEnum = pgEnum('book_status', [
  'AVAILABLE',
  'BOOKED',
  'BORROWED',
]);
export const loanStatusEnum = pgEnum('loan_status', [
  'BOOKED',
  'ACTIVE',
  'RETURNED',
  'OVERDUE',
]);

// --- Schema ---
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)],
);

export const books = pgTable(
  'books',
  {
    id: serial('id').primaryKey(),
    title: varchar('title').notNull(),
    author: varchar('author').notNull(),
    isbn: varchar('isbn').notNull().unique(),
    description: text('description'),
    status: bookStatusEnum('status').default('AVAILABLE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('books_title_idx').on(table.title),
    index('books_author_idx').on(table.author),
    uniqueIndex('books_isbn_idx').on(table.isbn),
    index('books_status_idx').on(table.status),
  ],
);

export const loans = pgTable(
  'loans',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    bookingDate: timestamp('booking_date', { withTimezone: true }),
    loanDate: timestamp('loan_date', { withTimezone: true }),
    dueDate: timestamp('due_date', { withTimezone: true }),
    returnDate: timestamp('return_date', { withTimezone: true }),
    status: loanStatusEnum('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('loans_user_id_idx').on(table.userId),
    index('loans_book_id_idx').on(table.bookId),
    index('loans_due_date_idx').on(table.dueDate),
    index('loans_status_idx').on(table.status),
  ],
);

export const reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    bookId: integer('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    loanId: integer('loan_id').references(() => loans.id, {
      onDelete: 'set null',
    }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('reviews_user_book_unique').on(table.userId, table.bookId),
    index('reviews_user_id_idx').on(table.userId),
    index('reviews_book_id_idx').on(table.bookId),
    index('reviews_loan_id_idx').on(table.loanId),
    index('reviews_rating_idx').on(table.rating),
  ],
);

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  loans: many(loans),
  reviews: many(reviews),
}));

export const booksRelations = relations(books, ({ many }) => ({
  loans: many(loans),
  reviews: many(reviews),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [loans.bookId],
    references: [books.id],
  }),
  review: one(reviews, {
    fields: [loans.id],
    references: [reviews.loanId],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [reviews.bookId],
    references: [books.id],
  }),
  loan: one(loans, {
    fields: [reviews.loanId],
    references: [loans.id],
  }),
}));

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type BookSelect = typeof books.$inferSelect;
export type BookInsert = typeof books.$inferInsert;
export type LoanSelect = typeof loans.$inferSelect;
export type LoanInsert = typeof loans.$inferInsert;
export type ReviewSelect = typeof reviews.$inferSelect;
export type ReviewInsert = typeof reviews.$inferInsert;
