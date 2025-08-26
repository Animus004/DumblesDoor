// The reference to vite/client has been removed to avoid a type resolution error.
// Instead, we manually define the types for `import.meta.env` to ensure
// type-safety throughout the application.

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
