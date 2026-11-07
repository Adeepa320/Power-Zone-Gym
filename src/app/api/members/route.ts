import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import type { FilterQuery } from 'mongoose';
import { connectDB } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { handleError, ok, readJson, requireAuth, sanitize, ApiError } from '@/lib/api';
import { registerSchema, membershipCategorySchema } from '@/lib/validations';
import { ensureMemberCurrentPayment, ensureMonthlyPayments } from '@/lib/payments';
import { currentMonthYear, escapeRegex } from '@/lib/utils';
import { PAGE_SIZE } from '@/lib/constants';
import User, { type UserDoc } from '@/models/User';
import Payment from '@/models/Payment';
import type { PaymentStatus } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/members  (admin)
 * Query: search, category, paymentStatus, active (true|false|all), sort, order, page, limit
 *        lite=1 → lightweight list for dropdowns (id, name, email, category)
 */
export async function GET(req: Request) {
  try {
    await requireAuth('admin');
    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: FilterQuery<UserDoc> = { role: 'member' };
    const search = searchParams.get('search')?.trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }
    const category = searchParams.get('category');
    if (category && membershipCategorySchema.safeParse(category).success) {
      filter.membershipCategory = category;
    }
    const active = searchParams.get('active') ?? 'all';
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;

    if (searchParams.get('lite') === '1') {
      const members = await User.find({ ...filter, isActive: true })
        .select('name email phone membershipCategory profileImage')
        .sort({ name: 1 })
        .lean();
      return ok(members);
    }

    await ensureMonthlyPayments();

    const sortField = searchParams.get('sort') ?? 'registeredDate';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;
    const allowedSort = ['name', 'registeredDate', 'membershipCategory', 'paymentStatus'];
    const sortKey = allowedSort.includes(sortField) ? sortField : 'registeredDate';

    const members = await User.find(filter)
      .sort(sortKey === 'paymentStatus' ? { registeredDate: -1 } : { [sortKey]: order })
      .lean();

    // Attach current-month payment status to each member.
    const { month, year } = currentMonthYear();
    const payments = await Payment.find({ month, year, member: { $in: members.map((m) => m._id) } })
      .select('member paymentStatus amount')
      .lean();
    const byMember = new Map(payments.map((p) => [p.member.toString(), p]));

    let items = members.map((m) => {
      const p = byMember.get(m._id.toString());
      return {
        ...m,
        currentPayment: p ? { _id: p._id, status: p.paymentStatus, amount: p.amount } : null,
      };
    });

    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus | null;
    if (paymentStatus && ['paid', 'pending', 'overdue'].includes(paymentStatus)) {
      items = items.filter((m) => m.currentPayment?.status === paymentStatus);
    }
    if (sortKey === 'paymentStatus') {
      const rank: Record<string, number> = { overdue: 0, pending: 1, paid: 2 };
      items.sort(
        (a, b) =>
          ((rank[a.currentPayment?.status ?? 'pending'] ?? 1) - (rank[b.currentPayment?.status ?? 'pending'] ?? 1)) *
          order,
      );
    }

    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || PAGE_SIZE, 1), 100);
    const total = items.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const page = Math.min(Math.max(Number(searchParams.get('page')) || 1, 1), totalPages);

    return ok({
      items: items.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/members — public registration (also used by admins to add members).
 * Creates the member and their first month's pending payment.
 */
export async function POST(req: Request) {
  try {
    // RATE LIMITING: throttle registrations per IP here in production
    // to prevent automated account creation.
    const body = sanitize(await readJson(req));
    const data = registerSchema.parse(body);

    await connectDB();
    const exists = await User.exists({ email: data.email });
    if (exists) throw new ApiError('An account with this email already exists', 409);

    const password = await bcrypt.hash(data.password, 12);
    const user = await User.create({
      ...data,
      password,
      role: 'member',
      isActive: true,
      registeredDate: new Date(),
      weightHistory: [{ weight: data.weight, date: new Date() }],
    });

    // Auto-generate the first month's pending payment.
    await ensureMemberCurrentPayment(user._id.toString(), user.membershipCategory);

    const session = await getServerSession(authOptions);
    const createdByAdmin = session?.user?.role === 'admin';

    return ok(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        membershipCategory: user.membershipCategory,
        createdByAdmin,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
