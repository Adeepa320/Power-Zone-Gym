import { connectDB } from '@/lib/db';
import { ApiError, handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { chartSchema, objectIdSchema } from '@/lib/validations';
import WorkoutChart from '@/models/WorkoutChart';
import User from '@/models/User';
import { assertImageSizes } from '@/lib/charts';

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

/** GET /api/charts/:id — admin, or a member the chart is assigned to. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const session = await requireAuth();
    const id = objectIdSchema.parse(params.id);
    await connectDB();

    const chart = await WorkoutChart.findById(id)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name email membershipCategory profileImage')
      .lean();
    if (!chart) throw new ApiError('Chart not found', 404);

    if (
      session.user.role !== 'admin' &&
      !chart.assignedTo.some((m) => (m as { _id: { toString(): string } })._id.toString() === session.user.id)
    ) {
      throw new ApiError('You do not have access to this chart', 403);
    }
    return ok(chart);
  } catch (error) {
    return handleError(error);
  }
}

/** PUT /api/charts/:id  (admin) — assigned members see the update immediately. */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    await requireAuth('admin');
    const id = objectIdSchema.parse(params.id);
    const data = chartSchema.parse(sanitize(await readJson(req)));
    assertImageSizes(data);

    await connectDB();
    const chart = await WorkoutChart.findById(id);
    if (!chart) throw new ApiError('Chart not found', 404);

    chart.set({
      title: data.title,
      category: data.category,
      description: data.description,
      chartImage: data.chartImage || undefined,
      exercises: data.exercises.map((e) => ({ ...e, imageUrl: e.imageUrl || undefined })),
    });
    await chart.save();
    return ok(chart);
  } catch (error) {
    return handleError(error);
  }
}

/** DELETE /api/charts/:id  (admin) — also unassigns it from members. */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireAuth('admin');
    const id = objectIdSchema.parse(params.id);
    await connectDB();

    const chart = await WorkoutChart.findById(id);
    if (!chart) throw new ApiError('Chart not found', 404);

    await Promise.all([
      User.updateMany({ assignedChart: id }, { $set: { assignedChart: null } }),
      chart.deleteOne(),
    ]);
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
