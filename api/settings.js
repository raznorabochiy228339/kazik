
module.exports = {
  cases: [
    { id: 1, name: "Bronze", price: 50, emoji: "🥉", drops: [
      { name: "Small Gift", price: 20 },
      { name: "Medium Gift", price: 50 },
      { name: "Rare Gift", price: 120 }
    ]},
    { id: 2, name: "Silver", price: 100, emoji: "🥈", drops: [
      { name: "Small Gift", price: 40 },
      { name: "Medium Gift", price: 100 },
      { name: "Rare Gift", price: 240 }
    ]},
    { id: 3, name: "Gold", price: 200, emoji: "🥇", drops: [
      { name: "Gift", price: 100 },
      { name: "Big Gift", price: 200 },
      { name: "Legendary Gift", price: 500 }
    ]},
    { id: 4, name: "Diamond", price: 400, emoji: "💎", drops: [
      { name: "Gift", price: 200 },
      { name: "Big Gift", price: 400 },
      { name: "Legendary Gift", price: 1000 }
    ]},
    { id: 5, name: "Platinum", price: 800, emoji: "🔮", drops: [
      { name: "Gift", price: 400 },
      { name: "Big Gift", price: 800 },
      { name: "Legendary Gift", price: 2000 }
    ]},
    { id: 6, name: "Ultimate", price: 1500, emoji: "🔥", drops: [
      { name: "Gift", price: 800 },
      { name: "Big Gift", price: 1500 },
      { name: "Legendary Gift", price: 5000 }
    ]}
  ],
  promocodes: {
    "FREE100": 100,
    "START50": 50
  },
  admins: [1]
}
