export type ScheduleItem = {
  meta: {
    scheduledStart: string;
  };
  props: {
    href: string;
    label?: string;
  };
};

export type Schedule = {
  items: ScheduleItem[];
};

export type Entity = {
  props: {
    href: string;
    secondaryLabel: string;
    title: string;
  };
};

export type GroupDefinition = {
  id: string;
};

export type Channel = {
  groups: GroupDefinition[];
  highlights: {
    items: Entity[];
  };
};

export type Group = {
  entities: Entity[];
  header: {
    subtitle: string;
    title: string;
  };
};
