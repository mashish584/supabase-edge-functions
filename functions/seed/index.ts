/**
 * 👉 Seeding function
 	 
	curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/seed' \
    --header 'Content-Type: application/json' \
    --data '{"type":"transactions"}'
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

const purchaseItems = [
	"TV",
	"Netflix subscription",
	"Dinner",
	"Domino's Pizza",
	"Groceries",
	"Laptop",
	"Phone",
	"Headphones",
	"Shoes",
	"Clothes",
	"Books",
	"Movie Tickets",
	"Gym Membership",
	"Coffee",
	"Airline Tickets",
	"Hotel Booking",
	"Furniture",
	"Video Game",
	"Bicycle",
	"Camera",
	"Smartwatch",
	"Tablet",
	"Microwave",
	"Washing Machine",
	"Refrigerator",
	"Car Service",
	"Pet Supplies",
	"Cosmetics",
	"Concert Tickets",
	"Gift Card",
	"Online Course",
	"Guitar",
	"Home Decor",
	"Fitness Equipment",
	"Subscription Box",
	"Streaming Service",
	"Parking",
	"Software License",
	"Fast Food",
	"Toys",
	"Stationery",
	"Bakery Items",
	"Jewelry",
	"Sunglasses",
	"Accessories",
	"Organic Food",
	"Office Supplies",
	"Cleaning Supplies",
	"Pharmacy",
	"Spa Treatment",
	"Haircut",
	"Taxi",
	"Fuel",
	"Electric Scooter",
	"Plant",
	"Flowers",
	"Chocolate",
	"Wine",
	"Beer",
	"Cigarettes",
	"Sports Equipment",
	"Fitness Tracker",
	"Video Streaming",
	"Music Streaming",
	"Online Storage",
	"Backup Service",
	"Web Hosting",
	"Domain Name",
	"VPN Service",
	"Magazine Subscription",
	"Newspaper Subscription",
	"Craft Supplies",
	"Art Supplies",
	"Photography Equipment",
	"Lenses",
	"Tripod",
	"Backpack",
	"Luggage",
	"Travel Insurance",
	"Baby Products",
	"Diapers",
	"Baby Food",
	"Pet Food",
	"Pet Toys",
	"Board Game",
	"Puzzle",
	"VR Headset",
	"Drone",
	"E-book",
	"Digital Camera",
	"Wireless Charger",
	"Smart Light",
	"Smart Plug",
	"Smart Lock",
	"Home Security System",
	"Thermostat",
	"Cooking Equipment",
	"Bakeware",
	"Outdoor Gear",
	"Camping Equipment",
	"Garden Supplies",
	"Power Tools",
	"Hand Tools",
	"Electric Scooter",
	"Skateboard",
	"Roller Skates",
	"Action Camera",
	"Bluetooth Speaker",
];

const transaction_types = ["income", "expense", "transfer"];

function getCreatedAt() {
	const today = new Date();
	const last12Months = new Date();
	last12Months.setMonth(today.getMonth() - 12);
	const randomTimestamp = Math.random() * (today.getTime() - last12Months.getTime()) + last12Months.getTime();
	return new Date(randomTimestamp);
}

async function getAvailableCategories() {
	const response = await supabase.from("categories").select("id");
	if (response.data) {
		return response.data.map((data) => data.id);
	}
	return [];
}

function getRandomNumber(min = 10, max = 10000, isFloating = false) {
	return isFloating ? (Math.random() * (max - min + 1) + min).toFixed(2) : Math.floor(Math.random() * (max - min + 1)) + min;
}

const user_id = "8cfbb1e6-e6e4-48f1-9341-f01443782773";

async function seedingTransactions(){
	console.log(`Fetching categories...`);
	const categoryIds = await getAvailableCategories();
	console.log(`Seeding transactions...`);
	for (let i = 0; i < 1000; i++) {
		const created_at = getCreatedAt().toISOString();
		const name = purchaseItems[Math.floor(Math.random() * purchaseItems.length)];
		const description =
			"Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh viverra non semper suscipit posuere a pede.";
		const short_description = `Purchase ${name}`;
		const amount = getRandomNumber(2, 2500, true);
		const category = categoryIds[Math.floor(Math.random() * categoryIds.length)];
		const type = transaction_types[Math.floor(Math.random() * transaction_types.length)];

		const response = await supabase
			.from("transactions")
			.insert({ created_at, name, description, short_description, amount, category, type, user_id });
		if (!response.error) {
			const percentage = (i / 1000) * 100;
			if (percentage > 0 && percentage % 10 === 0) {
				console.log(`${percentage}% data seed.`);
			}
		}
	}
	console.log(`🎉 Seeding done.`);
}



Deno.serve(async (req) => {
  try{
		const { type } = req.json();
		if(type  === "transactions"){
			await seedingTransactions();
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