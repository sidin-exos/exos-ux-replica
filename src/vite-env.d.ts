/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_LANGCHAIN_TRACING_V2?: string;
  readonly VITE_LANGCHAIN_API_KEY?: string;
  readonly VITE_LANGCHAIN_PROJECT?: string;
  readonly VITE_LANGCHAIN_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
