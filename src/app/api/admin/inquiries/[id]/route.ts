/**
 * GET /api/admin/inquiries/[id] — everything the per-inquiry workflow screen
 * needs, in one payload (plan §10.3).
 *
 * `id` is the *opportunity* id: the deal is what an agent works, and it is what
 * the list rows link to.
 */

import { NextResponse } from 'next/server';
import { asc, desc, eq, or } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  activities,
  adminUsers,
  contacts,
  inquiries,
  opportunities,
  pipelineStages,
  referrals,
  reviews,
  tasks,
  workflowEnrollments,
  workflows,
} from '@/db/schema';
import { AdminRouteError, requireAdmin } from '@/lib/auth/require-admin';
import { getStages } from '@/lib/crm/repository';
import { listQuotesForOpportunity } from '@/lib/crm/quotes';
import { describeStep, type WorkflowDefinition } from '@/lib/workflows/definitions';
import type { InquiryDetailResponse } from '@/models/crm.types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminRouteError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }

  const { id } = await context.params;

  try {
    const [row] = await db
      .select({
        opportunity: opportunities,
        contact: contacts,
        stage: pipelineStages,
        ownerName: adminUsers.name,
      })
      .from(opportunities)
      .innerJoin(contacts, eq(contacts.id, opportunities.contactId))
      .innerJoin(pipelineStages, eq(pipelineStages.id, opportunities.stageId))
      .leftJoin(adminUsers, eq(adminUsers.id, opportunities.ownerId))
      .where(eq(opportunities.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ message: 'Inquiry not found' }, { status: 404 });
    }

    const { opportunity, contact, stage } = row;

    const [
      inquiryRows,
      activityRows,
      taskRows,
      enrollmentRows,
      reviewRows,
      referralRows,
      stages,
      owners,
      referredBy,
      quoteRecords,
    ] = await Promise.all([
      db
        .select()
        .from(inquiries)
        .where(eq(inquiries.opportunityId, opportunity.id))
        .orderBy(desc(inquiries.createdAt)),

      db
        .select({ activity: activities, adminName: adminUsers.name })
        .from(activities)
        .leftJoin(adminUsers, eq(adminUsers.id, activities.adminUserId))
        .where(eq(activities.opportunityId, opportunity.id))
        .orderBy(desc(activities.createdAt))
        .limit(200),

      db
        .select({ task: tasks, assigneeName: adminUsers.name })
        .from(tasks)
        .leftJoin(adminUsers, eq(adminUsers.id, tasks.assignedTo))
        .where(eq(tasks.opportunityId, opportunity.id))
        .orderBy(asc(tasks.status), asc(tasks.dueAt)),

      db
        .select({ enrollment: workflowEnrollments, workflow: workflows })
        .from(workflowEnrollments)
        .innerJoin(workflows, eq(workflows.id, workflowEnrollments.workflowId))
        .where(eq(workflowEnrollments.opportunityId, opportunity.id))
        .orderBy(asc(workflowEnrollments.enrolledAt)),

      db
        .select()
        .from(reviews)
        .where(eq(reviews.contactId, contact.id))
        .orderBy(desc(reviews.createdAt)),

      db
        .select({ referral: referrals, referrerName: contacts.fullName, referrerPhone: contacts.phone })
        .from(referrals)
        .innerJoin(contacts, eq(contacts.id, referrals.referrerContactId))
        .where(
          or(
            eq(referrals.referrerContactId, contact.id),
            eq(referrals.refereeContactId, contact.id)
          )
        )
        .orderBy(desc(referrals.createdAt)),

      getStages(),

      db
        .select({
          id: adminUsers.id,
          name: adminUsers.name,
          email: adminUsers.email,
          role: adminUsers.role,
        })
        .from(adminUsers)
        .where(eq(adminUsers.isActive, true))
        .orderBy(adminUsers.name),

      contact.referredByContactId
        ? db
            .select({ fullName: contacts.fullName })
            .from(contacts)
            .where(eq(contacts.id, contact.referredByContactId))
            .limit(1)
        : Promise.resolve([]),

      listQuotesForOpportunity(opportunity.id),
    ]);

    const payload: InquiryDetailResponse = {
      opportunity: {
        id: opportunity.id,
        reference: opportunity.reference,
        title: opportunity.title,
        status: opportunity.status,
        stageId: opportunity.stageId,
        stageKey: stage.key,
        stageName: stage.name,
        serviceType: opportunity.serviceType,
        vehicleType: opportunity.vehicleType,
        monetaryValue: opportunity.monetaryValue,
        currency: opportunity.currency,
        preferredDate: opportunity.preferredDate,
        source: opportunity.source,
        lostReason: opportunity.lostReason,
        expectedCloseDate: opportunity.expectedCloseDate,
        ownerId: opportunity.ownerId,
        ownerName: row.ownerName,
        wonAt: opportunity.wonAt?.toISOString() ?? null,
        lostAt: opportunity.lostAt?.toISOString() ?? null,
        createdAt: opportunity.createdAt.toISOString(),
        updatedAt: opportunity.updatedAt.toISOString(),
      },

      contact: {
        id: contact.id,
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        countryCode: contact.countryCode,
        tags: contact.tags ?? [],
        lifetimeValue: contact.lifetimeValue,
        firstSource: contact.firstSource,
        notes: contact.notes,
        referralCode: contact.referralCode,
        referredByContactId: contact.referredByContactId,
        referredByName: referredBy[0]?.fullName ?? null,
        createdAt: contact.createdAt.toISOString(),
      },

      inquiries: inquiryRows.map((inquiry) => ({
        id: inquiry.id,
        source: inquiry.source,
        serviceType: inquiry.serviceType,
        vehicleType: inquiry.vehicleType,
        preferredDate: inquiry.preferredDate,
        addDriver: inquiry.addDriver,
        message: inquiry.message,
        tourTitle: inquiry.tourTitle,
        rawPayload: inquiry.rawPayload,
        utm: inquiry.utm,
        createdAt: inquiry.createdAt.toISOString(),
      })),

      activities: activityRows.map(({ activity, adminName }) => ({
        id: activity.id,
        type: activity.type,
        channel: activity.channel,
        subject: activity.subject,
        body: activity.body,
        metadata: (activity.metadata as Record<string, unknown> | null) ?? null,
        adminUserId: activity.adminUserId,
        adminName,
        createdAt: activity.createdAt.toISOString(),
      })),

      tasks: taskRows.map(({ task, assigneeName }) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        dueAt: task.dueAt?.toISOString() ?? null,
        completedAt: task.completedAt?.toISOString() ?? null,
        assignedTo: task.assignedTo,
        assigneeName,
        createdAt: task.createdAt.toISOString(),
      })),

      enrollments: enrollmentRows.map(({ enrollment, workflow }) => {
        const definition = workflow.definition as WorkflowDefinition;
        const steps = definition?.steps ?? [];

        return {
          id: enrollment.id,
          workflowKey: workflow.key,
          workflowName: workflow.name,
          workflowDescription: workflow.description,
          status: enrollment.status,
          currentStep: enrollment.currentStep,
          totalSteps: steps.length,
          nextStepLabel:
            enrollment.status === 'active' || enrollment.status === 'paused'
              ? describeStep(steps[enrollment.currentStep])
              : null,
          nextRunAt: enrollment.nextRunAt?.toISOString() ?? null,
          enrolledAt: enrollment.enrolledAt.toISOString(),
          completedAt: enrollment.completedAt?.toISOString() ?? null,
        };
      }),

      reviews: reviewRows.map((review) => ({
        id: review.id,
        rating: review.rating,
        nps: review.nps,
        comment: review.comment,
        isPromoter: review.isPromoter,
        leftPublic: review.leftPublic,
        publicChannel: review.publicChannel,
        isPublished: review.isPublished,
        token: review.token,
        contactId: review.contactId,
        contactName: contact.fullName,
        opportunityId: review.opportunityId,
        submittedAt: review.submittedAt?.toISOString() ?? null,
        createdAt: review.createdAt.toISOString(),
      })),

      referrals: referralRows.map(({ referral, referrerName, referrerPhone }) => ({
        id: referral.id,
        code: referral.code,
        status: referral.status,
        channel: referral.channel,
        referrerContactId: referral.referrerContactId,
        referrerName,
        referrerPhone,
        refereeContactId: referral.refereeContactId,
        refereeName: null,
        refereeOpportunityId: referral.refereeOpportunityId,
        referrerReward: referral.referrerReward,
        refereeReward: referral.refereeReward,
        rewardPaidAt: referral.rewardPaidAt?.toISOString() ?? null,
        abuseFlag: referral.abuseFlag,
        createdAt: referral.createdAt.toISOString(),
        convertedAt: referral.convertedAt?.toISOString() ?? null,
      })),

      stages: stages.map((item) => ({
        id: item.id,
        key: item.key,
        name: item.name,
        sortOrder: item.sortOrder,
        probability: item.probability,
        isWon: item.isWon,
        isLost: item.isLost,
      })),

      owners,

      quotes: quoteRecords,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('[admin-api] inquiry detail failed:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
