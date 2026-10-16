export type WorkboardAccess = {
  board_create: boolean;
  board_view: boolean;
  board_delete: boolean;
  list_create: boolean;
  list_view: boolean;
  list_delete: boolean;
  card_create: boolean;
  card_view: boolean;
  card_delete: boolean;
};

export const FULL_ACCESS: WorkboardAccess = {
  board_create: true,
  board_view: true,
  board_delete: true,
  list_create: true,
  list_view: true,
  list_delete: true,
  card_create: true,
  card_view: true,
  card_delete: true,
};

export const NONE_ACCESS: WorkboardAccess = {
  board_create: false,
  board_view: false,
  board_delete: false,
  list_create: false,
  list_view: false,
  list_delete: false,
  card_create: false,
  card_view: false,
  card_delete: false,
};

export const VIEW_ACCESS: WorkboardAccess = {
  ...NONE_ACCESS,
  board_view: true,
  list_view: true,
  card_view: true,
};

export const BOARD_CONTROL: WorkboardAccess = {
  ...FULL_ACCESS,
  board_create: false,
};

export const ACCESS_GROUPS: { title: string; keys: (keyof WorkboardAccess)[] }[] = [
  { title: 'This board', keys: ['board_view', 'board_delete'] },
  { title: 'Lists on this board', keys: ['list_create', 'list_view', 'list_delete'] },
  { title: 'Cards on this board', keys: ['card_create', 'card_view', 'card_delete'] },
];

export const cleanAccess = (input?: Partial<WorkboardAccess> | null): WorkboardAccess => ({
  board_create: false,
  board_view: !!input?.board_view,
  board_delete: !!input?.board_delete,
  list_create: !!input?.list_create,
  list_view: !!input?.list_view,
  list_delete: !!input?.list_delete,
  card_create: !!input?.card_create,
  card_view: !!input?.card_view,
  card_delete: !!input?.card_delete,
});

export const hasAnyAccess = (access?: Partial<WorkboardAccess> | null) =>
  !!access && ACCESS_GROUPS.some(group => group.keys.some(key => access[key]));

export const accessLabel = (key: keyof WorkboardAccess) => {
  const action = key.split('_')[1] || '';
  return action.charAt(0).toUpperCase() + action.slice(1);
};
