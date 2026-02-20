import { supabase } from "@/integrations/supabase/client";

/**
 * Temporary escape hatch for when generated DB typings are out of sync.
 * Use ONLY to avoid build breaks; prefer the typed client when available.
 */
export const supabaseUnsafe = supabase as any;
