/**
 * Seed the funnel definition — plan §5 "Seed data".
 *
 * Idempotent: re-running updates the stage/workflow rows in place rather than
 * duplicating them, so it is safe to run after every schema change.
 *
 *   npm run db:seed
 */

import { config as loadEnv } from 'dotenv';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  DEFAULT_PIPELINE_ID,
  DEFAULT_PIPELINE_NAME,
  STAGE_DEFINITIONS,
} from '../lib/funnel/stages';
import { WORKFLOW_DEFINITIONS } from '../lib/workflows/definitions';
import * as schema from './schema';

loadEnv({ path: '.env.local' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — check .env.local');
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // --- Default pipeline ---
    await db
      .insert(schema.pipelines)
      .values({
        id: DEFAULT_PIPELINE_ID,
        name: DEFAULT_PIPELINE_NAME,
        isDefault: true,
      })
      .onConflictDoUpdate({
        target: schema.pipelines.id,
        set: { name: DEFAULT_PIPELINE_NAME, isDefault: true },
      });
    console.log(`✔ pipeline "${DEFAULT_PIPELINE_NAME}"`);

    // --- The funnel stages (New Lead → Quote Sent → Booked, plus Lost) ---
    for (const stage of STAGE_DEFINITIONS) {
      await db
        .insert(schema.pipelineStages)
        .values({
          pipelineId: DEFAULT_PIPELINE_ID,
          key: stage.key,
          name: stage.name,
          sortOrder: stage.sortOrder,
          probability: stage.probability,
          isWon: stage.isWon,
          isLost: stage.isLost,
        })
        .onConflictDoUpdate({
          target: [schema.pipelineStages.pipelineId, schema.pipelineStages.key],
          set: {
            name: stage.name,
            sortOrder: stage.sortOrder,
            probability: stage.probability,
            isWon: stage.isWon,
            isLost: stage.isLost,
          },
        });
    }
    console.log(`✔ ${STAGE_DEFINITIONS.length} pipeline stages`);

    // Prune stages that are no longer part of the funnel. A stage still holding
    // opportunities is left alone and reported — silently deleting it would
    // either break the FK or orphan live deals.
    const activeKeys = STAGE_DEFINITIONS.map((stage) => stage.key);
    const staleStages = await db
      .select({ id: schema.pipelineStages.id, key: schema.pipelineStages.key })
      .from(schema.pipelineStages)
      .where(
        and(
          eq(schema.pipelineStages.pipelineId, DEFAULT_PIPELINE_ID),
          notInArray(schema.pipelineStages.key, activeKeys)
        )
      );

    for (const stale of staleStages) {
      const [{ count: inUse }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.opportunities)
        .where(eq(schema.opportunities.stageId, stale.id));

      if (inUse > 0) {
        console.warn(
          `⚠ stage "${stale.key}" still holds ${inUse} opportunit${inUse === 1 ? 'y' : 'ies'} — ` +
            'move them to a current stage, then re-run the seed to remove it.'
        );
        continue;
      }

      await db.delete(schema.pipelineStages).where(eq(schema.pipelineStages.id, stale.id));
      console.log(`✔ removed retired stage "${stale.key}"`);
    }

    // --- The workflow definitions (W1–W5) ---
    for (const workflow of WORKFLOW_DEFINITIONS) {
      const triggerType =
        workflow.trigger === 'stage.changed' && workflow.triggerStage
          ? `stage.changed:${workflow.triggerStage}`
          : workflow.trigger;

      // is_active is deliberately NOT overwritten on conflict — an operator who
      // switched a workflow off in the portal should stay switched off.
      await db
        .insert(schema.workflows)
        .values({
          key: workflow.key,
          name: workflow.name,
          description: workflow.description,
          triggerType,
          definition: workflow,
        })
        .onConflictDoUpdate({
          target: schema.workflows.key,
          set: {
            name: workflow.name,
            description: workflow.description,
            triggerType,
            definition: workflow,
          },
        });
    }
    console.log(`✔ ${WORKFLOW_DEFINITIONS.length} workflows`);

    const stageCount = await db.select().from(schema.pipelineStages);
    const workflowRows = await db
      .select()
      .from(schema.workflows)
      .where(eq(schema.workflows.isActive, true));

    console.log(
      `\nSeed complete — ${stageCount.length} stages, ${workflowRows.length} active workflows.`
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
