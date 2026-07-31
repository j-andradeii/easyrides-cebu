-- Lead reference numbers ("L-001042") on opportunities.
--
-- Distinct from the quote reference: `quoteReference()` derives "Q-8F3A21" by
-- slicing a quote's UUID, and one lead can carry several quotes. This number
-- identifies the LEAD itself, for the whole life of the deal.
--
-- Hand-extended from what drizzle-kit generated. drizzle emitted only the
-- ADD COLUMN, which cannot work on its own: the column default calls nextval()
-- on a sequence that does not exist yet, so the migration would abort on the
-- first row. The sequence has to exist first, and existing rows want
-- deliberate numbering rather than whatever order the heap happens to be in.

CREATE SEQUENCE IF NOT EXISTS "opportunities_reference_seq" START WITH 1000 INCREMENT BY 1;--> statement-breakpoint
-- Added nullable so the backfill below controls the numbering; the DEFAULT and
-- NOT NULL both go on afterwards.
ALTER TABLE "opportunities" ADD COLUMN "reference" text;--> statement-breakpoint
-- Backfill oldest-first so reference numbers agree with the order leads
-- actually arrived. row_number() rather than nextval() inside the subquery:
-- Postgres does not promise to evaluate a volatile function in the ORDER BY
-- order of an uncorrelated subquery, whereas this assignment is deterministic.
UPDATE "opportunities" AS o
SET "reference" = 'L-' || lpad((999 + s.rn)::text, 6, '0')
FROM (
  SELECT "id", row_number() OVER (ORDER BY "created_at", "id") AS rn
  FROM "opportunities"
) AS s
WHERE o."id" = s."id";--> statement-breakpoint
-- Move the sequence past everything the backfill consumed, so the first new
-- lead continues the run instead of colliding with a backfilled row.
SELECT setval('opportunities_reference_seq', 999 + GREATEST((SELECT count(*) FROM "opportunities"), 1), true);--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "reference" SET DEFAULT 'L-' || lpad(nextval('opportunities_reference_seq')::text, 6, '0');--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "reference" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_reference_unique" UNIQUE("reference");
