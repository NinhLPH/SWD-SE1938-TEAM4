const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const { Cart, CartItem, Category, InventoryTransaction, Order, OrderItem, Payment, Product, Shop, User } = require('../models');

dotenv.config();

// Chuyển tên danh mục thành slug đơn giản dùng cho dữ liệu mẫu.
const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

// Tạo URL ảnh Unsplash cho sản phẩm mẫu.
const image = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

// Tạo đơn hàng mẫu kèm snapshot item.
const createOrder = async ({ user, shop, items, paymentMethod, paymentStatus, status }) => {
  const orderItems = items.map(({ product, quantity }) => ({
    productId: product._id,
    productName: product.name,
    imageUrl: product.imageUrl,
    unitPriceVnd: product.priceVnd,
    quantity,
    lineTotalVnd: product.priceVnd * quantity,
  }));

  const order = await Order.create({
    userId: user._id,
    shopId: shop._id,
    totalAmountVnd: orderItems.reduce((sum, item) => sum + item.lineTotalVnd, 0),
    paymentMethod,
    paymentStatus,
    status,
    shippingAddress: {
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
    },
  });

  await OrderItem.bulkCreate(orderItems.map((item) => ({
    ...item,
    orderId: order._id,
  })));

  return Order.findByPk(order._id, { include: [{ model: OrderItem, as: 'items' }] });
};

// Reset database và nạp dữ liệu mẫu cho tài khoản, shop, sản phẩm, giỏ hàng, đơn hàng.
const seed = async () => {
  await connectDB();
  await connectDB.sequelize.sync({ force: true });

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const users = await User.bulkCreate([
    { fullName: 'Nguyen Customer', email: 'customer@example.com', phone: '0900000001', address: 'District 1, Ho Chi Minh City', passwordHash, role: 'CUSTOMER' },
    { fullName: 'Le Thi Buyer', email: 'buyer@example.com', phone: '0900000004', address: 'Cau Giay, Hanoi', passwordHash, role: 'CUSTOMER' },
    { fullName: 'Tran Shop Owner', email: 'owner@example.com', phone: '0900000002', address: 'District 3, Ho Chi Minh City', passwordHash, role: 'SHOP_OWNER' },
    { fullName: 'Da Lat Farm Owner', email: 'dalat@example.com', phone: '0900000005', address: 'Da Lat, Lam Dong', passwordHash, role: 'SHOP_OWNER' },
    { fullName: 'Mekong Fruit Owner', email: 'mekong@example.com', phone: '0900000006', address: 'Cai Be, Tien Giang', passwordHash, role: 'SHOP_OWNER' },
    { fullName: 'Admin User', email: 'admin@example.com', phone: '0900000003', address: 'Hanoi', passwordHash, role: 'ADMIN' },
  ]);
  const [customer, customer2, owner, owner2, owner3] = users;

  const shops = await Shop.bulkCreate([
    { ownerId: owner._id, name: 'Fresh Saigon Fruits', description: 'Imported and premium fruit boxes.', address: 'District 3, Ho Chi Minh City', phone: '0900000002', status: 'APPROVED' },
    { ownerId: owner2._id, name: 'Da Lat Garden', description: 'Cool-climate berries and seasonal produce.', address: 'Da Lat, Lam Dong', phone: '0900000005', status: 'APPROVED' },
    { ownerId: owner3._id, name: 'Mekong Orchard', description: 'Fresh tropical fruits from Mekong Delta gardens.', address: 'Cai Be, Tien Giang', phone: '0900000006', status: 'APPROVED' },
  ]);
  const [saigonShop, dalatShop, mekongShop] = shops;

  const categoryNames = ['Apple', 'Citrus', 'Tropical', 'Berry', 'Melon', 'Grape', 'Stone Fruit', 'Gift Box'];
  const categories = await Category.bulkCreate(categoryNames.map((name) => ({ name, slug: slugify(name) })));
  const categoryByName = Object.fromEntries(categories.map((category) => [category.name, category]));

  const productSeeds = [
    [saigonShop, owner, 'Apple', 'Fuji Apple', 'Crisp imported Fuji apples.', 'Japan', 45000, 120, 4.6, image('photo-1560806887-1e4cd0b6cbd6')],
    [saigonShop, owner, 'Apple', 'Envy Apple', 'Large sweet apples for gifting.', 'New Zealand', 72000, 65, 4.7, image('photo-1570913149827-d2ac84ab3f9a')],
    [saigonShop, owner, 'Citrus', 'Australian Navel Orange', 'Juicy seedless orange.', 'Australia', 52000, 90, 4.4, image('photo-1582979512210-99b6a53386f9')],
    [saigonShop, owner, 'Grape', 'Seedless Green Grape', 'Crunchy imported grapes.', 'USA', 115000, 45, 4.5, image('photo-1537640538966-79f369143f8f')],
    [saigonShop, owner, 'Gift Box', 'Premium Office Fruit Box', 'Mixed seasonal fruits for office meetings.', 'Vietnam', 299000, 25, 4.9, image('photo-1610832958506-aa56368176cf')],
    [dalatShop, owner2, 'Berry', 'Da Lat Strawberry', 'Sweet strawberries from greenhouse farms.', 'Da Lat', 125000, 55, 4.8, image('photo-1464965911861-746a04b4bca6')],
    [dalatShop, owner2, 'Tropical', 'Da Lat Avocado', 'Creamy booth avocado.', 'Da Lat', 68000, 75, 4.5, image('photo-1523049673857-eb18f1d7b578')],
    [dalatShop, owner2, 'Stone Fruit', 'Crispy Persimmon', 'Seasonal persimmons with firm texture.', 'Da Lat', 79000, 40, 4.4, image('photo-1607349913338-fca6f7fc42d0')],
    [dalatShop, owner2, 'Melon', 'Mini Cantaloupe', 'Aromatic mini melon.', 'Lam Dong', 59000, 47, 4.2, image('photo-1571575173700-afb9492e6a50')],
    [mekongShop, owner3, 'Tropical', 'Cat Chu Mango', 'Sweet Vietnamese mangoes.', 'Dong Thap', 38000, 80, 4.8, image('photo-1553279768-865429fa0078')],
    [mekongShop, owner3, 'Tropical', 'Ri6 Durian Pack', 'Selected durian pulp, packed chilled.', 'Tien Giang', 185000, 22, 4.9, image('photo-1629738565313-8260a2e4d65a')],
    [mekongShop, owner3, 'Tropical', 'Queen Pineapple', 'Small sweet pineapples.', 'Tien Giang', 28000, 130, 4.4, image('photo-1550258987-190a2d41a8ba')],
    [mekongShop, owner3, 'Tropical', 'Red Flesh Dragon Fruit', 'Bright dragon fruit from Binh Thuan.', 'Binh Thuan', 32000, 95, 4.2, image('photo-1527325678964-54921661f888')],
    [mekongShop, owner3, 'Citrus', 'Nam Roi Pomelo', 'Sweet pomelo with easy-peel segments.', 'Vinh Long', 46000, 62, 4.6, image('photo-1590502593747-42a996133562')],
    [mekongShop, owner3, 'Melon', 'Watermelon', 'Large red watermelon.', 'Long An', 19000, 150, 4.3, image('photo-1589984662646-e7b2e4962f18')],
  ];

  const products = await Product.bulkCreate(productSeeds.map(([
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
  ]) => ({
    shopId: shop._id,
    categoryId: categoryByName[categoryName]._id,
    createdById: createdBy._id,
    name,
    description,
    origin,
    priceVnd,
    stockQuantity,
    averageRating,
    imageUrl,
    status: 'ACTIVE',
  })));
  const productByName = Object.fromEntries(products.map((product) => [product.name, product]));

  await InventoryTransaction.bulkCreate([
    {
      productId: productByName['Fuji Apple']._id,
      userId: owner._id,
      transactionType: 'STOCK_IN',
      quantity: 40,
      quantityBefore: 80,
      quantityAfter: 120,
      note: 'Initial imported apple batch',
    },
    {
      productId: productByName['Premium Office Fruit Box']._id,
      userId: owner._id,
      transactionType: 'STOCK_IN',
      quantity: 10,
      quantityBefore: 15,
      quantityAfter: 25,
      note: 'Prepared gift boxes for weekly sale',
    },
    {
      productId: productByName['Da Lat Strawberry']._id,
      userId: owner2._id,
      transactionType: 'STOCK_IN',
      quantity: 20,
      quantityBefore: 35,
      quantityAfter: 55,
      note: 'Morning greenhouse delivery',
    },
    {
      productId: productByName['Cat Chu Mango']._id,
      userId: owner3._id,
      transactionType: 'STOCK_IN',
      quantity: 30,
      quantityBefore: 50,
      quantityAfter: 80,
      note: 'Fresh mangoes from orchard',
    },
  ]);

  const cart = await Cart.create({ userId: customer._id });
  await CartItem.bulkCreate([
    { cartId: cart._id, productId: productByName['Fuji Apple']._id, quantity: 2 },
    { cartId: cart._id, productId: productByName['Da Lat Strawberry']._id, quantity: 1 },
    { cartId: cart._id, productId: productByName['Nam Roi Pomelo']._id, quantity: 2 },
  ]);
  const cart2 = await Cart.create({ userId: customer2._id });
  await CartItem.bulkCreate([
    { cartId: cart2._id, productId: productByName['Cat Chu Mango']._id, quantity: 3 },
    { cartId: cart2._id, productId: productByName['Queen Pineapple']._id, quantity: 4 },
  ]);

  const orders = await Promise.all([
    createOrder({ user: customer, shop: saigonShop, items: [{ product: productByName['Envy Apple'], quantity: 2 }, { product: productByName['Premium Office Fruit Box'], quantity: 1 }], paymentMethod: 'COD', paymentStatus: 'PENDING', status: 'PENDING' }),
    createOrder({ user: customer, shop: dalatShop, items: [{ product: productByName['Da Lat Strawberry'], quantity: 2 }, { product: productByName['Da Lat Avocado'], quantity: 3 }], paymentMethod: 'ONLINE', paymentStatus: 'PAID', status: 'SHIPPING' }),
    createOrder({ user: customer2, shop: mekongShop, items: [{ product: productByName['Cat Chu Mango'], quantity: 5 }, { product: productByName['Red Flesh Dragon Fruit'], quantity: 4 }], paymentMethod: 'COD', paymentStatus: 'PENDING', status: 'CONFIRMED' }),
  ]);

  await Payment.bulkCreate([
    { orderIds: [orders[0]._id], userId: customer._id, provider: 'COD', transactionId: 'COD-DEMO-0001', amountVnd: orders[0].totalAmountVnd, status: 'PENDING' },
    { orderIds: [orders[1]._id], userId: customer._id, provider: 'MOCK', transactionId: 'MOCK-DEMO-PAID-0002', amountVnd: orders[1].totalAmountVnd, status: 'PAID', callbackEvents: [{ eventId: 'seed-paid-0002', payloadHash: 'seed' }] },
    { orderIds: [orders[2]._id], userId: customer2._id, provider: 'COD', transactionId: 'COD-DEMO-0003', amountVnd: orders[2].totalAmountVnd, status: 'PENDING' },
  ]);

  console.log('SQL Server seed completed');
  console.log('Accounts: customer@example.com, buyer@example.com, owner@example.com, dalat@example.com, mekong@example.com, admin@example.com');
  console.log('Password for all accounts: Password123!');
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await connectDB.sequelize.close();
  });
