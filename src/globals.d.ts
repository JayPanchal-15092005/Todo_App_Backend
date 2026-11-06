declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    DATABASE_URL?: string;
    PORT?: string;
    EXPO_PUBLIC_API_URL?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
  exit?: (code?: number) => never;
};
