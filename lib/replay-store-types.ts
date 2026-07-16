export type ReplaySourcesStore = Record<
  number,
  {
    cctv?: string;
    migu?: string;
    youtube?: string;
  }
>;
