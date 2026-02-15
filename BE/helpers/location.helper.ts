import Location from "../models/location.model";
import { convertToSlug } from "./slugify.helper";
import { escapeRegex } from "./query.helper";

export const normalizeLocationSlug = (value: unknown): string =>
  convertToSlug(String(value ?? ""));

export const findLocationByNormalizedSlug = async (locationSlug: string) => {
  if (!locationSlug) return null;

  let location = await Location.findOne({ slug: locationSlug })
    .select("_id")
    .lean();

  if (!location) {
    const suffixMatch = locationSlug.match(/-(?:[a-f0-9]{6})$/i);
    if (suffixMatch) {
      const baseSlug = locationSlug.replace(/-(?:[a-f0-9]{6})$/i, "");
      const escapedBaseSlug = escapeRegex(baseSlug);
      location = await Location.findOne({
        slug: { $regex: `^${escapedBaseSlug}`, $options: "i" },
      })
        .select("_id")
        .lean();
    }
  }

  return location;
};
