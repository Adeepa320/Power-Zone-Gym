import { connectDB } from '@/lib/db';
import { ApiError, assertSelfOrAdmin, handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { objectIdSchema, workoutPlanSchema } from '@/lib/validations';
import User from '@/models/User';
import MemberWorkoutPlan from '@/models/MemberWorkoutPlan';

export const dynamic = 'force-dynamic';

type Ctx = { params: { memberId: string } };

const MEMBER_FIELDS = 'name email phone membershipCategory profileImage fitnessGoal';

/** GET /api/workout-plans/:memberId — admin, or the member themself. Returns the plan or null. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth();
    const memberId = objectIdSchema.parse(params.memberId);
    assertSelfOrAdmin(session, memberId);
    await connectDB();

    const plan = await MemberWorkoutPlan.findOne({ member: memberId })
      .populate('member', MEMBER_FIELDS)
      .populate('updatedBy', 'name')
      .lean();
    return ok(plan ?? null);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/workout-plans/:memberId  (admin)
 * Creates or replaces the member's personal plan. Days are renumbered 1..n in the order sent.
 */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth('admin');
    const memberId = objectIdSchema.parse(params.memberId);
    const data = workoutPlanSchema.parse(sanitize(await readJson(req)));
    await connectDB();

    const member = await User.exists({ _id: memberId, role: 'member' });
    if (!member) throw new ApiError('Member not found', 404);

    const plan = await MemberWorkoutPlan.findOneAndUpdate(
      { member: memberId },
      {
        $set: {
          gymName: data.gymName,
          planTitle: data.planTitle,
          startDate: data.startDate,
          notes: data.notes,
          days: data.days.map((d, i) => ({ ...d, dayNumber: i + 1 })),
          updatedBy: session.user.id,
        },
        $setOnInsert: { member: memberId },
      },
      { upsert: true, new: true, runValidators: true },
    )
      .populate('member', MEMBER_FIELDS)
      .populate('updatedBy', 'name')
      .lean();

    return ok(plan);
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/workout-plans/:memberId  (admin) */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireAuth('admin');
    const memberId = objectIdSchema.parse(params.memberId);
    await connectDB();
    const res = await MemberWorkoutPlan.deleteOne({ member: memberId });
    if (res.deletedCount === 0) throw new ApiError('This member has no workout plan', 404);
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
