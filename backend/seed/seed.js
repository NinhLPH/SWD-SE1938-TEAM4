const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

dotenv.config();

const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const createOrderPayload = ({ user, shop, items, paymentMethod, paymentStatus, status }) => {
  const orderItems = items.map(({ product, quantity }) => ({
    product: product._id,
    productName: product.name,
    imageUrl: product.imageUrl,
    unitPriceVnd: product.priceVnd,
    quantity,
    lineTotalVnd: product.priceVnd * quantity,
  }));

  return {
    user: user._id,
    shop: shop._id,
    items: orderItems,
    totalAmountVnd: orderItems.reduce((sum, item) => sum + item.lineTotalVnd, 0),
    paymentMethod,
    paymentStatus,
    status,
    shippingAddress: {
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
    },
  };
};

const seed = async () => {
  await connectDB();

  await Promise.all([
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Product.deleteMany({}),
    Shop.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const [customer, customer2, owner, owner2, owner3, admin] = await User.create([
    {
      fullName: 'Nguyen Customer',
      email: 'customer@example.com',
      phone: '0900000001',
      address: 'District 1, Ho Chi Minh City',
      passwordHash,
      role: 'CUSTOMER',
    },
    {
      fullName: 'Le Thi Buyer',
      email: 'buyer@example.com',
      phone: '0900000004',
      address: 'Cau Giay, Hanoi',
      passwordHash,
      role: 'CUSTOMER',
    },
    {
      fullName: 'Tran Shop Owner',
      email: 'owner@example.com',
      phone: '0900000002',
      address: 'District 3, Ho Chi Minh City',
      passwordHash,
      role: 'SHOP_OWNER',
    },
    {
      fullName: 'Da Lat Farm Owner',
      email: 'dalat@example.com',
      phone: '0900000005',
      address: 'Da Lat, Lam Dong',
      passwordHash,
      role: 'SHOP_OWNER',
    },
    {
      fullName: 'Mekong Fruit Owner',
      email: 'mekong@example.com',
      phone: '0900000006',
      address: 'Cai Be, Tien Giang',
      passwordHash,
      role: 'SHOP_OWNER',
    },
    {
      fullName: 'Admin User',
      email: 'admin@example.com',
      phone: '0900000003',
      address: 'Hanoi',
      passwordHash,
      role: 'ADMIN',
    },
  ]);

  const [saigonShop, dalatShop, mekongShop] = await Shop.create([
    {
      owner: owner._id,
      name: 'Fresh Saigon Fruits',
      description: 'Imported and premium fruit boxes for urban customers.',
      address: 'District 3, Ho Chi Minh City',
      phone: '0900000002',
      status: 'APPROVED',
    },
    {
      owner: owner2._id,
      name: 'Da Lat Garden',
      description: 'Cool-climate berries, avocado, persimmon, and seasonal produce.',
      address: 'Da Lat, Lam Dong',
      phone: '0900000005',
      status: 'APPROVED',
    },
    {
      owner: owner3._id,
      name: 'Mekong Orchard',
      description: 'Fresh tropical fruits harvested from Mekong Delta gardens.',
      address: 'Cai Be, Tien Giang',
      phone: '0900000006',
      status: 'APPROVED',
    },
  ]);

  const categoryNames = ['Apple', 'Citrus', 'Tropical', 'Berry', 'Melon', 'Grape', 'Stone Fruit', 'Gift Box'];
  const categories = await Category.create(categoryNames.map((name) => ({
    name,
    slug: slugify(name),
  })));
  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  const productSeeds = [
    [saigonShop, owner, 'Apple', 'Fuji Apple', 'Crisp imported Fuji apples.', 'Japan', 45000, 120, 4.6, image('photo-1560806887-1e4cd0b6cbd6')],
    [saigonShop, owner, 'Apple', 'Envy Apple', 'Large sweet apples for gifting.', 'New Zealand', 72000, 65, 4.7, image('photo-1570913149827-d2ac84ab3f9a')],
    [saigonShop, owner, 'Citrus', 'Australian Navel Orange', 'Juicy seedless orange.', 'Australia', 52000, 90, 4.4, image('photo-1582979512210-99b6a53386f9')],
    [saigonShop, owner, 'Grape', 'Seedless Green Grape', 'Crunchy imported grapes.', 'USA', 115000, 45, 4.5, image('photo-1537640538966-79f369143f8f')],
    [saigonShop, owner, 'Gift Box', 'Premium Office Fruit Box', 'Mixed seasonal fruits for office meetings.', 'Vietnam', 299000, 25, 4.9, image('photo-1610832958506-aa56368176cf')],
    [saigonShop, owner, 'Berry', 'Blueberry Pack', 'Fresh blueberries in 125g packs.', 'Peru', 89000, 70, 4.3, image('photo-1498557850523-fd3d118b962e')],
    [saigonShop, owner, 'Citrus', 'Korean Hallabong', 'Fragrant premium citrus.', 'Korea', 138000, 30, 4.8, image('photo-1603664454146-50b9bb1e7afa')],
    [saigonShop, owner, 'Gift Box', 'Family Weekend Basket', 'Balanced fruit basket for families.', 'Vietnam', 420000, 12, 4.6, image('photo-1542838132-92c53300491e')],
    [dalatShop, owner2, 'Berry', 'Da Lat Strawberry', 'Sweet strawberries from greenhouse farms.', 'Da Lat', 125000, 55, 4.8, image('photo-1464965911861-746a04b4bca6')],
    [dalatShop, owner2, 'Tropical', 'Da Lat Avocado', 'Creamy booth avocado.', 'Da Lat', 68000, 75, 4.5, image('photo-1523049673857-eb18f1d7b578')],
    [dalatShop, owner2, 'Stone Fruit', 'Crispy Persimmon', 'Seasonal persimmons with firm texture.', 'Da Lat', 79000, 40, 4.4, image('photo-1607349913338-fca6f7fc42d0')],
    [dalatShop, owner2, 'Berry', 'Mulberry Box', 'Dark mulberries for juice and desserts.', 'Da Lat', 65000, 34, 4.1, image('photo-1596591868231-05e82e63c8a0')],
    [dalatShop, owner2, 'Melon', 'Mini Cantaloupe', 'Aromatic mini melon.', 'Lam Dong', 59000, 47, 4.2, image('photo-1571575173700-afb9492e6a50')],
    [dalatShop, owner2, 'Gift Box', 'Da Lat Premium Set', 'Strawberry, avocado, and seasonal picks.', 'Da Lat', 360000, 18, 4.7, image('photo-1619566636858-adf3ef46400b')],
    [dalatShop, owner2, 'Tropical', 'Passion Fruit', 'Tangy passion fruit for drinks.', 'Lam Dong', 42000, 110, 4.3, image('photo-1604495772376-9657f0035eb5')],
    [dalatShop, owner2, 'Apple', 'Rose Apple', 'Local wax apple, fresh and crunchy.', 'Vietnam', 36000, 88, 4.0, image('photo-1577234286642-fc512a5f8f11')],
    [mekongShop, owner3, 'Tropical', 'Cat Chu Mango', 'Sweet Vietnamese mangoes.', 'Dong Thap', 38000, 80, 4.8, image('photo-1553279768-865429fa0078')],
    [mekongShop, owner3, 'Tropical', 'Ri6 Durian Pack', 'Selected durian pulp, packed chilled.', 'Tien Giang', 185000, 22, 4.9, image('photo-1629738565313-8260a2e4d65a')],
    [mekongShop, owner3, 'Tropical', 'Queen Pineapple', 'Small sweet pineapples.', 'Tien Giang', 28000, 130, 4.4, image('photo-1550258987-190a2d41a8ba')],
    [mekongShop, owner3, 'Tropical', 'Red Flesh Dragon Fruit', 'Bright dragon fruit from Binh Thuan.', 'Binh Thuan', 32000, 95, 4.2, image('photo-1527325678964-54921661f888')],
    [mekongShop, owner3, 'Citrus', 'Nam Roi Pomelo', 'Sweet pomelo with easy-peel segments.', 'Vinh Long', 46000, 62, 4.6, image('photo-1590502593747-42a996133562')],
    [mekongShop, owner3, 'Tropical', 'Longan Bunch', 'Fresh longan bunches.', 'Hung Yen', 54000, 70, 4.1, image('photo-1622205313162-be1d5712a43d')],
    [mekongShop, owner3, 'Tropical', 'Rambutan', 'Juicy rambutan from southern farms.', 'Ben Tre', 39000, 85, 4.2, image('photo-1621955964441-c173e01c135b')],
    [mekongShop, owner3, 'Melon', 'Watermelon', 'Large red watermelon.', 'Long An', 19000, 150, 4.3, image('photo-1589984662646-e7b2e4962f18')],
    [saigonShop, owner, 'Apple', 'Hidden Test Apple', 'Hidden product for shop-owner management testing.', 'Test', 10000, 5, 0, image('photo-1567306226416-28f0efdc88ce'), 'HIDDEN'],
    [mekongShop, owner3, 'Tropical', 'Deleted Sample Mango', 'Soft deleted product sample.', 'Test', 10000, 1, 0, image('photo-1553279768-865429fa0078'), 'DELETED'],
  ];

  const products = await Product.create(productSeeds.map(([
    shop,
    createdBy,
    categoryName,
    name,
    description,
    origin,
    priceVnd,
    stockQuantity,
    averageRating,
    imageUrl,
    status = 'ACTIVE',
  ]) => ({
    shop: shop._id,
    category: categoryByName[categoryName]._id,
    createdBy: createdBy._id,
    name,
    description,
    origin,
    priceVnd,
    stockQuantity,
    averageRating,
    imageUrl,
    status,
  })));

  const productByName = Object.fromEntries(products.map((product) => [product.name, product]));

  await Cart.create([
    {
      user: customer._id,
      items: [
        { product: productByName['Fuji Apple']._id, quantity: 2 },
        { product: productByName['Da Lat Strawberry']._id, quantity: 1 },
        { product: productByName['Nam Roi Pomelo']._id, quantity: 2 },
      ],
    },
    {
      user: customer2._id,
      items: [
        { product: productByName['Cat Chu Mango']._id, quantity: 3 },
        { product: productByName['Queen Pineapple']._id, quantity: 4 },
      ],
    },
  ]);

  const orderPayloads = [
    createOrderPayload({
      user: customer,
      shop: saigonShop,
      items: [
        { product: productByName['Envy Apple'], quantity: 2 },
        { product: productByName['Premium Office Fruit Box'], quantity: 1 },
      ],
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      status: 'PENDING',
    }),
    createOrderPayload({
      user: customer,
      shop: dalatShop,
      items: [
        { product: productByName['Da Lat Strawberry'], quantity: 2 },
        { product: productByName['Da Lat Avocado'], quantity: 3 },
      ],
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      status: 'SHIPPING',
    }),
    createOrderPayload({
      user: customer2,
      shop: mekongShop,
      items: [
        { product: productByName['Cat Chu Mango'], quantity: 5 },
        { product: productByName['Red Flesh Dragon Fruit'], quantity: 4 },
      ],
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      status: 'CONFIRMED',
    }),
    createOrderPayload({
      user: customer2,
      shop: saigonShop,
      items: [
        { product: productByName['Family Weekend Basket'], quantity: 1 },
      ],
      paymentMethod: 'ONLINE',
      paymentStatus: 'PAID',
      status: 'DELIVERED',
    }),
  ];

  const orders = await Order.create(orderPayloads);
  await Payment.create([
    {
      orders: [orders[0]._id],
      user: customer._id,
      provider: 'COD',
      transactionId: 'COD-DEMO-0001',
      amountVnd: orders[0].totalAmountVnd,
      status: 'PENDING',
    },
    {
      orders: [orders[1]._id],
      user: customer._id,
      provider: 'MOCK',
      transactionId: 'MOCK-DEMO-PAID-0002',
      amountVnd: orders[1].totalAmountVnd,
      status: 'PAID',
      callbackEvents: [{ eventId: 'seed-paid-0002', payloadHash: 'seed' }],
    },
    {
      orders: [orders[2]._id],
      user: customer2._id,
      provider: 'COD',
      transactionId: 'COD-DEMO-0003',
      amountVnd: orders[2].totalAmountVnd,
      status: 'PENDING',
    },
    {
      orders: [orders[3]._id],
      user: customer2._id,
      provider: 'MOCK',
      transactionId: 'MOCK-DEMO-PAID-0004',
      amountVnd: orders[3].totalAmountVnd,
      status: 'PAID',
      callbackEvents: [{ eventId: 'seed-paid-0004', payloadHash: 'seed' }],
    },
  ]);

  console.log('Seed completed');
  console.log('Accounts:');
  console.log('customer@example.com, buyer@example.com, owner@example.com, dalat@example.com, mekong@example.com, admin@example.com');
  console.log('Password for all accounts: Password123!');
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
