// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ZOHO_TOKEN = Deno.env.get('ZOHO_TOKEN');

const ENABLE_MAIL = true;

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

function generateRandomPassword() {
  const length = Math.floor(Math.random() * 7) + 6; // Random length between 6 and 12
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

Deno.serve(async (req) => {
 try{
  const { email } = await req.json()

  const {data:profileData, error:profileDataError} = await supabase.from("profiles").select("*").eq("email", email);

  if(profileDataError){
    return new Response(JSON.stringify({ message: 'Server error.' }), {
      status: 500,
    });
  }

  const profileInfo = profileData?.[0];

  if(profileInfo){
    const password = generateRandomPassword();  
    const { error:updateUserError } = await supabase.auth.admin.updateUserById(profileInfo.id,{
      password: password
    })
  
    if(updateUserError){
      return new Response(JSON.stringify({ message: 'Server error.' }), {
        status: 500,
      });
    }


    // Send information to user email
    if(ENABLE_MAIL && email){
      var response = await fetch("https://api.zeptomail.in/v1.1/email", {
         method: "POST",
         headers: {
           "Accept": "application/json",
           "Content-Type": "application/json",
           "Authorization": ZOHO_TOKEN
         },
         body: JSON.stringify({
           from: { address: "moneypal@ashishmehra.dev" },
           to: [
             {
               email_address: {
                 address: email,
                 name: profileInfo.full_name
               }
             }
           ],
           subject: "Password Recovery",
           htmlbody: `<div>We've successfully generated a new password for your account as requested. Please use the new password provided below to access your profile. For security reasons, we recommend updating your password immediately through the app settings.: <b>${password}</b></div>`
         })
      })
      response = await response.json();
      console.log({response});
     }else{
       response = {};
     }
  }
  
  return new Response(
    JSON.stringify({message:"success"}),
    { headers: { "Content-Type": "application/json" } },
  )
 }catch(error){
  console.log(error);
  return new Response(JSON.stringify({ message: 'Server error.' }), {
    status: 500,
  });
 }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/forgot-password' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
