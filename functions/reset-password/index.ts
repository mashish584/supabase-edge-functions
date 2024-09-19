/**
 * 👉 Email verification, for newly signed-up user
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);


async function updateUserPassword(password,accessToken) {
  const data = { password };

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'PUT',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      return {data: null, error: errorBody};
    }

    const result = await response.json();
    return {data: result, error:null};
  } catch (error) {
    return {data: null, error};
  }
}


Deno.serve(async (req) => {
  try{
    const { password } = await req.json()

    const authHeader = req.headers.get('Authorization');
    console.log(JSON.stringify({authHeader},null,2));
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
      });
    }
  
    const jwtToken = authHeader.split(" ")[1];
    const decodedAuthResponse = await supabase.auth.getUser(jwtToken);
    const user = decodedAuthResponse.data?.user;

    if(!user){
      return new Response(JSON.stringify({ message: 'Authroization failed.' }), {
        status: 401,
      });
    }

    if(!password){
      return new Response(JSON.stringify({ message: 'Please check the payload body.' }), {
        status: 422,
      });
    }

    const { error:updateUserError } = await updateUserPassword(password,jwtToken);
  
    if(updateUserError){
      return new Response(JSON.stringify({ message: updateUserError?.message || 'Server error.', error_code: updateUserError?.error_code  }), {
        status: updateUserError?.code || 500,
      });
    }

    const { error:updateProfileError } = await supabase
          .from('profiles')
          .update({ force_password_reset: false })
          .eq('id', user.id);
 
    if(updateProfileError){
      return new Response(JSON.stringify({ message: 'Server error.' }), {
        status: 500,
      });
    }
    
    return new Response(
      JSON.stringify({message : 'Success'}),
      { headers: { "Content-Type": "application/json" } },
    )
  }catch(error){
    console.log(error)
    return new Response(JSON.stringify({ message: 'Server error.' }), {
      status: 500,
    });
  }
})


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/reset-password' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6Ii9ZTWUzQnZOeHIyNnlYWnUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL29wdnRzc2thc3BtYWV2cWVuYm1sLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyZjBiOTY3MC1mMzg5LTQ3NTctYTM1Ni1lNGY4ZTkyZTlhMmQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzI1NDQ5Mjg1LCJpYXQiOjE3MjU0NDU2ODUsImVtYWlsIjoibWlrZUBtYWlsaW5hdG9yLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJtaWtlQG1haWxpbmF0b3IuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmdWxsX25hbWUiOiJNaWtlIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiIyZjBiOTY3MC1mMzg5LTQ3NTctYTM1Ni1lNGY4ZTkyZTlhMmQifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTcyNTQ0NTY4NX1dLCJzZXNzaW9uX2lkIjoiYmFhMmQxNWQtYzgzZC00YTEyLWJmYWQtM2JiZTU3ZjUwMTJkIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.1ir5vKTUuU4r1sCSvlda7mmvNB-NIqOQIc6gPt_1OWo' \
    --header 'Content-Type: application/json' \
    --data '{"password":"adminpass1234"}'

*/
