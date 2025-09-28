import PocketBase, { RecordService } from 'pocketbase';

declare global {
  export type Issue = {
    title: string;
    isPublished: boolean;
    publishDate: string;
  };

  export type Magazine={
    magazineUrl:string;
  }

  export interface TypedPocketbase extends PocketBase {
    collection: (idOrName: string) => RecordService<Issue>;
  }
}

export { };

