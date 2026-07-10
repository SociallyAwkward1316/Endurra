import {createClient} from "@supabase/supabase-js"
import "dotenv/config"

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default supabase
