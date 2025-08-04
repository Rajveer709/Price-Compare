import { supabase } from '../lib/supabase';

const testSupabaseConnection = async () => {
  console.log('Testing Supabase connection...');
  
  // Test 1: Check if Supabase client is initialized
  if (!supabase) {
    console.error('❌ Supabase client is not initialized');
    return false;
  }
  console.log('✅ Supabase client is initialized');

  // Test 2: Try to make a simple query to check connection
  try {
    console.log('Testing Supabase connection with a simple query...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Successfully connected to Supabase');
    console.log('Sample data:', data);
    return true;
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return false;
  }
};

// Run the test when this file is imported
testSupabaseConnection().then(success => {
  if (success) {
    console.log('✅ Supabase connection test completed successfully');
  } else {
    console.error('❌ Supabase connection test failed');
  }
});

export default testSupabaseConnection;
