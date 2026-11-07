import { ApiError } from './api';
import { dataUrlBytes } from './utils';
import { MAX_CHART_IMAGE_BYTES } from './constants';
import type { ChartInput } from './validations';

/** Reject oversized data-URL images before they reach MongoDB (16MB document limit). */
export function assertImageSizes(data: Partial<ChartInput>) {
  if (data.chartImage && dataUrlBytes(data.chartImage) > MAX_CHART_IMAGE_BYTES) {
    throw new ApiError('Chart image is too large (max 1.5MB)', 413);
  }
  for (const ex of data.exercises ?? []) {
    if (ex.imageUrl && dataUrlBytes(ex.imageUrl) > MAX_CHART_IMAGE_BYTES / 2) {
      throw new ApiError(`Image for "${ex.name}" is too large`, 413);
    }
  }
}
