import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1746002695718 implements MigrationInterface {
    name = 'Migration1746002695718'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."loans_status_enum" AS ENUM('BOOKED', 'ACTIVE', 'RETURNED', 'OVERDUE')`);
        await queryRunner.query(`CREATE TABLE "loans" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "bookId" integer NOT NULL, "bookingDate" TIMESTAMP, "loanDate" TIMESTAMP, "dueDate" TIMESTAMP, "returnDate" TIMESTAMP, "status" "public"."loans_status_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c6942c1e13e4de135c5203ee61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4c2ab4e556520045a2285916d4" ON "loans" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_aad54a9134e293d4d3be70db99" ON "loans" ("bookId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2fb4f11be074fead8a1cfcbec0" ON "loans" ("dueDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_a630540e1bb9644436a2258c3d" ON "loans" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."books_status_enum" AS ENUM('AVAILABLE', 'BOOKED', 'BORROWED')`);
        await queryRunner.query(`CREATE TABLE "books" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "author" character varying NOT NULL, "isbn" character varying NOT NULL, "description" text, "status" "public"."books_status_enum" NOT NULL DEFAULT 'AVAILABLE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_54337dc30d9bb2c3fadebc69094" UNIQUE ("isbn"), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3cd818eaf734a9d8814843f119" ON "books" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_4675aad2c57a7a793d26afbae9" ON "books" ("author") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_54337dc30d9bb2c3fadebc6909" ON "books" ("isbn") `);
        await queryRunner.query(`CREATE INDEX "IDX_6957fe5d91c3d36aefe79e2c81" ON "books" ("status") `);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "bookId" integer NOT NULL, "loanId" integer, "rating" integer NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_c294f2cf4480cac1b1ed092d8c" UNIQUE ("loanId"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7ed5659e7139fc8bc039198cc1" ON "reviews" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cab4e55252a9c18a27e8141529" ON "reviews" ("bookId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c294f2cf4480cac1b1ed092d8c" ON "reviews" ("loanId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4b88c05a7adf404a6e6b2f1eb" ON "reviews" ("rating") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "email" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_4c2ab4e556520045a2285916d45" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_aad54a9134e293d4d3be70db995" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_cab4e55252a9c18a27e81415299" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_c294f2cf4480cac1b1ed092d8c5" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_c294f2cf4480cac1b1ed092d8c5"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_cab4e55252a9c18a27e81415299"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_aad54a9134e293d4d3be70db995"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_4c2ab4e556520045a2285916d45"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4b88c05a7adf404a6e6b2f1eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c294f2cf4480cac1b1ed092d8c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cab4e55252a9c18a27e8141529"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ed5659e7139fc8bc039198cc1"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6957fe5d91c3d36aefe79e2c81"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_54337dc30d9bb2c3fadebc6909"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4675aad2c57a7a793d26afbae9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3cd818eaf734a9d8814843f119"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TYPE "public"."books_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a630540e1bb9644436a2258c3d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fb4f11be074fead8a1cfcbec0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aad54a9134e293d4d3be70db99"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c2ab4e556520045a2285916d4"`);
        await queryRunner.query(`DROP TABLE "loans"`);
        await queryRunner.query(`DROP TYPE "public"."loans_status_enum"`);
    }

}
