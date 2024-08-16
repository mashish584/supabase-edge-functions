
/**
 * 👉 On email sign-up, send welcome email to user
 *    with verification code.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ZOHO_TOKEN = Deno.env.get('ZOHO_TOKEN');

const ENABLE_MAIL = false;

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

function generateRandomCode(length: number): number {
  if (length <= 0) {
    throw new Error("Length must be a positive integer.");
  }
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function updateTokenInProfilesTable(userId:string){
  try{
    const token = generateRandomCode(4);
    const { error:updateError } = await supabase
          .from('profiles')
          .update({ verification_token : token, verification_timestamp: new Date().toISOString() })
          .eq('id', userId);

    if(updateError){
      return null;
    }

    return token;
  }catch(error){
    console.log(`Error: Update verification token in profiles table.`);
    return null;
  }
}

Deno.serve(async (req) => {
  try{
    const { email, id, raw_user_meta_data } = await req.json()
    const token = await updateTokenInProfilesTable(id);
    if(token === null){
      return new Response(
        JSON.stringify({message: "Error while generating confirmation token."}),
        { headers: { "Content-Type": "application/json" } },
      )
    }

    if(ENABLE_MAIL && email && token){
     console.log(`Sending welcome email to ${email}`);
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
                name: raw_user_meta_data.full_name
              }
            }
          ],
          subject: "Welcome to MoneyPal",
          htmlbody: `<div>Please use the following code to verify your account: <b>${token}</b></div>`
        })
      })
      response = await response.json();
    }else{
      response = {};
    }

    return new Response(
      JSON.stringify({message: response.error ? "Error" : "Success", response}),
      { headers: { "Content-Type": "application/json" } },
    )
  }catch(error){
    console.log("Error \n");
    console.log(JSON.stringify(error,null,2))
    return new Response(
      JSON.stringify({message: "Error", error}),
      { headers: { "Content-Type": "application/json" } },
    )
  }
})