/**
 * 👉 Email verification, for newly signed-up user
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

Deno.serve(async (req) => {
  try{
    const { token } = await req.json()
    const authHeader = req.headers.get('Authorization');

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

    if(!token){
      return new Response(JSON.stringify({ message: 'Please check the payload body.' }), {
        status: 422,
      });
    }

    const { data:profileData, error:profileError } = await supabase.from("profiles").select("verification_token").eq('id',user.id);
   
    if(profileError){
      return new Response(JSON.stringify({ message: 'Server error.' }), {
        status: 500,
      });
    }
 
    if(profileData){
      const verification_token = profileData[0].verification_token;
      if(token !== verification_token){
        return new Response(JSON.stringify({ message: 'Verification code is not valid.' }), {
          status: 400,
        });
      }
    }

    const { error:updateError } = await supabase
          .from('profiles')
          .update({ verification_token : null, email_verified: true, verification_timestamp: new Date().toISOString() })
          .eq('id', user.id);
 
    if(updateError){
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
