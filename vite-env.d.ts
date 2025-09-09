// The reference to vite/client has been removed to avoid a type resolution error.
// Instead, we manually define the types for `import.meta.env` to ensure
// type-safety throughout the application.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// FIX: Add an empty export to treat this file as a module.
// This is necessary for the `declare global` block to augment the global scope correctly.
// Resolves TS2669: "Augmentations for the global scope can only be directly nested in external modules..."
// and consequently fixes all TS2339 errors related to `import.meta.env` being undefined.
export {};