import { db } from "./db";
import { users, products, chats, messages, statusUpdates, notifications } from "@shared/schema";

export async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Create sample users
    const sampleUsers = await db.insert(users).values([
      {
        username: "gamer_pro",
        email: "gamer@example.com",
        password: "hashedpassword123",
        role: "seller",
        displayName: "Pro Gamer",
        bio: "Professional Mobile Legends player with 500+ skins",
        isVerified: true,
        walletBalance: "2500000"
      },
      {
        username: "buyer_123",
        email: "buyer@example.com", 
        password: "hashedpassword456",
        role: "buyer",
        displayName: "Gaming Enthusiast",
        bio: "Looking for premium gaming accounts",
        walletBalance: "1000000"
      },
      {
        username: "seller_ml",
        email: "seller@example.com",
        password: "hashedpassword789",
        role: "seller", 
        displayName: "ML Account Seller",
        bio: "Selling high-tier Mobile Legends accounts",
        isVerified: true,
        walletBalance: "5000000"
      }
    ]).returning();

    // Create sample products
    const sampleProducts = await db.insert(products).values([
      {
        sellerId: sampleUsers[0].id,
        title: "Mobile Legends Epic Account - 54 Skins",
        description: "Mythic rank account with 54 premium skins including Collector and Starlight skins. All heroes unlocked. High win rate and excellent stats.",
        category: "mobile_legends",
        price: "2500000",
        thumbnail: "https://images.unsplash.com/photo-1556438064-2d7646166914?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        images: [
          "https://images.unsplash.com/photo-1556438064-2d7646166914?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600",
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"
        ],
        gameData: {
          rank: "Mythic",
          totalSkins: 54,
          heroes: "All heroes unlocked",
          winRate: "75%"
        },
        isPremium: true,
        rating: "4.9",
        reviewCount: 23
      },
      {
        sellerId: sampleUsers[2].id,
        title: "PUBG Mobile Conqueror Account",
        description: "Season 20 Conqueror rank with rare outfits and maxed weapons. Premium crates opened. Perfect for competitive players.",
        category: "pubg_mobile",
        price: "1800000",
        thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        images: [
          "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"
        ],
        gameData: {
          rank: "Conqueror",
          season: "Season 20",
          kd: "3.2",
          wins: "450+"
        },
        isPremium: false,
        rating: "4.7",
        reviewCount: 15
      },
      {
        sellerId: sampleUsers[0].id,
        title: "Free Fire Diamond Account - Elite Pass Maxed",
        description: "Account with 5000+ diamonds, rare bundles, and elite pass maxed. High rank with exclusive items.",
        category: "free_fire",
        price: "450000",
        thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        images: [
          "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"
        ],
        gameData: {
          diamonds: "5000+",
          rank: "Heroic",
          level: "65",
          badges: "Multiple"
        },
        isPremium: false,
        rating: "4.5",
        reviewCount: 8
      },
      {
        sellerId: sampleUsers[2].id,
        title: "Valorant Immortal Account - Premium Skins",
        description: "Immortal rank account with Phantom and Vandal premium skins. Battle pass completed with exclusive items.",
        category: "valorant", 
        price: "3200000",
        thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        images: [
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"
        ],
        gameData: {
          rank: "Immortal",
          rr: "2850",
          skins: "Premium collection",
          agents: "All unlocked"
        },
        isPremium: true,
        rating: "4.8",
        reviewCount: 12
      }
    ]).returning();

    // Create sample status updates
    await db.insert(statusUpdates).values([
      {
        userId: sampleUsers[0].id,
        content: "Just got Mythic rank! 🎮",
        media: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
        mediaType: "image",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      },
      {
        userId: sampleUsers[2].id,
        content: "New gaming setup! 💪",
        media: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
        mediaType: "image",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ]);

    // Create sample notifications
    await db.insert(notifications).values([
      {
        userId: sampleUsers[1].id,
        title: "New Product Available",
        message: "Mobile Legends Epic Account just listed!",
        type: "order"
      },
      {
        userId: sampleUsers[0].id,
        title: "Product Interest",
        message: "Someone viewed your PUBG account",
        type: "message"
      }
    ]);

    console.log("Database seeded successfully!");
    console.log(`Created ${sampleUsers.length} users`);
    console.log(`Created ${sampleProducts.length} products`);
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}