import type { FilterQuery } from 'mongoose';
import { connectDB } from '@/lib/db';
import { handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { chartCategorySchema, chartSchema } from '@/lib/validations';
import { escapeRegex } from '@/lib/utils';
import { assertImageSizes } from '@/lib/charts';
import WorkoutChart, { type WorkoutChartDoc } from '@/models/WorkoutChart';

export const dynamic = 'force-dynamic';

/**
 * GET /api/charts
 * Admin: all charts (query: category, search). Member: charts assigned to them.
 */
export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: FilterQuery<WorkoutChartDoc> = {};
    if (session.user.role !== 'admin') filter.assignedTo = session.user.id;

    const category = searchParams.get('category');
    if (category && chartCategorySchema.safeParse(category).success) filter.category = category;
    const search = searchParams.get('search')?.trim();
    if (search) filter.title = new RegExp(escapeRegex(search), 'i');

    const charts = await WorkoutChart.find(filter)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name email membershipCategory profileImage')
      .sort({ updatedAt: -1 })
      .lean();
    return ok(charts);
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/charts  (admin) — create a workout chart. */
export async function POST(req: Request) {
  try {
    const session = await requireAuth('admin');
    const data = chartSchema.parse(sanitize(await readJson(req)));
    assertImageSizes(data);

    await connectDB();
    const chart = await WorkoutChart.create({
      ...data,
      chartImage: data.chartImage || undefined,
      exercises: data.exercises.map((e) => ({ ...e, imageUrl: e.imageUrl || undefined })),
      createdBy: session.user.id,
      assignedTo: [],
    });
    return ok(chart, 201);
  } catch (error) {
    return handleError(error);
  }
}
