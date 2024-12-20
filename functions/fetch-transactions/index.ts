// fetchTransactions.ts
import { createClient } from 'https://supabase.com/docs/reference/javascript/supabase-client';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

function sendResponse(data,statusCode){
  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" }, status: statusCode },
  )
}

Deno.serve(async (req) => {
  const { filter, config } = await req.json();

  const { dateRange, transactionType } = filter;
  const { sort, limit } = config;

  let query = supabase
    .from('transactions')
    .select('*, category(id,name,image)');

  if (dateRange?.startDate && dateRange?.endDate) {
    query = query.filter('created_at', 'gte', dateRange.startDate);
    query = query.filter('created_at', 'lt', dateRange.endDate);
  }

  if (transactionType) {
    query = query.filter('type', 'in', `(${transactionType.map((type) => `"${type}"`).join(',')})`);
  }

  if (limit) {
    query = query.limit(limit);
  }

  if (sort?.key && sort?.value) {
    query = query.order(sort.key, { ascending: sort.value == 1 });
  }

  const { data, error } = await query;

  if (error) {
    return sendResponse({ message: 'Server error.' },500);
  }

  return sendResponse({message:"success", data},200);
}).catch(error){
  return sendResponse({ message: 'Server error.' },500);
}
