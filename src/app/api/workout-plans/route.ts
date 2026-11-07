import type { FilterQuery } from 'mongoose';
import { connectDB } from '@/lib/db';
import { handleError, ok, requireAuth } from '@/lib/api';
import { membershipCategorySchema } from '@/lib/validations';
import { escapeRegex } from '@/lib/utils';
import User, { type UserDoc } from '@/models/User';
import MemberWorkoutPlan from '@/models/MemberWorkoutPlan';
import type { MemberPlanListItem } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workout-plans  (admin)
 * Every active member with a summary of their personal plan (or null).
 * Query: search, category, status = all | with | without
 */
export async function GET(req: Request) {
  try {
    await requireAuth('admin');
    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: FilterQuery<UserDoc> = { role: 'member', isActive: true };
    const search = searchParams.get('search')?.trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    const category = searchParams.get('category');
    if (category && membershipCategorySchema.safeParse(category).success) filter.membershipCategory = category;

    const members = await User.find(filter)
      .select('name email phone membershipCategory profileImage fitnessGoal')
      .sort({ name: 1 })
      .lean();

    const plans = await MemberWorkoutPlan.find({ member: { $in: members.map((m) => m._id) } })
      .select('member planTitle days.dayTitle days.exercises.name days.exercises.isGroupDivider updatedAt')
      .lean();
    const byMember = new Map(plans.map((p) => [p.member.toString(), p]));

    let items = members.map((m) => {
      const p = byMember.get(m._id.toString());
      return {
        member: m,
        plan: p
          ? {
              _id: p._id,
              planTitle: p.planTitle,
              dayCount: p.days.length,
              exerciseCount: p.days.reduce((n, d) => n + d.exercises.filter((e) => !e.isGroupDivider).length, 0),
              dayTitles: p.days.map((d) => d.dayTitle ?? ''),
              updatedAt: p.updatedAt,
            }
          : null,
      };
    });

    const status = searchParams.get('status');
    if (status === 'with') items = items.filter((i) => i.plan);
    if (status === 'without') items = items.filter((i) => !i.plan);

    return ok(items as unknown as MemberPlanListItem[]);
  } catch (error) {
    return handleError(error);
  }
}
