import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { ApiError, assertSelfOrAdmin, handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { adminMemberUpdateSchema, memberSelfUpdateSchema, objectIdSchema } from '@/lib/validations';
import { getPricing } from '@/lib/settings';
import { ensureMemberCurrentPayment } from '@/lib/payments';
import { currentMonthYear, dataUrlBytes } from '@/lib/utils';
import { MAX_PROFILE_IMAGE_BYTES } from '@/lib/constants';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Attendance from '@/models/Attendance';
import WorkoutChart from '@/models/WorkoutChart';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

/** GET /api/members/:id — admin, or the member themself. Includes the assigned chart. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth();
    const id = objectIdSchema.parse(params.id);
    assertSelfOrAdmin(session, id);

    await connectDB();
    const user = await User.findById(id)
      .populate({ path: 'assignedChart', populate: { path: 'createdBy', select: 'name' } })
      .lean();
    if (!user) throw new ApiError('Member not found', 404);
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/members/:id
 * Admin: may update any field (including category & active status).
 * Member: may update phone, address, weight, height, health, goal, profile image.
 * Weight changes are appended to weightHistory for tracking.
 */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth();
    const id = objectIdSchema.parse(params.id);
    assertSelfOrAdmin(session, id);
    const isAdmin = session.user.role === 'admin';

    const body = sanitize(await readJson(req));
    const data = isAdmin ? adminMemberUpdateSchema.parse(body) : memberSelfUpdateSchema.parse(body);

    if (data.profileImage && dataUrlBytes(data.profileImage) > MAX_PROFILE_IMAGE_BYTES) {
      throw new ApiError('Profile image is too large (max 300KB)', 413);
    }

    await connectDB();
    const user = await User.findById(id);
    if (!user) throw new ApiError('Member not found', 404);

    const update: Record<string, unknown> = { ...data };

    if ('email' in data && data.email && data.email !== user.email) {
      const taken = await User.exists({ email: data.email, _id: { $ne: id } });
      if (taken) throw new ApiError('Email is already in use', 409);
    }
    const newPassword = (data as { password?: string }).password;
    if (newPassword) {
      update.password = await bcrypt.hash(newPassword, 12);
    }
    if (data.profileImage === '') update.profileImage = undefined;

    // Track weight changes
    if (data.weight !== undefined && data.weight !== user.weight) {
      user.weightHistory.push({ weight: data.weight, date: new Date() });
    }

    const previousCategory = user.membershipCategory;
    const wasActive = user.isActive;
    user.set(update);
    await user.save();

    // Category changed → update the current month's unpaid fee.
    if (isAdmin && user.membershipCategory !== previousCategory) {
      const pricing = await getPricing();
      const { month, year } = currentMonthYear();
      await Payment.updateOne(
        { member: id, month, year, paymentStatus: { $ne: 'paid' } },
        { $set: { amount: pricing[user.membershipCategory] } },
      );
    }
    // Reactivated → make sure there's a payment record for this month.
    if (isAdmin && !wasActive && user.isActive && user.role === 'member') {
      await ensureMemberCurrentPayment(id, user.membershipCategory);
    }

    const fresh = await User.findById(id).populate('assignedChart').lean();
    return ok(fresh);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/members/:id  (admin)
 * Permanently deletes the member with their payments & attendance.
 * (Use PUT { isActive: false } to deactivate instead.)
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth('admin');
    const id = objectIdSchema.parse(params.id);
    if (id === session.user.id) throw new ApiError('You cannot delete your own account', 400);

    await connectDB();
    const user = await User.findById(id);
    if (!user) throw new ApiError('Member not found', 404);
    if (user.role === 'admin') throw new ApiError('Admin accounts cannot be deleted here', 400);

    await Promise.all([
      Payment.deleteMany({ member: id }),
      Attendance.deleteMany({ member: id }),
      WorkoutChart.updateMany({ assignedTo: id }, { $pull: { assignedTo: id } }),
      user.deleteOne(),
    ]);
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
