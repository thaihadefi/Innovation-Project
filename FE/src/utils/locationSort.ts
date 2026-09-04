type NamedItem = { name?: string | null };

export const sortLocationsWithOthersLast = <T extends NamedItem>(
  list: T[],
  locale: string = "vi"
): T[] => {
  const normal: T[] = [];
  const others: T[] = [];

  for (const item of list || []) {
    const name = `${item?.name ?? ""}`.trim().toLowerCase();
    if (name === "others" || name === "other") {
      others.push(item);
    } else {
      normal.push(item);
    }
  }

  normal.sort((a, b) =>
    `${a?.name ?? ""}`.localeCompare(`${b?.name ?? ""}`, locale)
  );

  return [...normal, ...others];
};
