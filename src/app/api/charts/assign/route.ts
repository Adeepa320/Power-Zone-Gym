import { connectDB } from '@/lib/db';
import { ApiError, handleError, ok, readJson, requireAuth, sanitize } from '@/lib/api';
import { assignChartSchema } from '@/lib/validations';
import WorkoutChart from '@/models/WorkoutChart';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

/**
 * POST /api/charts/assign  (admin)
 * Body: { memberId, chartId | null }
 * Replaces the member's current chart (or unassigns when chartId is null).
 */
export async function POST(req: Request) {
  try {
    await requireAuth('admin');
    const { memberId, chartId } = assignChartSchema.parse(sanitize(await readJson(req)));
    await connectDB();

    const member = await User.findOne({ _id: memberId, role: 'member' });
    if (!member) throw new ApiError('Member not found', 404);

    if (chartId) {
      const exists = await WorkoutChart.exists({ _id: chartId });
      if (!exists) throw new ApiError('Chart not found', 404);
    }

    // Remove the member from any previously assigned chart.
    await WorkoutChart.updateMany({ assignedTo: memberId }, { $pull: { assignedTo: memberId } });

    if (chartId) {
      await WorkoutChart.updateOne({ _id: chartId }, { $addToSet: { assignedTo: memberId } });
    }
    member.set('assignedChart', chartId ?? null);
    await member.save();

    const chart = chartId ? await WorkoutChart.findById(chartId).lean() : null;
    return ok({ memberId, chart });
  } catch (error) {
    return handleError(error);
  }
}
