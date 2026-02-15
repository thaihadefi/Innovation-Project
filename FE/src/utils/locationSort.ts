export const sortLocationsWithOthersLast = (list: any[], locale: string = "vi") => {
  const normal: any[] = [];
  const others: any[] = [];

  for (const item of list || []) {
    const name = `${item?.name ?? ""}`.trim().toLowerCase();
    if (name === "others" || name === "other") {
      others.push(item);
    } else {
      normal.push(item);
    }
  }

  normal.sort((a: any, b: any) =>
    `${a?.name ?? ""}`.localeCompare(`${b?.name ?? ""}`, locale)
  );

  return [...normal, ...others];
};
