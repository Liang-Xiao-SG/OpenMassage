import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;

const supabaseUrl = extra?.REACT_APP_SUPABASE_URL;
const supabaseKey = extra?.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase URL not found in config');
}

const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase