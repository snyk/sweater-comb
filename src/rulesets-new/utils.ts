export const isBreakingChangeAllowed = (stability: string): boolean => {
  return stability === "wip" || stability === "experimental";
};
