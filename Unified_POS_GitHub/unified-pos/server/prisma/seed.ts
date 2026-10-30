import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const ALL = "I_BAR,SERVICE_BAR,QUICKIE_BAR";

async function main() {
     console.log("Seeding database...");
    // --- Users ---
    const admin = await prisma.user.create({ data: { name: "Administrator", pin: "0000", role: "ADMIN" } });
    await prisma.user.create({ data: { name: "Bartender 1", pin: "1111", role: "BARTENDER" } });
    const bartender2 = await prisma.user.create({ data: { name: "Bartender 2", pin: "2222", role: "BARTENDER" } });
    const server1 = await prisma.user.create({ data: { name: "Server 1", pin: "3333", role: "SERVER" } });
    await prisma.user.create({ data: { name: "Server 2", pin: "4444", role: "SERVER" } });
    console.log("  Created 5 users");
    // --- Menu Items ---
    const menuItems = [
    // --- Beer - Draft ---
    { name: "Bud Light Draft",    category: "Beer - Draft", price: 5.0,  availableAt: ALL },
    { name: "Miller Lite Draft",  category: "Beer - Draft", price: 5.0,  availableAt: ALL },
    { name: "Coors Light Draft",  category: "Beer - Draft", price: 5.0,  availableAt: ALL },
    { name: "Blue Moon Draft",    category: "Beer - Draft", price: 6.5,  availableAt: "I_BAR,SERVICE_BAR" },
    { name: "Yuengling Draft",    category: "Beer - Draft", price: 5.5,  availableAt: ALL },
    { name: "Guinness Draft",     category: "Beer - Draft", price: 7.0,  availableAt: "SERVICE_BAR" },
    { name: "Stella Artois Draft",category: "Beer - Draft", price: 6.5,  availableAt: "I_BAR" },
    { name: "IPA Draft",          category: "Beer - Draft", price: 7.0,  availableAt: "SERVICE_BAR" },
    { name: "Amber Ale Draft",    category: "Beer - Draft", price: 6.5,  availableAt: "QUICKIE_BAR" },
    { name: "Wheat Ale Draft",    category: "Beer - Draft", price: 6.0,  availableAt: "I_BAR,QUICKIE_BAR" },

    // --- Beer - Bottle/Can ---
    { name: "Budweiser Bottle",   category: "Beer - Bottle", price: 4.5, availableAt: ALL },
    { name: "Corona Bottle",      category: "Beer - Bottle", price: 5.5, availableAt: ALL },
    { name: "Heineken Bottle",    category: "Beer - Bottle", price: 5.5, availableAt: ALL },
    { name: "Modelo Bottle",      category: "Beer - Bottle", price: 5.5, availableAt: ALL },
    { name: "Michelob Ultra",     category: "Beer - Bottle", price: 5.0, availableAt: ALL },
    { name: "Dos Equis",          category: "Beer - Bottle", price: 5.5, availableAt: ALL },
    { name: "Stella Artois Bottle", category: "Beer - Bottle", price: 6.0, availableAt: ALL },
    { name: "White Claw",         category: "Beer - Bottle", price: 5.5, availableAt: ALL },
    { name: "Truly Seltzer",      category: "Beer - Bottle", price: 5.5, availableAt: ALL },
    { name: "High Noon",          category: "Beer - Bottle", price: 6.0, availableAt: ALL },

    // --- Cocktails ---
    { name: "Margarita",          category: "Cocktail", price: 9.5,  availableAt: ALL },
    { name: "Long Island",        category: "Cocktail", price: 10.0, availableAt: ALL },
    { name: "Moscow Mule",        category: "Cocktail", price: 9.0,  availableAt: ALL },
    { name: "Old Fashioned",      category: "Cocktail", price: 11.0, availableAt: ALL },
    { name: "Jack & Coke",        category: "Cocktail", price: 8.0,  availableAt: ALL },
    { name: "Rum & Coke",         category: "Cocktail", price: 7.5,  availableAt: ALL },
    { name: "Vodka Cranberry",    category: "Cocktail", price: 7.5,  availableAt: ALL },
    { name: "Gin & Tonic",        category: "Cocktail", price: 8.0,  availableAt: ALL },
    { name: "Whiskey Sour",       category: "Cocktail", price: 9.0,  availableAt: ALL },
    { name: "Tequila Sunrise",    category: "Cocktail", price: 9.0,  availableAt: ALL },
    { name: "Mojito",             category: "Cocktail", price: 9.5,  availableAt: ALL },
    { name: "Piña Colada",        category: "Cocktail", price: 10.0, availableAt: ALL },
    { name: "Cosmopolitan",       category: "Cocktail", price: 9.5,  availableAt: ALL },
    { name: "Mai Tai",            category: "Cocktail", price: 10.0, availableAt: ALL },
    { name: "Amaretto Sour",      category: "Cocktail", price: 8.5,  availableAt: ALL },
    { name: "Tom Collins",        category: "Cocktail", price: 8.5,  availableAt: ALL },
    { name: "Paloma",             category: "Cocktail", price: 9.0,  availableAt: ALL },
    { name: "Screwdriver",        category: "Cocktail", price: 7.5,  availableAt: ALL },
    { name: "Cape Cod",           category: "Cocktail", price: 7.5,  availableAt: ALL },
    { name: "7 & 7",              category: "Cocktail", price: 7.5,  availableAt: ALL },

    // --- Shots ---
    { name: "Fireball",           category: "Shot", price: 5.0,  availableAt: ALL },
    { name: "Jägermeister",       category: "Shot", price: 6.0,  availableAt: ALL },
    { name: "Tequila",            category: "Shot", price: 6.5,  availableAt: ALL },
    { name: "Grey Goose",         category: "Shot", price: 8.0,  availableAt: ALL },
    { name: "Patron Silver",      category: "Shot", price: 9.0,  availableAt: ALL },
    { name: "Jameson",            category: "Shot", price: 7.0,  availableAt: ALL },
    { name: "Jack Daniels",       category: "Shot", price: 6.5,  availableAt: ALL },
    { name: "Crown Royal",        category: "Shot", price: 7.5,  availableAt: ALL },
    { name: "Hennessy",           category: "Shot", price: 9.0,  availableAt: ALL },
    { name: "Rumple Minze",       category: "Shot", price: 7.0,  availableAt: ALL },
    { name: "Goldschläger",       category: "Shot", price: 7.0,  availableAt: ALL },
    { name: "Lemon Drop",         category: "Shot", price: 6.5,  availableAt: ALL },
    { name: "Kamikaze",           category: "Shot", price: 6.0,  availableAt: ALL },
    { name: "B-52",               category: "Shot", price: 7.0,  availableAt: ALL },

    // --- Wine ---
    { name: "House Cabernet",     category: "Wine", price: 7.0,  availableAt: ALL },
    { name: "House Merlot",       category: "Wine", price: 7.0,  availableAt: ALL },
    { name: "House Pinot Noir",   category: "Wine", price: 7.5,  availableAt: ALL },
    { name: "House Chardonnay",   category: "Wine", price: 7.0,  availableAt: ALL },
    { name: "House Pinot Grigio", category: "Wine", price: 7.0,  availableAt: ALL },
    { name: "House Riesling",     category: "Wine", price: 7.5,  availableAt: ALL },
    { name: "Moscato",            category: "Wine", price: 7.5,  availableAt: ALL },
    { name: "Rosé",               category: "Wine", price: 8.0,  availableAt: ALL },
    { name: "Prosecco",           category: "Wine", price: 8.5,  availableAt: ALL },

    // --- Non-Alcoholic ---
    { name: "Pepsi",              category: "Non-Alcoholic", price: 2.5,  availableAt: ALL },
    { name: "Diet Pepsi",         category: "Non-Alcoholic", price: 2.5,  availableAt: ALL },
    { name: "Mountain Dew",       category: "Non-Alcoholic", price: 2.5,  availableAt: ALL },
    { name: "Sprite",             category: "Non-Alcoholic", price: 2.5,  availableAt: ALL },
    { name: "Ginger Ale",         category: "Non-Alcoholic", price: 2.5,  availableAt: ALL },
    { name: "Lemonade",           category: "Non-Alcoholic", price: 3.0,  availableAt: ALL },
    { name: "Cranberry Juice",    category: "Non-Alcoholic", price: 3.0,  availableAt: ALL },
    { name: "Orange Juice",       category: "Non-Alcoholic", price: 3.0,  availableAt: ALL },
    { name: "Red Bull",           category: "Non-Alcoholic", price: 4.5,  availableAt: ALL },
    { name: "Water",              category: "Non-Alcoholic", price: 0.0,  availableAt: ALL },
    { name: "Coffee",             category: "Non-Alcoholic", price: 3.0,  availableAt: ALL },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({ data: item });
  }
  console.log(`  Created ${menuItems.length} menu items`);

  // --- Sample tabs ---
  await prisma.tab.create({
    data: {
      customerName: "Lane 7 Party", laneNumber: 7, barLocation: "I_BAR", createdById: server1.id,
      lineItems: {
        create: [
          { description: "Bud Light Draft", category: "Beer - Draft", quantity: 3, unitPrice: 5.0, routeTo: "I_BAR", status: "SENT" },
          { description: "Margarita", category: "Cocktail", quantity: 2, unitPrice: 9.5, routeTo: "SERVICE_BAR", status: "PENDING" },
        ],
      },
    },
  });

  await prisma.tab.create({
    data: {
      customerName: "Walk-in - Mike", barLocation: "QUICKIE_BAR", createdById: bartender2.id,
      lineItems: {
        create: [
          { description: "Jack & Coke", category: "Cocktail", quantity: 1, unitPrice: 8.0, routeTo: "QUICKIE_BAR", status: "SENT" },
        ],
      },
    },
  });

  console.log("  Created 2 sample tabs");
  console.log("Seeding complete!");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
